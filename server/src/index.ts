import { createServer } from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@quiz/shared'
import { RoomManager } from './roomManager.js'

const PORT = Number(process.env.PORT) || 3001

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: Date.now(), rooms: rooms.roomCount })
})

const httpServer = createServer(app)
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  {
    cors: { origin: true, credentials: true },
    pingInterval: 10000,
    pingTimeout: 8000,
  },
)

const rooms = new RoomManager(io)

io.on('connection', (socket) => {
  const engine = () => rooms.getRoom(socket.data.roomCode)
  const me = () => socket.data.playerId
  const isMod = () => {
    const e = engine()
    const id = me()
    return !!(e && id && e.isModerator(id))
  }

  // Clock-Sync (NTP-artig): Client schaetzt damit den Server-Zeit-Offset
  socket.on('clock:sync', (_p, cb) => {
    cb?.({ serverTime: Date.now() })
  })

  socket.on('room:create', ({ name, avatar }, cb) => {
    const e = rooms.createRoom()
    const player = e.addPlayer(name, avatar, true)
    socket.data.roomCode = e.roomCode
    socket.data.playerId = player.id
    socket.join(rooms.key(e.roomCode))
    rooms.cancelCleanup(e.roomCode)
    cb?.({ ok: true, roomCode: e.roomCode, playerId: player.id })
    rooms.broadcast(e)
  })

  socket.on('room:join', ({ roomCode, name, avatar, playerId }, cb) => {
    const e = rooms.getRoom(roomCode)
    if (!e) {
      cb?.({ ok: false, error: 'Raum nicht gefunden.' })
      return
    }
    let pid = playerId
    let isModerator = false
    if (pid && e.hasPlayer(pid)) {
      e.reconnectPlayer(pid)
      isModerator = e.isModerator(pid)
    } else {
      const player = e.addPlayer(name, avatar, false)
      pid = player.id
    }
    socket.data.roomCode = e.roomCode
    socket.data.playerId = pid
    socket.join(rooms.key(e.roomCode))
    rooms.cancelCleanup(e.roomCode)
    cb?.({ ok: true, playerId: pid, isModerator })
    // Moderator-Reconnect: aktuelle Loesung erneut zustellen
    if (isModerator) {
      const ans = e.getModeratorAnswer()
      if (ans) socket.emit('mod:answer', ans)
    }
    rooms.broadcast(e)
  })

  // Praesentations-/Beamer-Ansicht: nur zuschauen, kein Mitspieler
  socket.on('room:spectate', ({ roomCode }, cb) => {
    const e = rooms.getRoom(roomCode)
    if (!e) {
      cb?.({ ok: false, error: 'Raum nicht gefunden.' })
      return
    }
    socket.data.roomCode = e.roomCode
    socket.data.playerId = undefined
    socket.join(rooms.key(e.roomCode))
    rooms.cancelCleanup(e.roomCode)
    cb?.({ ok: true })
    socket.emit('state', e.getPublicState())
  })

  // ----- Spieler-Aktionen -----
  socket.on('vote:cast', ({ optionId }) => {
    const e = engine()
    const id = me()
    if (e && id) e.castVote(id, optionId)
  })

  socket.on('buzz', ({ normalizedMs, clientTime }) => {
    const e = engine()
    const id = me()
    if (e && id) e.buzz(id, normalizedMs, clientTime)
  })

  socket.on('useJoker', ({ type }) => {
    const e = engine()
    const id = me()
    if (e && id) e.useJoker(id, type)
  })

  socket.on('usePowerUp', ({ powerUpId }) => {
    const e = engine()
    const id = me()
    if (e && id) e.usePowerUp(id, powerUpId)
  })

  // ----- Moderator-Aktionen (God-Mode) -----
  socket.on('mod:startVote', () => {
    if (isMod()) engine()!.startVote()
  })
  socket.on('mod:forceCategory', ({ optionId }) => {
    if (isMod()) engine()!.forceCategory(optionId)
  })
  socket.on('mod:resolveVote', () => {
    if (isMod()) engine()!.resolveVote()
  })
  socket.on('mod:judge', ({ correct }) => {
    if (isMod()) engine()!.judge(correct)
  })
  socket.on('mod:revealSolution', () => {
    if (isMod()) engine()!.revealSolution()
  })
  socket.on('mod:nextRound', () => {
    if (isMod()) engine()!.nextRound()
  })
  socket.on('mod:updateSettings', (partial) => {
    if (isMod()) engine()!.updateSettings(partial)
  })
  socket.on('mod:skipQuestion', () => {
    if (isMod()) engine()!.skipQuestion()
  })
  socket.on('mod:resetScores', () => {
    if (isMod()) engine()!.resetScores()
  })
  socket.on('mod:kick', ({ playerId }) => {
    if (isMod()) {
      const e = engine()!
      e.kick(playerId)
      // betroffenen Socket aus dem Raum werfen
      for (const [, s] of io.of('/').sockets) {
        if (s.data.playerId === playerId && s.data.roomCode === e.roomCode) {
          s.emit('kicked')
          s.leave(rooms.key(e.roomCode))
          s.data.roomCode = undefined
          s.data.playerId = undefined
        }
      }
    }
  })
  socket.on('mod:endGame', () => {
    if (isMod()) engine()!.endGame()
  })
  socket.on('mod:grantPowerUp', ({ playerId, type }) => {
    if (isMod()) engine()!.grantPowerUp(playerId, type)
  })
  socket.on('mod:startBonusRound', () => {
    if (isMod()) engine()!.startBonusRound()
  })
  socket.on('mod:endBonusRound', () => {
    if (isMod()) engine()!.endBonusRound()
  })
  socket.on('mod:createCategory', ({ name }, cb) => {
    if (isMod()) {
      const e = engine()!
      const category = e.createCategory(name)
      cb?.({ ok: true, category })
    } else {
      cb?.({ ok: false, error: 'Nur Moderator' })
    }
  })
  socket.on('mod:addQuestion', ({ categoryId, category, points, text, answer, ttsText }, cb) => {
    if (isMod()) {
      const e = engine()!
      const question = e.addQuestion(categoryId, category, points, text, answer, ttsText)
      cb?.({ ok: true, question })
    } else {
      cb?.({ ok: false, error: 'Nur Moderator' })
    }
  })
  socket.on('mod:deleteCategory', ({ categoryId }) => {
    if (isMod()) engine()!.deleteCategory(categoryId)
  })
  socket.on('mod:deleteQuestion', ({ questionId }) => {
    if (isMod()) engine()!.deleteQuestion(questionId)
  })

  socket.on('disconnect', () => {
    const e = engine()
    const id = me()
    if (e && id) {
      e.setConnected(id, false)
      rooms.broadcast(e)
      rooms.scheduleCleanup(e.roomCode)
    }
  })
})

// ----- Produktion: gebautes Frontend ausliefern (gleicher Origin) -----
const clientDist = path.resolve(import.meta.dirname, '../../client/dist')
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
  console.log('[server] Serving client build from', clientDist)
}

httpServer.listen(PORT, () => {
  console.log(`[server] Quiz Voice Engine laeuft auf Port ${PORT}`)
})
