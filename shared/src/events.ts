import type { GameSettings, LiveQuestionInput, PublicGameState } from './types'

export type CueType = 'buzz' | 'correct' | 'wrong' | 'reveal' | 'start' | 'tick' | 'steal'

export interface CreateRoomResult {
  ok: boolean
  roomCode?: string
  playerId?: string
  error?: string
}

export interface JoinRoomResult {
  ok: boolean
  playerId?: string
  isModerator?: boolean
  error?: string
}

export interface ServerToClientEvents {
  state: (state: PublicGameState) => void
  'tts:start': (p: { questionId: string; text: string; rate: number; lang: string }) => void
  'tts:stop': () => void
  cue: (p: { type: CueType }) => void
  // Nur an den Moderator: die Loesung (Spieler duerfen sie nicht sehen)
  'mod:answer': (p: { questionId: string; answer: string }) => void
  error: (p: { message: string }) => void
  kicked: () => void
}

export interface ClientToServerEvents {
  'room:create': (p: { name: string }, cb: (r: CreateRoomResult) => void) => void
  'room:join': (
    p: { roomCode: string; name: string; playerId?: string },
    cb: (r: JoinRoomResult) => void,
  ) => void
  'room:spectate': (p: { roomCode: string }, cb: (r: { ok: boolean; error?: string }) => void) => void
  'clock:sync': (p: { t0: number }, cb: (r: { serverTime: number }) => void) => void
  'vote:cast': (p: { optionId: string }) => void
  buzz: (p: { normalizedMs: number; clientTime: number }) => void
  'mod:startVote': () => void
  'mod:forceCategory': (p: { optionId: string }) => void
  'mod:resolveVote': () => void
  'mod:judge': (p: { correct: boolean }) => void
  'mod:revealSolution': () => void
  'mod:nextRound': () => void
  'mod:setLiveQuestion': (p: LiveQuestionInput) => void
  'mod:updateSettings': (p: Partial<GameSettings>) => void
  'mod:skipQuestion': () => void
  'mod:resetScores': () => void
  'mod:kick': (p: { playerId: string }) => void
  'mod:endGame': () => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  roomCode?: string
  playerId?: string
}
