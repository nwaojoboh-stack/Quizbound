import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, LogOut, Mic, Trophy, Users, XCircle } from 'lucide-react'
import { useGame } from '@/lib/store'
import { buzz, castVote } from '@/lib/socket'
import { Logo } from '@/components/Logo'
import { ConnectionDot } from '@/components/ConnectionDot'
import { CategoryGrid } from '@/components/CategoryGrid'
import { BuzzerButton } from '@/components/BuzzerButton'
import { QuestionCard } from '@/components/QuestionCard'
import { TimerRing } from '@/components/TimerRing'
import { BuzzQueue } from '@/components/BuzzQueue'
import { Scoreboard } from '@/components/Scoreboard'
import { CueFlash } from '@/components/CueFlash'

const wrap = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
}

export default function Player() {
  const nav = useNavigate()
  const state = useGame((s) => s.state)
  const identity = useGame((s) => s.identity)
  const myVote = useGame((s) => s.myVote)
  const leave = useGame((s) => s.leave)
  const myId = identity.playerId

  function onLeave() {
    leave()
    nav('/')
  }

  if (!state) {
    return (
      <div className="grid min-h-dvh place-items-center text-white/50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-brand-500" />
          Verbinde mit Raum …
        </div>
      </div>
    )
  }

  const me = state.players.find((p) => p.id === myId)
  const amActive = state.activePlayerId === myId
  const hasBuzzed = state.buzzQueue.some((b) => b.playerId === myId)
  const myRank = state.buzzQueue.find((b) => b.playerId === myId)?.rank
  const activePlayer = state.players.find((p) => p.id === state.activePlayerId)
  const votedCount = state.votedPlayerIds.length
  const contestantCount = state.players.filter((p) => !p.isModerator).length
  const buzzDisabled = !state.buzzingOpen || hasBuzzed || amActive

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-10 safe-b">
      <CueFlash />
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between gap-3 border-b border-white/5 bg-bg/70 px-4 py-3 backdrop-blur-xl">
        <Logo compact />
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-white/5 px-2 py-1 font-mono text-sm font-bold tracking-widest">
            {state.roomCode}
          </span>
          <ConnectionDot className="hidden sm:inline-flex" />
          <button onClick={onLeave} className="text-white/40 transition hover:text-white" title="Verlassen">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {me && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 rounded-full" style={{ background: me.color }} />
            <span className="font-semibold">{me.name}</span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/40">Runde {state.round}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xl font-black tabular-nums">
            <Trophy className="h-4 w-4 text-yellow-400" />
            {me.score}
          </div>
        </div>
      )}

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {/* ----- Lobby ----- */}
          {state.phase === 'lobby' && (
            <motion.div key="lobby" {...wrap} className="space-y-4">
              <div className="card p-6 text-center">
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-600/20">
                  <Users className="h-7 w-7 text-brand-300" />
                </div>
                <h2 className="text-xl font-bold">Warte auf den Start …</h2>
                <p className="mt-1 text-white/50">Der Moderator startet das Spiel gleich. Mach dich bereit!</p>
              </div>
              <SectionTitle icon={<Trophy className="h-4 w-4" />}>
                Mitspieler ({contestantCount})
              </SectionTitle>
              <Scoreboard players={state.players} meId={myId} />
            </motion.div>
          )}

          {/* ----- Phase 1: Kategorie-Wahl ----- */}
          {state.phase === 'category' && (
            <motion.div key="category" {...wrap} className="space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Wähle deine Kategorie</h2>
                <p className="mt-1 text-white/50">
                  Verdeckte Abstimmung · {votedCount}/{contestantCount} haben gewählt
                </p>
              </div>
              <CategoryGrid
                options={state.categoryOptions}
                myVote={myVote}
                onVote={castVote}
                disabled={false}
              />
              {myVote && (
                <p className="text-center text-sm text-brand-300">
                  Stimme abgegeben – du kannst sie noch ändern.
                </p>
              )}
            </motion.div>
          )}

          {/* ----- Phase 2: Drop (Buzzern) ----- */}
          {state.phase === 'drop' && state.currentQuestion && (
            <motion.div key="drop" {...wrap} className="space-y-5">
              <QuestionCard q={state.currentQuestion} ttsActive={state.ttsActive} />
              <div className="pt-2">
                <BuzzerButton onBuzz={buzz} disabled={buzzDisabled} hasBuzzed={hasBuzzed} />
              </div>
              <p className="text-center text-sm font-medium text-white/50">
                {hasBuzzed ? 'Du bist in der Warteschlange!' : 'Buzzern erlaubt – wer es weiß, drückt!'}
              </p>
            </motion.div>
          )}

          {/* ----- Phase 3/4: Hot Seat + Steal ----- */}
          {state.phase === 'hotseat' && state.currentQuestion && (
            <motion.div key="hotseat" {...wrap} className="space-y-5">
              <div className="flex flex-col items-center gap-3">
                <TimerRing timer={state.timer} size={140} />
                {amActive ? (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-brand-600/30 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-brand-200">
                      <Mic className="h-4 w-4" /> Du bist dran!
                    </div>
                    <p className="mt-2 text-lg font-semibold">Sprich jetzt deine Antwort!</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-white/50">Am Zug:</p>
                    <p className="text-lg font-bold" style={{ color: activePlayer?.color }}>
                      {activePlayer?.name ?? '—'}
                    </p>
                  </div>
                )}
              </div>

              <QuestionCard q={state.currentQuestion} />

              {!amActive && (
                <div className="space-y-3 pt-1">
                  {hasBuzzed ? (
                    <p className="text-center text-sm font-medium text-amber-300">
                      In der Warteschlange · Platz {myRank}
                    </p>
                  ) : (
                    <>
                      <BuzzerButton
                        onBuzz={buzz}
                        disabled={buzzDisabled}
                        label="STEAL!"
                        sublabel="Buzzern für die Chance"
                      />
                    </>
                  )}
                </div>
              )}

              <div>
                <SectionTitle>Buzzer-Reihenfolge</SectionTitle>
                <BuzzQueue queue={state.buzzQueue} activePlayerId={state.activePlayerId} />
              </div>
            </motion.div>
          )}

          {/* ----- Phase 5: Auflösung ----- */}
          {state.phase === 'reveal' && state.currentQuestion && (
            <motion.div key="reveal" {...wrap} className="space-y-4">
              <ResultBanner />
              <QuestionCard q={state.currentQuestion} />
              <SectionTitle icon={<Trophy className="h-4 w-4" />}>Rangliste</SectionTitle>
              <Scoreboard players={state.players} meId={myId} />
            </motion.div>
          )}

          {/* ----- Game Over ----- */}
          {state.phase === 'gameover' && (
            <motion.div key="gameover" {...wrap} className="space-y-4">
              <div className="card p-6 text-center">
                <Trophy className="mx-auto mb-2 h-10 w-10 text-yellow-400" />
                <h2 className="text-2xl font-black">Spiel beendet!</h2>
              </div>
              <Scoreboard players={state.players} meId={myId} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function SectionTitle({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-2 mt-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/40">
      {icon}
      {children}
    </div>
  )
}

function ResultBanner() {
  const state = useGame((s) => s.state)
  const result = state?.lastResult
  if (!result) return null
  if (result.correct) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-4"
      >
        <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-400" />
        <div>
          <div className="font-bold text-emerald-300">Richtig!</div>
          <div className="text-sm text-white/60">
            {result.playerName} erhält +{result.pointsDelta} Punkte
          </div>
        </div>
      </motion.div>
    )
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/15 p-4"
    >
      <XCircle className="h-7 w-7 shrink-0 text-rose-400" />
      <div>
        <div className="font-bold text-rose-300">Niemand lag richtig</div>
        <div className="text-sm text-white/60">Die Lösung steht unten.</div>
      </div>
    </motion.div>
  )
}
