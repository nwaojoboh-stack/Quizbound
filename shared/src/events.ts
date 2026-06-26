import type { CustomCategory, CustomQuestion, GameSettings, PublicGameState } from './types'

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
  'room:create': (p: { name: string; avatar: string }, cb: (r: CreateRoomResult) => void) => void
  'room:join': (
    p: { roomCode: string; name: string; avatar: string; playerId?: string },
    cb: (r: JoinRoomResult) => void,
  ) => void
  'room:spectate': (p: { roomCode: string }, cb: (r: { ok: boolean; error?: string }) => void) => void
  'clock:sync': (p: { t0: number }, cb: (r: { serverTime: number }) => void) => void
  'vote:cast': (p: { optionId: string }) => void
  buzz: (p: { normalizedMs: number; clientTime: number }) => void
  'useJoker': (p: { type: 'fifty' | 'audience' }) => void
  'usePowerUp': (p: { powerUpId: string }) => void
  'mod:startVote': () => void
  'mod:forceCategory': (p: { optionId: string }) => void
  'mod:resolveVote': () => void
  'mod:judge': (p: { correct: boolean }) => void
  'mod:revealSolution': () => void
  'mod:nextRound': () => void
  'mod:updateSettings': (p: Partial<GameSettings>) => void
  'mod:skipQuestion': () => void
  'mod:resetScores': () => void
  'mod:kick': (p: { playerId: string }) => void
  'mod:endGame': () => void
  'mod:grantPowerUp': (p: { playerId: string; type: 'doublePoints' | 'shield' | 'steal' }) => void
  'mod:startBonusRound': () => void
  'mod:endBonusRound': () => void
  'mod:createCategory': (p: { name: string }, cb: (r: { ok: boolean; category?: CustomCategory; error?: string }) => void) => void
  'mod:addQuestion': (p: { categoryId: string; category: string; points: number; text: string; answer: string; ttsText?: string }, cb: (r: { ok: boolean; question?: CustomQuestion; error?: string }) => void) => void
  'mod:deleteCategory': (p: { categoryId: string }) => void
  'mod:deleteQuestion': (p: { questionId: string }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  roomCode?: string
  playerId?: string
}
