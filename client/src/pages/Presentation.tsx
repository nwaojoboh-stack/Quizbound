import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { AnimatePresence, motion } from 'framer-motion'
import { Crown, Mic } from 'lucide-react'
import { useGame } from '@/lib/store'
import { spectate } from '@/lib/socket'
import { TimerRing } from '@/components/TimerRing'
import { CueFlash } from '@/components/CueFlash'
import { DifficultyBadge } from '@/components/DifficultyBadge'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/cn'

const wrap = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
}

export default function Presentation() {
  const { code } = useParams()
  const roomCode = (code || '').toUpperCase()
  const state = useGame((s) => s.state)

  useEffect(() => {
    void spectate(roomCode)
  }, [roomCode])

  const joinLink = `${window.location.origin}/room/${roomCode}`

  if (!state || state.roomCode !== roomCode) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <Logo className="mb-6 justify-center" />
          <div className="mx-auto mb-6 w-fit rounded-3xl bg-white p-4">
            <QRCodeSVG value={joinLink} size={220} />
          </div>
          <div className="font-mono text-5xl font-black tracking-[0.4em]">{roomCode}</div>
          <p className="mt-4 text-white/50">Warte auf den Raum …</p>
        </div>
      </div>
    )
  }

  const contestants = state.players.filter((p) => !p.isModerator)
  const activePlayer = state.players.find((p) => p.id === state.activePlayerId)
  const q = state.currentQuestion

  return (
    <div className="flex min-h-dvh flex-col px-6 py-5 sm:px-10 sm:py-8">
      <CueFlash />
      <header className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="text-white/40">Runde {state.round}</span>
          <span className="rounded-xl bg-white/5 px-3 py-1.5 font-mono text-xl font-black tracking-[0.3em]">
            {state.roomCode}
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center py-6">
        <AnimatePresence mode="wait">
          {state.phase === 'lobby' && (
            <motion.div key="lobby" {...wrap} className="flex flex-col items-center text-center">
              <h1 className="text-4xl font-black sm:text-6xl">Jetzt beitreten!</h1>
              <div className="mt-8 rounded-3xl bg-white p-5">
                <QRCodeSVG value={joinLink} size={240} />
              </div>
              <div className="mt-6 font-mono text-6xl font-black tracking-[0.4em]">{state.roomCode}</div>
            </motion.div>
          )}

          {state.phase === 'category' && (
            <motion.div key="category" {...wrap} className="text-center">
              <h1 className="mb-8 text-4xl font-black sm:text-5xl">Kategorie-Wahl</h1>
              <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-3">
                {state.categoryOptions.map((o) => (
                  <div key={o.id} className="card flex flex-col items-center p-6">
                    <span className="text-2xl font-bold">{o.category}</span>
                    <span className="my-2 font-mono text-4xl font-black text-gradient">{o.points}</span>
                    <DifficultyBadge difficulty={o.difficulty} />
                  </div>
                ))}
              </div>
              <p className="mt-8 text-xl text-white/50">
                {state.votedPlayerIds.length}/{contestants.length} haben abgestimmt …
              </p>
            </motion.div>
          )}

          {(state.phase === 'drop' || state.phase === 'hotseat' || state.phase === 'reveal') && q && (
            <motion.div key="question" {...wrap} className="mx-auto w-full max-w-5xl text-center">
              <div className="mb-6 flex items-center justify-center gap-4">
                <span className="text-xl font-semibold uppercase tracking-wider text-white/50">{q.category}</span>
                <DifficultyBadge difficulty={q.difficulty} points={q.points} />
              </div>
              <p className="text-4xl font-black leading-tight sm:text-6xl">{q.text}</p>

              {state.phase === 'drop' && (
                <div className="mt-10 inline-flex items-center gap-3 rounded-full bg-rose-600/20 px-6 py-3 text-2xl font-black uppercase tracking-wider text-rose-300">
                  {state.ttsActive ? <Mic className="h-6 w-6 animate-pulse" /> : null}
                  Buzzern!
                </div>
              )}

              {state.phase === 'hotseat' && (
                <div className="mt-8 flex flex-col items-center gap-4">
                  <TimerRing timer={state.timer} size={160} stroke={12} />
                  <div className="inline-flex items-center gap-3 rounded-full bg-brand-600/30 px-6 py-3 text-3xl font-black">
                    <Mic className="h-7 w-7" style={{ color: activePlayer?.color }} />
                    <span style={{ color: activePlayer?.color }}>{activePlayer?.name}</span>
                  </div>
                </div>
              )}

              {state.phase === 'reveal' && q.answer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-auto mt-8 w-fit rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-10 py-6"
                >
                  <div className="text-lg font-bold uppercase tracking-wider text-emerald-400/80">Lösung</div>
                  <div className="text-4xl font-black text-emerald-300 sm:text-5xl">{q.answer}</div>
                  {state.lastResult?.correct && (
                    <div className="mt-2 text-xl text-white/70">
                      {state.lastResult.playerName} · +{state.lastResult.pointsDelta}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {state.phase === 'gameover' && (
            <motion.div key="over" {...wrap} className="text-center">
              <Crown className="mx-auto mb-4 h-16 w-16 text-yellow-400" />
              <h1 className="text-5xl font-black">{contestants[0]?.name ?? 'Spiel beendet'}</h1>
              <p className="mt-2 text-2xl text-white/50">gewinnt mit {contestants[0]?.score ?? 0} Punkten</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Leaderboard-Leiste */}
      <footer className="flex flex-wrap items-center justify-center gap-3">
        {contestants.slice(0, 8).map((p, i) => (
          <motion.div
            layout
            key={p.id}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-4 py-2',
              p.id === state.activePlayerId
                ? 'border-brand-500 bg-brand-600/20'
                : 'border-white/10 bg-white/5',
            )}
          >
            <span className={cn('font-mono font-black', i === 0 ? 'text-yellow-400' : 'text-white/40')}>
              {i + 1}
            </span>
            <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
            <span className="font-bold">{p.name}</span>
            <span className="font-mono text-lg font-black tabular-nums">{p.score}</span>
          </motion.div>
        ))}
      </footer>
    </div>
  )
}
