import { io, type Socket } from 'socket.io-client'
import type {
  ClientToServerEvents,
  CreateRoomResult,
  GameSettings,
  JoinRoomResult,
  ServerToClientEvents,
} from '@quiz/shared'
import { useGame } from './store'
import { speak, stopSpeaking } from './tts'
import { playCue } from './sound'

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  autoConnect: true,
  transports: ['websocket', 'polling'],
})

// ----- Lifecycle & server events ---------------------------------------

socket.on('connect', () => {
  useGame.getState().setConnected(true)
  void syncClock()
  // Auto-Rejoin nach Reload / Verbindungsabbruch
  const { identity } = useGame.getState()
  if (identity.roomCode && identity.role) {
    if (identity.role === 'spectator') {
      socket.emit('room:spectate', { roomCode: identity.roomCode }, () => {})
    } else if (identity.playerId) {
      socket.emit(
        'room:join',
        { roomCode: identity.roomCode, name: identity.name, avatar: identity.avatar, playerId: identity.playerId },
        (r) => {
          if (r.ok) {
            useGame.getState().setIdentity({ role: r.isModerator ? 'moderator' : 'player' })
          } else {
            useGame.getState().leave()
          }
        },
      )
    }
  }
})

socket.on('disconnect', () => useGame.getState().setConnected(false))

socket.on('state', (s) => {
  const g = useGame.getState()
  g.setState(s)
  const pid = g.identity.playerId
  if (!pid || !s.votedPlayerIds.includes(pid)) g.setMyVote(null)
})

socket.on('tts:start', ({ text, rate, lang }) => speak(text, rate, lang))
socket.on('tts:stop', () => stopSpeaking())
socket.on('mod:answer', (p) => useGame.getState().setModAnswer(p))
socket.on('cue', ({ type }) => {
  playCue(type)
  useGame.getState().setCue(type)
})
socket.on('error', ({ message }) => useGame.getState().setError(message))
socket.on('kicked', () => {
  stopSpeaking()
  useGame.getState().leave()
  useGame.getState().setError('Du wurdest vom Moderator entfernt.')
})

// ----- Clock sync (NTP-artig) ------------------------------------------

let syncing = false

export async function syncClock(rounds = 5): Promise<void> {
  if (syncing) return
  syncing = true
  try {
    const samples: { offset: number; rtt: number }[] = []
    for (let i = 0; i < rounds; i++) {
      const t0 = Date.now()
      const serverTime = await new Promise<number>((resolve) => {
        socket.emit('clock:sync', { t0 }, (res) => resolve(res?.serverTime ?? Date.now()))
      })
      const t3 = Date.now()
      samples.push({ offset: serverTime - (t0 + t3) / 2, rtt: t3 - t0 })
      await new Promise((r) => setTimeout(r, 70))
    }
    samples.sort((a, b) => a.rtt - b.rtt)
    const best = samples.slice(0, Math.max(1, Math.ceil(samples.length / 2)))
    const avg = best.reduce((s, x) => s + x.offset, 0) / best.length
    useGame.getState().setClockOffset(avg)
  } finally {
    syncing = false
  }
}

// ----- Actions ----------------------------------------------------------

export function createRoom(name: string, avatar: string): Promise<CreateRoomResult> {
  return new Promise((resolve) => {
    socket.emit('room:create', { name, avatar }, (r) => {
      if (r.ok && r.roomCode && r.playerId) {
        useGame.getState().setIdentity({
          roomCode: r.roomCode,
          playerId: r.playerId,
          name,
          avatar,
          role: 'moderator',
        })
      }
      resolve(r)
    })
  })
}

export function joinRoom(roomCode: string, name: string, avatar: string): Promise<JoinRoomResult> {
  const code = roomCode.toUpperCase().trim()
  const existing = useGame.getState().identity
  const playerId = existing.roomCode === code ? existing.playerId ?? undefined : undefined
  return new Promise((resolve) => {
    socket.emit('room:join', { roomCode: code, name, avatar, playerId }, (r) => {
      if (r.ok && r.playerId) {
        useGame.getState().setIdentity({
          roomCode: code,
          playerId: r.playerId,
          name,
          avatar,
          role: r.isModerator ? 'moderator' : 'player',
        })
      }
      resolve(r)
    })
  })
}

export function spectate(roomCode: string): Promise<{ ok: boolean; error?: string }> {
  const code = roomCode.toUpperCase().trim()
  return new Promise((resolve) => {
    socket.emit('room:spectate', { roomCode: code }, (r) => {
      if (r.ok) {
        useGame.getState().setIdentity({ roomCode: code, role: 'spectator', playerId: null })
      }
      resolve(r)
    })
  })
}

export function castVote(optionId: string): void {
  useGame.getState().setMyVote(optionId)
  socket.emit('vote:cast', { optionId })
}

export function buzz(): void {
  const offset = useGame.getState().clockOffset
  socket.emit('buzz', { normalizedMs: Date.now() + offset, clientTime: Date.now() })
}

export const mod = {
  startVote: () => socket.emit('mod:startVote'),
  resolveVote: () => socket.emit('mod:resolveVote'),
  forceCategory: (optionId: string) => socket.emit('mod:forceCategory', { optionId }),
  judge: (correct: boolean) => socket.emit('mod:judge', { correct }),
  reveal: () => socket.emit('mod:revealSolution'),
  next: () => socket.emit('mod:nextRound'),
  skip: () => socket.emit('mod:skipQuestion'),
  updateSettings: (s: Partial<GameSettings>) => socket.emit('mod:updateSettings', s),
  resetScores: () => socket.emit('mod:resetScores'),
  kick: (playerId: string) => socket.emit('mod:kick', { playerId }),
  endGame: () => socket.emit('mod:endGame'),
  grantPowerUp: (playerId: string, type: 'doublePoints' | 'shield' | 'steal') =>
    socket.emit('mod:grantPowerUp', { playerId, type }),
  startBonusRound: () => socket.emit('mod:startBonusRound'),
  endBonusRound: () => socket.emit('mod:endBonusRound'),
  createCategory: (name: string) =>
    new Promise((resolve) => socket.emit('mod:createCategory', { name }, resolve)),
  addQuestion: (p: {
    categoryId: string
    category: string
    points: number
    text: string
    answer: string
    ttsText?: string
  }) => new Promise((resolve) => socket.emit('mod:addQuestion', p, resolve)),
  deleteCategory: (categoryId: string) => socket.emit('mod:deleteCategory', { categoryId }),
  deleteQuestion: (questionId: string) => socket.emit('mod:deleteQuestion', { questionId }),
}
