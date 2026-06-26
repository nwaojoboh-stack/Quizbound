import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { AnimatePresence, motion } from 'framer-motion'
import { Crown, Mic } from 'lucide-react'
import { useGame } from '@/lib/store'
import { spectate } from '@/lib/socket'
import { TimerRing } from '@/components/TimerRing'
import { CueFlash } from '@/components/CueFlash'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/cn'

const wrap = {
  initial: { opacity: 0, scale: 0.95, y: 30 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, scale: 0.95, y: -30, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
}

const cardVariants = {
  initial: { opacity: 0, rotateX: -15, scale: 0.85 },
  animate: { opacity: 1, rotateX: 0, scale: 1, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, rotateX: 15, scale: 0.85, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
}

const categoryVariants = {
  initial: { opacity: 0, y: 20, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
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
    <div className="flex min-h-dvh flex-col px-8 py-6 sm:px-12 sm:py-10">
      <CueFlash />
      <header className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-6">
          <span className="text-white/60 text-lg">Runde {state.round}</span>
          <span className="rounded-xl bg-white/5 px-4 py-2 font-mono text-2xl font-black tracking-[0.3em]">
            {state.roomCode}
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center py-8">
        <AnimatePresence mode="wait">
          {state.phase === 'lobby' && (
            <motion.div key="lobby" {...wrap} className="flex flex-col items-center text-center">
              <h1 className="text-5xl font-black sm:text-7xl">Jetzt beitreten!</h1>
              <div className="mt-10 rounded-3xl bg-white p-6">
                <QRCodeSVG value={joinLink} size={280} />
              </div>
              <div className="mt-8 font-mono text-7xl font-black tracking-[0.4em]">{state.roomCode}</div>
            </motion.div>
          )}

          {state.phase === 'category' && (
            <motion.div key="category" {...wrap} className="text-center">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="mb-10 text-5xl font-black sm:text-6xl"
              >
                Kategorie-Wahl
              </motion.h1>
              <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 lg:grid-cols-3">
                {state.categoryOptions.map((o, i) => (
                  <motion.div
                    key={o.id}
                    variants={categoryVariants}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: i * 0.1 }}
                    className="card flex flex-col items-center p-8"
                  >
                    <span className="text-2xl font-bold">{o.category}</span>
                    <span className="my-3 font-mono text-5xl font-black text-gradient">{o.points}</span>
                  </motion.div>
                ))}
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-xl text-white/50"
              >
                {state.votedPlayerIds.length}/{contestants.length} haben abgestimmt …
              </motion.p>
            </motion.div>
          )}

          {(state.phase === 'drop' || state.phase === 'hotseat' || state.phase === 'reveal') && q && (
            <motion.div key="question" {...wrap} className="mx-auto w-full max-w-6xl text-center">
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-8"
              >
                <div className="mb-8 flex items-center justify-center gap-4">
                  <span className="text-xl font-semibold uppercase tracking-wider text-white/60">{q.category}</span>
                  <div className="rounded-lg bg-brand-500/20 px-4 py-1.5 text-sm font-bold text-brand-300">
                    +{q.points}
                  </div>
                </div>
                <p className="text-5xl font-black leading-tight sm:text-7xl">{q.text}</p>
              </motion.div>

              {state.phase === 'drop' && (
                <div className="mt-12 inline-flex items-center gap-3 rounded-full bg-rose-600/20 px-8 py-4 text-3xl font-black uppercase tracking-wider text-rose-300">
                  {state.ttsActive ? <Mic className="h-7 w-7 animate-pulse" /> : null}
                  Buzzern!
                </div>
              )}

              {state.phase === 'hotseat' && (
                <div className="mt-10 flex flex-col items-center gap-5">
                  <TimerRing timer={state.timer} size={180} stroke={12} />
                  <div className="inline-flex items-center gap-3 rounded-full bg-brand-600/30 px-8 py-4 text-3xl font-black">
                    <Mic className="h-7 w-7" style={{ color: activePlayer?.color }} />
                    <span style={{ color: activePlayer?.color }}>{activePlayer?.name}</span>
                  </div>
                </div>
              )}

              {state.phase === 'reveal' && q.answer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-auto mt-10 w-fit rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-12 py-8"
                >
                  <div className="text-lg font-bold uppercase tracking-wider text-emerald-400/80">Lösung</div>
                  <div className="text-5xl font-black text-emerald-300 sm:text-6xl">{q.answer}</div>
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
              <Crown className="mx-auto mb-5 h-20 w-20 text-yellow-400" />
              <h1 className="text-6xl font-black">{contestants[0]?.name ?? 'Spiel beendet'}</h1>
              <p className="mt-3 text-2xl text-white/60">gewinnt mit {contestants[0]?.score ?? 0} Punkten</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Leaderboard-Leiste */}
      <footer className="flex flex-wrap items-center justify-center gap-4">
        {contestants.slice(0, 8).map((p, i) => (
          <motion.div
            layout
            key={p.id}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-5 py-3',
              p.id === state.activePlayerId
                ? 'border-brand-500 bg-brand-600/20'
                : 'border-white/10 bg-white/5',
            )}
          >
            <span className={cn('font-mono font-black text-lg', i === 0 ? 'text-yellow-400' : 'text-white/60')}>
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
