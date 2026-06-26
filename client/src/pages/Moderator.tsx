import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  Check,
  ChevronDown,
  Copy,
  Eye,
  Play,
  Plus,
  Power,
  RotateCcw,
  SkipForward,
  Trophy,
  Tv,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import type { Difficulty, LiveQuestionInput } from '@quiz/shared'
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER, SCORING } from '@quiz/shared'
import { useGame } from '@/lib/store'
import { mod } from '@/lib/socket'
import { Logo } from '@/components/Logo'
import { ConnectionDot } from '@/components/ConnectionDot'
import { Button } from '@/components/ui/Button'
import { Scoreboard } from '@/components/Scoreboard'
import { BuzzQueue } from '@/components/BuzzQueue'
import { TimerRing } from '@/components/TimerRing'
import { CategoryGrid } from '@/components/CategoryGrid'
import { DifficultyBadge } from '@/components/DifficultyBadge'
import { cn } from '@/lib/cn'

export default function Moderator() {
  const nav = useNavigate()
  const state = useGame((s) => s.state)
  const modAnswer = useGame((s) => s.modAnswer)
  const setError = useGame((s) => s.setError)
  const leave = useGame((s) => s.leave)
  const [showSettings, setShowSettings] = useState(false)
  const [showLive, setShowLive] = useState(false)

  // ----- Hotkeys (God-Mode) -----
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      const phase = useGame.getState().state?.phase
      if (!phase) return
      const k = e.key
      if (phase === 'hotseat') {
        if (k === 'ArrowUp' || k === 'r' || k === 'R') {
          e.preventDefault()
          mod.judge(true)
        } else if (k === 'ArrowDown' || k === 'f' || k === 'F') {
          e.preventDefault()
          mod.judge(false)
        }
      } else if (phase === 'category') {
        if (k === ' ' || k === 'Enter') {
          e.preventDefault()
          mod.resolveVote()
        }
      } else if (phase === 'drop') {
        if (k === ' ' || k === 'Enter') {
          e.preventDefault()
          mod.reveal()
        }
      } else if (phase === 'reveal') {
        if (k === ' ' || k === 'Enter') {
          e.preventDefault()
          mod.next()
        }
      } else if (phase === 'lobby' || phase === 'gameover') {
        if (k === ' ' || k === 'Enter') {
          e.preventDefault()
          mod.startVote()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!state) {
    return (
      <div className="grid min-h-dvh place-items-center text-white/50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-brand-500" />
      </div>
    )
  }

  const joinLink = `${window.location.origin}/room/${state.roomCode}`
  const activePlayer = state.players.find((p) => p.id === state.activePlayerId)
  const contestantCount = state.players.filter((p) => !p.isModerator).length
  const votedCount = state.votedPlayerIds.length
  const answerVisible =
    state.currentQuestion?.answer ??
    (modAnswer && modAnswer.questionId === state.currentQuestion?.id ? modAnswer.answer : null)

  function copyLink() {
    navigator.clipboard?.writeText(joinLink).then(
      () => setError('Einladungslink kopiert!'),
      () => setError('Kopieren nicht möglich.'),
    )
  }

  function onEnd() {
    leave()
    nav('/')
  }

  return (
    <div className="mx-auto min-h-dvh max-w-7xl px-4 pb-10">
      <header className="sticky top-0 z-20 -mx-4 mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-bg/70 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="rounded-lg bg-brand-600/20 px-2 py-1 text-xs font-bold uppercase tracking-wider text-brand-300">
            Moderator
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 font-mono text-lg font-black tracking-[0.3em] transition hover:bg-white/10"
            title="Einladungslink kopieren"
          >
            {state.roomCode}
            <Copy className="h-4 w-4 text-white/40" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => nav(`/present/${state.roomCode}`)}>
            <Tv className="h-4 w-4" /> Beamer
          </Button>
          <ConnectionDot className="hidden md:inline-flex" />
          <Button variant="ghost" size="sm" onClick={onEnd} title="Verlassen">
            <Power className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr_1fr]">
        {/* ---------- Linke Spalte: Steuerung ---------- */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/50">Steuerung</h3>
              <span className="text-xs text-white/40">Runde {state.round}</span>
            </div>
            <PhaseControls state={state} />
          </div>

          {/* Live-Frage */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setShowLive((v) => !v)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/50">
                <Plus className="h-4 w-4" /> Live-Frage
              </span>
              <ChevronDown className={cn('h-4 w-4 transition', showLive && 'rotate-180')} />
            </button>
            {showLive && <LiveQuestionForm categories={state.bankCategories} />}
          </div>

          {/* Einstellungen */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setShowSettings((v) => !v)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/50">
                Einstellungen
              </span>
              <ChevronDown className={cn('h-4 w-4 transition', showSettings && 'rotate-180')} />
            </button>
            {showSettings && <SettingsPanel />}
          </div>
        </div>

        {/* ---------- Mitte: Bühne ---------- */}
        <div className="space-y-4">
          {state.phase === 'lobby' && (
            <div className="card flex flex-col items-center p-6 text-center">
              <h2 className="text-xl font-bold">Spieler beitreten lassen</h2>
              <p className="mt-1 text-sm text-white/50">QR scannen oder Code teilen</p>
              <div className="mt-5 rounded-2xl bg-white p-3">
                <QRCodeSVG value={joinLink} size={180} />
              </div>
              <div className="mt-4 font-mono text-3xl font-black tracking-[0.4em]">{state.roomCode}</div>
              <p className="mt-3 flex items-center gap-2 text-sm text-white/50">
                <Users className="h-4 w-4" /> {contestantCount} Mitspieler bereit
              </p>
            </div>
          )}

          {state.phase === 'category' && (
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">Kategorie-Wahl</h2>
                <span className="text-sm text-white/50">
                  {votedCount}/{contestantCount} abgestimmt
                </span>
              </div>
              <p className="mb-3 text-sm text-white/50">
                Tippe eine Karte, um sie zu <span className="font-semibold text-brand-300">erzwingen</span>, oder
                löse per Mehrheit auf (Leertaste).
              </p>
              <CategoryGrid
                options={state.categoryOptions}
                myVote={null}
                onVote={(id) => mod.forceCategory(id)}
                showForce
              />
            </div>
          )}

          {(state.phase === 'drop' || state.phase === 'hotseat' || state.phase === 'reveal') &&
            state.currentQuestion && (
              <div className="card p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold uppercase tracking-wider text-white/50">
                    {state.currentQuestion.category}
                  </span>
                  <DifficultyBadge
                    difficulty={state.currentQuestion.difficulty}
                    points={state.currentQuestion.points}
                  />
                </div>
                <p className="text-2xl font-bold leading-snug">{state.currentQuestion.text}</p>
                {answerVisible && (
                  <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400/80">
                      <Eye className="h-3.5 w-3.5" /> Lösung (nur für dich)
                    </div>
                    <div className="text-xl font-bold text-emerald-300">{answerVisible}</div>
                  </div>
                )}
                {state.phase === 'hotseat' && (
                  <div className="mt-5 flex items-center gap-4">
                    <TimerRing timer={state.timer} size={96} stroke={8} />
                    <div>
                      <div className="text-xs uppercase text-white/40">Am Zug</div>
                      <div className="text-2xl font-black" style={{ color: activePlayer?.color }}>
                        {activePlayer?.name ?? '—'}
                      </div>
                    </div>
                  </div>
                )}
                {state.phase === 'drop' && (
                  <p className="mt-4 text-sm text-white/50">
                    {state.ttsActive ? 'Bot liest vor …' : 'Bereit'} · Warte auf den ersten Buzz.
                  </p>
                )}
              </div>
            )}

          {state.phase === 'gameover' && (
            <div className="card p-6 text-center">
              <Trophy className="mx-auto mb-2 h-10 w-10 text-yellow-400" />
              <h2 className="text-2xl font-black">Spiel beendet</h2>
              <p className="mt-1 text-white/50">Starte ein neues Spiel über die Steuerung.</p>
            </div>
          )}
        </div>

        {/* ---------- Rechte Spalte: Queue + Rangliste ---------- */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/50">Buzzer-Queue</h3>
            <BuzzQueue queue={state.buzzQueue} activePlayerId={state.activePlayerId} />
          </div>
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/50">Rangliste</h3>
              <button
                onClick={() => mod.resetScores()}
                className="flex items-center gap-1 text-xs text-white/40 transition hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>
            <Scoreboard players={state.players} activePlayerId={state.activePlayerId} onKick={mod.kick} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function PhaseControls({ state }: { state: NonNullable<ReturnType<typeof useGame.getState>['state']> }) {
  const phase = state.phase
  if (phase === 'lobby' || phase === 'gameover') {
    return (
      <Button className="w-full" size="lg" onClick={() => mod.startVote()}>
        <Play className="h-5 w-5" /> {phase === 'lobby' ? 'Spiel starten' : 'Neues Spiel'}
        <Hotkey>Leertaste</Hotkey>
      </Button>
    )
  }
  if (phase === 'category') {
    return (
      <Button className="w-full" size="lg" onClick={() => mod.resolveVote()}>
        <Check className="h-5 w-5" /> Frage starten (Mehrheit)
        <Hotkey>Leertaste</Hotkey>
      </Button>
    )
  }
  if (phase === 'drop') {
    return (
      <div className="space-y-2">
        <p className="text-sm text-white/50">Spieler buzzern. Falls niemand kann:</p>
        <Button className="w-full" variant="secondary" onClick={() => mod.reveal()}>
          <Eye className="h-5 w-5" /> Lösung zeigen
          <Hotkey>Leertaste</Hotkey>
        </Button>
        <Button className="w-full" variant="ghost" onClick={() => mod.skip()}>
          <SkipForward className="h-4 w-4" /> Frage überspringen
        </Button>
      </div>
    )
  }
  if (phase === 'hotseat') {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="success" size="lg" onClick={() => mod.judge(true)}>
            <Check className="h-6 w-6" /> Richtig
          </Button>
          <Button variant="danger" size="lg" onClick={() => mod.judge(false)}>
            <X className="h-6 w-6" /> Falsch
          </Button>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-white/10 px-1.5 py-0.5">↑</kbd> Richtig
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-white/10 px-1.5 py-0.5">↓</kbd> Falsch
          </span>
        </div>
        <Button className="w-full" variant="ghost" onClick={() => mod.skip()}>
          <SkipForward className="h-4 w-4" /> Frage überspringen
        </Button>
      </div>
    )
  }
  // reveal
  return (
    <Button className="w-full" size="lg" onClick={() => mod.next()}>
      <Play className="h-5 w-5" /> Nächste Runde
      <Hotkey>Leertaste</Hotkey>
    </Button>
  )
}

function Hotkey({ children }: { children: ReactNode }) {
  return (
    <kbd className="ml-auto rounded bg-black/30 px-1.5 py-0.5 text-[10px] font-medium text-white/50">
      {children}
    </kbd>
  )
}

function LiveQuestionForm({ categories }: { categories: string[] }) {
  const setError = useGame((s) => s.setError)
  const [category, setCategory] = useState(categories[0] ?? 'Live')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [text, setText] = useState('')
  const [answer, setAnswer] = useState('')

  function submit() {
    if (!text.trim() || !answer.trim()) {
      setError('Frage und Lösung dürfen nicht leer sein.')
      return
    }
    const payload: LiveQuestionInput = { category: category.trim() || 'Live', difficulty, text, answer }
    mod.setLiveQuestion(payload)
    setText('')
    setAnswer('')
  }

  return (
    <div className="space-y-3 border-t border-white/5 p-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Kategorie</label>
          <input className="input py-2" list="cats" value={category} onChange={(e) => setCategory(e.target.value)} />
          <datalist id="cats">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="label">Schwierigkeit</label>
          <select
            className="input py-2"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            {DIFFICULTY_ORDER.map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABELS[d]} (+{SCORING[d].points}/-{SCORING[d].penalty})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Frage</label>
        <textarea className="input min-h-[64px] py-2" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div>
        <label className="label">Lösung</label>
        <input className="input py-2" value={answer} onChange={(e) => setAnswer(e.target.value)} />
      </div>
      <Button className="w-full" onClick={submit}>
        <Play className="h-4 w-4" /> Frage jetzt stellen
      </Button>
    </div>
  )
}

function SettingsPanel() {
  const settings = useGame((s) => s.state?.settings)
  if (!settings) return null
  return (
    <div className="space-y-4 border-t border-white/5 p-4">
      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-white/60">Hot-Seat Timer</span>
          <span className="font-mono font-bold">{settings.hotseatSeconds}s</span>
        </div>
        <input
          type="range"
          min={5}
          max={30}
          value={settings.hotseatSeconds}
          onChange={(e) => mod.updateSettings({ hotseatSeconds: Number(e.target.value) })}
          className="w-full accent-brand-500"
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-white/60">Kategorien pro Runde</span>
          <span className="font-mono font-bold">{settings.optionsPerRound}</span>
        </div>
        <input
          type="range"
          min={2}
          max={8}
          value={settings.optionsPerRound}
          onChange={(e) => mod.updateSettings({ optionsPerRound: Number(e.target.value) })}
          className="w-full accent-brand-500"
        />
      </div>
      <button
        onClick={() => mod.updateSettings({ ttsEnabled: !settings.ttsEnabled })}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          {settings.ttsEnabled ? <Volume2 className="h-4 w-4 text-accent" /> : <VolumeX className="h-4 w-4 text-white/40" />}
          Sprachausgabe (TTS)
        </span>
        <span
          className={cn(
            'relative h-6 w-11 rounded-full transition',
            settings.ttsEnabled ? 'bg-brand-500' : 'bg-white/15',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-5 w-5 rounded-full bg-white transition',
              settings.ttsEnabled ? 'left-[22px]' : 'left-0.5',
            )}
          />
        </span>
      </button>
    </div>
  )
}
