export type Phase = 'lobby' | 'category' | 'drop' | 'hotseat' | 'reveal' | 'bonus' | 'gameover'

export interface Player {
  id: string
  name: string
  score: number
  connected: boolean
  isModerator: boolean
  color: string
  avatar?: string
  jokers: number
  powerUps: PowerUp[]
  joinedAt: number
}

export type PowerUpType = 'doublePoints' | 'shield' | 'steal'

export interface PowerUp {
  type: PowerUpType
  id: string
}

export interface CategoryOption {
  id: string
  category: string
  points: number
}

export interface Question {
  id: string
  category: string
  points: number
  text: string
  answer: string
  ttsText?: string
}

export interface CustomCategory {
  id: string
  name: string
  createdAt: number
}

export interface CustomQuestion {
  id: string
  categoryId: string
  category: string
  points: number
  text: string
  answer: string
  ttsText?: string
  createdAt: number
}

export type AnswerStatus = 'pending' | 'wrong' | 'correct'

export interface BuzzEntry {
  playerId: string
  name: string
  color: string
  // Druckzeitpunkt, normalisiert auf die Server-Uhr (Millisekunden-Fairness)
  normalizedMs: number
  serverRecvMs: number
  rank: number
  status: AnswerStatus
}

export interface TimerState {
  endsAt: number
  durationMs: number
  label: string
}

export interface RoundResult {
  correct: boolean
  playerId: string | null
  playerName: string | null
  pointsDelta: number
  answer: string
}

export interface GameSettings {
  hotseatSeconds: number
  roundTimeLimit: number
  ttsEnabled: boolean
  ttsRate: number
  language: string
  optionsPerRound: number
  customCategories: CustomCategory[]
  customQuestions: CustomQuestion[]
}

export interface CurrentQuestionPublic {
  id: string
  category: string
  points: number
  text: string
  answer: string | null
}

export interface PublicGameState {
  roomCode: string
  phase: Phase
  round: number
  hostId: string | null
  players: Player[]
  categoryOptions: CategoryOption[]
  votedPlayerIds: string[]
  voteCounts: Record<string, number> | null
  currentQuestion: CurrentQuestionPublic | null
  ttsActive: boolean
  buzzQueue: BuzzEntry[]
  activePlayerId: string | null
  buzzingOpen: boolean
  timer: TimerState | null
  lastResult: RoundResult | null
  settings: GameSettings
  bankCategories: string[]
  serverTime: number
}

export const DEFAULT_SETTINGS: GameSettings = {
  hotseatSeconds: 12,
  roundTimeLimit: 0,
  ttsEnabled: true,
  ttsRate: 1,
  language: 'de-DE',
  optionsPerRound: 5,
  customCategories: [],
  customQuestions: [],
}

export const PLAYER_COLORS = [
  '#a78bfa', // brand-400
  '#8b5cf6', // brand-500
  '#7c3aed', // brand-600
  '#22d3ee', // accent-400
  '#06b6d4', // accent-500
  '#f87171', // danger-400
  '#fbbf24', // warning-400
  '#4ade80', // success-400
  '#fb923c', // orange
  '#f472b6', // pink
]
