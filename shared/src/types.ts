import type { Difficulty } from './scoring'

export type Phase = 'lobby' | 'category' | 'drop' | 'hotseat' | 'reveal' | 'gameover'

export interface Player {
  id: string
  name: string
  score: number
  connected: boolean
  isModerator: boolean
  color: string
  joinedAt: number
}

export interface CategoryOption {
  id: string
  category: string
  difficulty: Difficulty
  points: number
}

export interface Question {
  id: string
  category: string
  difficulty: Difficulty
  text: string
  answer: string
  ttsText?: string
}

export interface LiveQuestionInput {
  category: string
  difficulty: Difficulty
  text: string
  answer: string
  ttsText?: string
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
  ttsEnabled: boolean
  ttsRate: number
  language: string
  optionsPerRound: number
}

export interface CurrentQuestionPublic {
  id: string
  category: string
  difficulty: Difficulty
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
  ttsEnabled: true,
  ttsRate: 1,
  language: 'de-DE',
  optionsPerRound: 5,
}

export const PLAYER_COLORS = [
  '#f87171',
  '#fb923c',
  '#fbbf24',
  '#a3e635',
  '#34d399',
  '#22d3ee',
  '#60a5fa',
  '#a78bfa',
  '#f472b6',
  '#e879f9',
]
