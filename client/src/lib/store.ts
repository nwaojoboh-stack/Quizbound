import { create } from 'zustand'
import type { CueType, PublicGameState } from '@quiz/shared'

export type Role = 'moderator' | 'player' | 'spectator'

export interface Identity {
  roomCode: string | null
  playerId: string | null
  name: string
  avatar: string
  role: Role | null
}

export interface PlayerStats {
  gamesPlayed: number
  totalScore: number
  bestScore: number
  correctAnswers: number
  wrongAnswers: number
}

interface GameStore {
  connected: boolean
  state: PublicGameState | null
  identity: Identity
  clockOffset: number
  myVote: string | null
  cue: { type: CueType; at: number } | null
  error: string | null
  modAnswer: { questionId: string; answer: string } | null
  stats: PlayerStats
  setConnected: (v: boolean) => void
  setState: (s: PublicGameState) => void
  setIdentity: (i: Partial<Identity>) => void
  setClockOffset: (n: number) => void
  setMyVote: (id: string | null) => void
  setCue: (type: CueType) => void
  setError: (e: string | null) => void
  setModAnswer: (a: { questionId: string; answer: string } | null) => void
  updateStats: (delta: { score?: number; correct?: boolean }) => void
  leave: () => void
}

const STORAGE_KEY = 'qve:identity'
const STATS_KEY = 'qve:stats'

const EMPTY: Identity = { roomCode: null, playerId: null, name: '', avatar: '🎮', role: null }

const EMPTY_STATS: PlayerStats = {
  gamesPlayed: 0,
  totalScore: 0,
  bestScore: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
}

function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (raw) return { ...EMPTY_STATS, ...JSON.parse(raw) }
  } catch {
    /* noop */
  }
  return { ...EMPTY_STATS }
}

function loadIdentity(): Identity {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...EMPTY, ...JSON.parse(raw) }
  } catch {
    /* noop */
  }
  return { ...EMPTY }
}

function persist(i: Identity): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(i))
  } catch {
    /* noop */
  }
}

export const useGame = create<GameStore>((set, get) => ({
  connected: false,
  state: null,
  identity: loadIdentity(),
  clockOffset: 0,
  myVote: null,
  cue: null,
  error: null,
  modAnswer: null,
  stats: loadStats(),
  setConnected: (v) => set({ connected: v }),
  setState: (s) => set({ state: s }),
  setIdentity: (i) => {
    const next = { ...get().identity, ...i }
    persist(next)
    set({ identity: next })
  },
  setClockOffset: (n) => set({ clockOffset: n }),
  setMyVote: (id) => set({ myVote: id }),
  setCue: (type) => set({ cue: { type, at: Date.now() } }),
  setError: (e) => set({ error: e }),
  setModAnswer: (a) => set({ modAnswer: a }),
  updateStats: (delta) => {
    const stats = get().stats
    const updated = { ...stats }
    if (delta.score !== undefined) {
      updated.totalScore += delta.score
      if (delta.score > updated.bestScore) updated.bestScore = delta.score
    }
    if (delta.correct !== undefined) {
      if (delta.correct) updated.correctAnswers++
      else updated.wrongAnswers++
    }
    updated.gamesPlayed++
    localStorage.setItem(STATS_KEY, JSON.stringify(updated))
    set({ stats: updated })
  },
  leave: () => {
    persist({ ...EMPTY })
    set({ identity: { ...EMPTY }, state: null, myVote: null, modAnswer: null })
  },
}))

export function serverNow(): number {
  return Date.now() + useGame.getState().clockOffset
}
