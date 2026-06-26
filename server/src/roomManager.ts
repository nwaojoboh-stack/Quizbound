import type { Server } from 'socket.io'
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@quiz/shared'
import { GameEngine, newRoomCode, type RoomEmitter } from './gameEngine.js'

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

// Leere Raeume werden nach dieser Zeit aufgeraeumt
const EMPTY_TTL_MS = 10 * 60 * 1000

export class RoomManager {
  private rooms = new Map<string, GameEngine>()
  private cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(private io: IO) {}

  key(code: string): string {
    return `room:${code}`
  }

  createRoom(): GameEngine {
    let code = newRoomCode()
    while (this.rooms.has(code)) code = newRoomCode()

    const roomKey = this.key(code)
    const emitter: RoomEmitter = {
      broadcastState: (state) => this.io.to(roomKey).emit('state', state),
      ttsStart: (p) => this.io.to(roomKey).emit('tts:start', p),
      ttsStop: () => this.io.to(roomKey).emit('tts:stop'),
      cue: (type) => this.io.to(roomKey).emit('cue', { type }),
      privateAnswer: (playerId, p) => this.emitToPlayer(playerId, 'mod:answer', p),
    }
    const engine = new GameEngine(emitter, code)
    this.rooms.set(code, engine)
    return engine
  }

  getRoom(code?: string): GameEngine | undefined {
    if (!code) return undefined
    return this.rooms.get(code.toUpperCase())
  }

  broadcast(engine: GameEngine): void {
    this.io.to(this.key(engine.roomCode)).emit('state', engine.getPublicState())
  }

  // Gezielt an genau einen Spieler senden (z. B. die Loesung an den Moderator)
  emitToPlayer(
    playerId: string,
    event: 'mod:answer',
    payload: { questionId: string; answer: string },
  ): void {
    for (const [, s] of this.io.of('/').sockets) {
      if (s.data.playerId === playerId) {
        s.emit(event, payload)
        return
      }
    }
  }

  cancelCleanup(code: string): void {
    const t = this.cleanupTimers.get(code)
    if (t) {
      clearTimeout(t)
      this.cleanupTimers.delete(code)
    }
  }

  scheduleCleanup(code: string): void {
    const engine = this.rooms.get(code)
    if (!engine) return
    if (engine.connectedCount > 0) {
      this.cancelCleanup(code)
      return
    }
    if (this.cleanupTimers.has(code)) return
    const t = setTimeout(() => {
      const e = this.rooms.get(code)
      if (e && e.connectedCount === 0) {
        e.dispose()
        this.rooms.delete(code)
      }
      this.cleanupTimers.delete(code)
    }, EMPTY_TTL_MS)
    this.cleanupTimers.set(code, t)
  }

  get roomCount(): number {
    return this.rooms.size
  }
}
