import { customAlphabet, nanoid } from 'nanoid'
import {
  DEFAULT_SETTINGS,
  DIFFICULTY_ORDER,
  PLAYER_COLORS,
  SCORING,
  type AnswerStatus,
  type BuzzEntry,
  type CategoryOption,
  type CueType,
  type CurrentQuestionPublic,
  type Difficulty,
  type GameSettings,
  type LiveQuestionInput,
  type Phase,
  type Player,
  type PublicGameState,
  type Question,
  type RoundResult,
  type TimerState,
} from '@quiz/shared'
import { SEED_QUESTIONS } from './questions.js'

// Sammelfenster nach dem ersten Buzz: gleicht Netzwerk-Jitter aus, damit der
// frueheste Tastendruck (Client-Zeitstempel) gewinnt - nicht das schnellste Netz.
const BUZZ_WINDOW_MS = 250

export interface RoomEmitter {
  broadcastState(state: PublicGameState): void
  ttsStart(p: { questionId: string; text: string; rate: number; lang: string }): void
  ttsStop(): void
  cue(type: CueType): void
  privateAnswer(playerId: string, p: { questionId: string; answer: string }): void
}

interface InternalBuzz {
  playerId: string
  normalizedMs: number
  serverRecvMs: number
  status: AnswerStatus
}

const genRoomCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4)

export function newRoomCode(): string {
  return genRoomCode()
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export class GameEngine {
  readonly roomCode: string
  private emitter: RoomEmitter

  private players = new Map<string, Player>()
  private settings: GameSettings = { ...DEFAULT_SETTINGS }

  private phase: Phase = 'lobby'
  private round = 0
  hostId: string | null = null

  private bank: Question[]
  private usedQuestionIds = new Set<string>()

  private categoryOptions: CategoryOption[] = []
  private votes = new Map<string, string>() // playerId -> optionId
  private voteResolved = false

  private currentQuestion: Question | null = null
  private currentPoints = 0
  private answerRevealed = false

  private dropStartMs = 0
  private buzzingOpen = false
  private buzzes: InternalBuzz[] = []
  private buzzWindowHandle: ReturnType<typeof setTimeout> | null = null
  private activePlayerId: string | null = null

  private timer: TimerState | null = null
  private timerHandle: ReturnType<typeof setTimeout> | null = null

  private lastResult: RoundResult | null = null

  constructor(emitter: RoomEmitter, code?: string) {
    this.emitter = emitter
    this.roomCode = code ?? genRoomCode()
    this.bank = SEED_QUESTIONS.map((q) => ({ ...q }))
  }

  // ----- Player management -----------------------------------------------

  get playerCount(): number {
    return this.players.size
  }

  get connectedCount(): number {
    return [...this.players.values()].filter((p) => p.connected).length
  }

  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId)
  }

  isModerator(playerId: string): boolean {
    return this.players.get(playerId)?.isModerator ?? false
  }

  addPlayer(name: string, asModerator: boolean): Player {
    const id = nanoid()
    const usedColors = new Set([...this.players.values()].map((p) => p.color))
    const color =
      PLAYER_COLORS.find((c) => !usedColors.has(c)) ??
      PLAYER_COLORS[this.players.size % PLAYER_COLORS.length]
    const player: Player = {
      id,
      name: name.trim().slice(0, 24) || 'Spieler',
      score: 0,
      connected: true,
      isModerator: asModerator,
      color,
      joinedAt: Date.now(),
    }
    this.players.set(id, player)
    if (asModerator && !this.hostId) this.hostId = id
    return player
  }

  reconnectPlayer(playerId: string): boolean {
    const p = this.players.get(playerId)
    if (!p) return false
    p.connected = true
    return true
  }

  setConnected(playerId: string, connected: boolean): void {
    const p = this.players.get(playerId)
    if (p) p.connected = connected
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId)
    this.votes.delete(playerId)
    this.buzzes = this.buzzes.filter((b) => b.playerId !== playerId)
    if (this.activePlayerId === playerId) {
      this.activePlayerId = this.firstPendingPlayerId()
    }
  }

  // ----- Helpers ----------------------------------------------------------

  private contestants(): Player[] {
    return [...this.players.values()].filter((p) => !p.isModerator)
  }

  private bankCategories(): string[] {
    return [...new Set(this.bank.map((q) => q.category))]
  }

  private availableCells(): CategoryOption[] {
    const cells: CategoryOption[] = []
    for (const cat of this.bankCategories()) {
      for (const diff of DIFFICULTY_ORDER) {
        const hasUnused = this.bank.some(
          (q) => q.category === cat && q.difficulty === diff && !this.usedQuestionIds.has(q.id),
        )
        if (hasUnused) {
          cells.push({
            id: nanoid(8),
            category: cat,
            difficulty: diff,
            points: SCORING[diff].points,
          })
        }
      }
    }
    return cells
  }

  private firstPendingPlayerId(): string | null {
    const next = this.buzzes.find((b) => b.status === 'pending')
    return next ? next.playerId : null
  }

  private sortBuzzes(): void {
    this.buzzes.sort((a, b) => a.normalizedMs - b.normalizedMs || a.serverRecvMs - b.serverRecvMs)
  }

  // ----- Timer ------------------------------------------------------------

  private clearTimer(): void {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle)
      this.timerHandle = null
    }
    this.timer = null
  }

  private startTimer(durationMs: number, label: string, onExpire: () => void): void {
    this.clearTimer()
    this.timer = { endsAt: Date.now() + durationMs, durationMs, label }
    this.timerHandle = setTimeout(() => {
      this.timer = null
      this.timerHandle = null
      onExpire()
    }, durationMs)
  }

  // ----- Phase 1: democratic vote ----------------------------------------

  startVote(): void {
    this.clearTimer()
    this.round += 1
    this.phase = 'category'
    this.votes.clear()
    this.voteResolved = false
    this.currentQuestion = null
    this.currentPoints = 0
    this.answerRevealed = false
    this.lastResult = null
    this.resetBuzzState()
    const cells = shuffle(this.availableCells())
    if (cells.length === 0) {
      // Bank erschoepft -> zuruecksetzen, damit weitergespielt werden kann
      this.usedQuestionIds.clear()
    }
    this.categoryOptions = shuffle(this.availableCells()).slice(0, this.settings.optionsPerRound)
    this.emitter.cue('start')
    this.emit()
  }

  castVote(playerId: string, optionId: string): void {
    if (this.phase !== 'category' || this.voteResolved) return
    const player = this.players.get(playerId)
    if (!player || player.isModerator) return
    if (!this.categoryOptions.some((o) => o.id === optionId)) return
    this.votes.set(playerId, optionId)
    // Auto-Resolve sobald alle verbundenen Mitspieler abgestimmt haben
    const contestants = this.contestants().filter((p) => p.connected)
    if (contestants.length > 0 && contestants.every((p) => this.votes.has(p.id))) {
      this.resolveVote()
      return
    }
    this.emit()
  }

  resolveVote(forcedOptionId?: string): void {
    if (this.phase !== 'category') return
    let winner: CategoryOption | undefined
    if (forcedOptionId) {
      winner = this.categoryOptions.find((o) => o.id === forcedOptionId)
    }
    if (!winner) {
      const counts = new Map<string, number>()
      for (const optionId of this.votes.values()) {
        counts.set(optionId, (counts.get(optionId) ?? 0) + 1)
      }
      let max = -1
      const top: string[] = []
      for (const opt of this.categoryOptions) {
        const c = counts.get(opt.id) ?? 0
        if (c > max) {
          max = c
          top.length = 0
          top.push(opt.id)
        } else if (c === max) {
          top.push(opt.id)
        }
      }
      // Gleichstand (oder keine Stimmen) -> Zufall
      const pick = top.length > 0 ? top[Math.floor(Math.random() * top.length)] : this.categoryOptions[0]?.id
      winner = this.categoryOptions.find((o) => o.id === pick)
    }
    if (!winner) return
    this.voteResolved = true
    const question = this.drawQuestion(winner.category, winner.difficulty)
    if (!question) {
      // Sollte dank Reset nicht passieren; bleibe in der Wahl
      this.voteResolved = false
      this.emit()
      return
    }
    this.beginDrop(question, winner.points)
  }

  private drawQuestion(category: string, difficulty: Difficulty): Question | null {
    const tiers: Question[][] = [
      this.bank.filter((q) => q.category === category && q.difficulty === difficulty && !this.usedQuestionIds.has(q.id)),
      this.bank.filter((q) => q.category === category && !this.usedQuestionIds.has(q.id)),
      this.bank.filter((q) => !this.usedQuestionIds.has(q.id)),
      this.bank,
    ]
    for (const tier of tiers) {
      if (tier.length > 0) return tier[Math.floor(Math.random() * tier.length)]
    }
    return null
  }

  // ----- Phase 2: the fair drop ------------------------------------------

  private beginDrop(question: Question, points: number): void {
    this.phase = 'drop'
    this.currentQuestion = question
    this.currentPoints = points
    this.answerRevealed = false
    this.resetBuzzState()
    this.dropStartMs = Date.now()
    this.buzzingOpen = true
    if (this.hostId) {
      this.emitter.privateAnswer(this.hostId, { questionId: question.id, answer: question.answer })
    }
    if (this.settings.ttsEnabled) {
      this.emitter.ttsStart({
        questionId: question.id,
        text: question.ttsText || question.text,
        rate: this.settings.ttsRate,
        lang: this.settings.language,
      })
    }
    this.emit()
  }

  private resetBuzzState(): void {
    this.buzzes = []
    this.activePlayerId = null
    this.buzzingOpen = false
    if (this.buzzWindowHandle) {
      clearTimeout(this.buzzWindowHandle)
      this.buzzWindowHandle = null
    }
  }

  // ----- Buzzer -----------------------------------------------------------

  buzz(playerId: string, normalizedMs: number, _clientTime: number): void {
    if (!this.buzzingOpen) return
    if (this.phase !== 'drop' && this.phase !== 'hotseat') return
    const player = this.players.get(playerId)
    if (!player || player.isModerator) return
    if (this.buzzes.some((b) => b.playerId === playerId)) return

    const now = Date.now()
    const clamped = Math.min(Math.max(normalizedMs, this.dropStartMs), now)
    this.buzzes.push({ playerId, normalizedMs: clamped, serverRecvMs: now, status: 'pending' })
    this.sortBuzzes()

    if (this.phase === 'drop') {
      this.emitter.cue('buzz')
      if (this.buzzWindowHandle === null) {
        // Sammelfenster starten: weitere (fast) gleichzeitige Buzzes einsammeln
        this.buzzWindowHandle = setTimeout(() => {
          this.buzzWindowHandle = null
          this.enterHotseat()
        }, BUZZ_WINDOW_MS)
      }
    }
    this.emit()
  }

  private enterHotseat(): void {
    this.sortBuzzes()
    this.phase = 'hotseat'
    this.emitter.ttsStop()
    this.activePlayerId = this.firstPendingPlayerId()
    if (!this.activePlayerId) {
      this.emit()
      return
    }
    this.startHotseatTimer()
    this.emit()
  }

  private startHotseatTimer(): void {
    const name = this.activePlayerId ? this.players.get(this.activePlayerId)?.name ?? '' : ''
    this.startTimer(this.settings.hotseatSeconds * 1000, name, () => {
      // Zeit abgelaufen = wie eine falsche Antwort
      this.judge(false, true)
    })
  }

  // ----- Phase 3/4: judging & steal --------------------------------------

  judge(correct: boolean, fromTimer = false): void {
    if (this.phase !== 'hotseat' || !this.activePlayerId) return
    const active = this.buzzes.find((b) => b.playerId === this.activePlayerId)
    const player = this.players.get(this.activePlayerId)
    if (!active || !player) return
    this.clearTimer()

    if (correct) {
      active.status = 'correct'
      player.score += this.currentPoints
      this.emitter.cue('correct')
      this.lastResult = {
        correct: true,
        playerId: player.id,
        playerName: player.name,
        pointsDelta: this.currentPoints,
        answer: this.currentQuestion?.answer ?? '',
      }
      this.revealSolution()
      return
    }

    // Falsch -> Strafe (Anti-Glueck) und Steal an den naechsten in der Queue
    active.status = 'wrong'
    const penalty = SCORING[this.currentQuestion?.difficulty ?? 'medium'].penalty
    player.score -= penalty
    this.emitter.cue(fromTimer ? 'wrong' : 'wrong')

    const next = this.firstPendingPlayerId()
    if (next) {
      this.activePlayerId = next
      this.emitter.cue('steal')
      this.startHotseatTimer()
      this.emit()
    } else {
      // Niemand mehr in der Warteschlange
      this.lastResult = {
        correct: false,
        playerId: null,
        playerName: null,
        pointsDelta: 0,
        answer: this.currentQuestion?.answer ?? '',
      }
      this.revealSolution()
    }
  }

  // ----- Phase 5: reveal --------------------------------------------------

  revealSolution(): void {
    if (this.phase === 'lobby' || this.phase === 'category') {
      // Auflösen ohne aktive Frage nicht moeglich
      if (!this.currentQuestion) return
    }
    this.clearTimer()
    this.buzzingOpen = false
    this.answerRevealed = true
    this.phase = 'reveal'
    if (this.currentQuestion) this.usedQuestionIds.add(this.currentQuestion.id)
    if (!this.lastResult && this.currentQuestion) {
      this.lastResult = {
        correct: false,
        playerId: null,
        playerName: null,
        pointsDelta: 0,
        answer: this.currentQuestion.answer,
      }
    }
    this.emitter.cue('reveal')
    this.emit()
  }

  nextRound(): void {
    this.startVote()
  }

  skipQuestion(): void {
    if (this.currentQuestion) this.usedQuestionIds.add(this.currentQuestion.id)
    this.startVote()
  }

  // ----- Moderator actions -----------------------------------------------

  forceCategory(optionId: string): void {
    if (this.phase !== 'category') return
    this.resolveVote(optionId)
  }

  setLiveQuestion(input: LiveQuestionInput): void {
    const difficulty = input.difficulty
    const question: Question = {
      id: 'live-' + nanoid(6),
      category: input.category.trim() || 'Live',
      difficulty,
      text: input.text.trim(),
      answer: input.answer.trim(),
      ttsText: input.ttsText?.trim() || undefined,
    }
    if (!question.text || !question.answer) return
    this.bank.push(question)
    this.lastResult = null
    this.beginDrop(question, SCORING[difficulty].points)
  }

  updateSettings(partial: Partial<GameSettings>): void {
    this.settings = {
      ...this.settings,
      ...partial,
      hotseatSeconds: Math.min(60, Math.max(5, partial.hotseatSeconds ?? this.settings.hotseatSeconds)),
      ttsRate: Math.min(2, Math.max(0.5, partial.ttsRate ?? this.settings.ttsRate)),
      optionsPerRound: Math.min(8, Math.max(2, partial.optionsPerRound ?? this.settings.optionsPerRound)),
    }
    this.emit()
  }

  resetScores(): void {
    for (const p of this.players.values()) p.score = 0
    this.emit()
  }

  kick(playerId: string): void {
    if (playerId === this.hostId) return
    this.removePlayer(playerId)
    this.emit()
  }

  endGame(): void {
    this.clearTimer()
    this.phase = 'gameover'
    this.emit()
  }

  // ----- State broadcast --------------------------------------------------

  getPublicState(): PublicGameState {
    const players = [...this.players.values()].sort((a, b) => b.score - a.score)
    const buzzQueue: BuzzEntry[] = this.buzzes.map((b, idx) => {
      const p = this.players.get(b.playerId)
      return {
        playerId: b.playerId,
        name: p?.name ?? '???',
        color: p?.color ?? '#888',
        normalizedMs: b.normalizedMs,
        serverRecvMs: b.serverRecvMs,
        rank: idx + 1,
        status: b.status,
      }
    })

    let currentQuestion: CurrentQuestionPublic | null = null
    if (this.currentQuestion) {
      currentQuestion = {
        id: this.currentQuestion.id,
        category: this.currentQuestion.category,
        difficulty: this.currentQuestion.difficulty,
        points: this.currentPoints || SCORING[this.currentQuestion.difficulty].points,
        text: this.currentQuestion.text,
        answer: this.answerRevealed ? this.currentQuestion.answer : null,
      }
    }

    return {
      roomCode: this.roomCode,
      phase: this.phase,
      round: this.round,
      hostId: this.hostId,
      players,
      categoryOptions: this.categoryOptions,
      votedPlayerIds: [...this.votes.keys()],
      voteCounts: null,
      currentQuestion,
      ttsActive: this.phase === 'drop' && this.settings.ttsEnabled,
      buzzQueue,
      activePlayerId: this.activePlayerId,
      buzzingOpen: this.buzzingOpen,
      timer: this.timer,
      lastResult: this.lastResult,
      settings: this.settings,
      bankCategories: this.bankCategories(),
      serverTime: Date.now(),
    }
  }

  // Fuer Moderator-Reconnect: aktuelle Loesung erneut zustellen
  getModeratorAnswer(): { questionId: string; answer: string } | null {
    if ((this.phase === 'drop' || this.phase === 'hotseat') && this.currentQuestion) {
      return { questionId: this.currentQuestion.id, answer: this.currentQuestion.answer }
    }
    return null
  }

  private emit(): void {
    this.emitter.broadcastState(this.getPublicState())
  }

  dispose(): void {
    this.clearTimer()
    if (this.buzzWindowHandle) clearTimeout(this.buzzWindowHandle)
  }
}
