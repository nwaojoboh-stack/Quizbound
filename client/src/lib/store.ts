import { create } from 'zustand'
import type { CueType, PublicGameState } from '@quiz/shared'

export type Role = 'moderator' | 'player' | 'spectator'

export interface Identity {
  roomCode: string | null
  playerId: string | null
  name: string
  role: Role | null
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
  setConnected: (v: boolean) => void
  setState: (s: PublicGameState) => void
  setIdentity: (i: Partial<Identity>) => void
  setClockOffset: (n: number) => void
  setMyVote: (id: string | null) => void
  setCue: (type: CueType) => void
  setError: (e: string | null) => void
  setModAnswer: (a: { questionId: string; answer: string } | null) => void
  leave: () => void
}

const STORAGE_KEY = 'qve:identity'

const EMPTY: Identity = { roomCode: null, playerId: null, name: '', role: null }

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
  leave: () => {
    persist({ ...EMPTY })
    set({ identity: { ...EMPTY }, state: null, myVote: null, modAnswer: null })
  },
}))

export function serverNow(): number {
  return Date.now() + useGame.getState().clockOffset
}
