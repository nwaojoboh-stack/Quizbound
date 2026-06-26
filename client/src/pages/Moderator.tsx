import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  Play,
  Plus,
  Power,
  RotateCcw,
  SkipForward,
  Trophy,
  Tv,
  Trash2,
  Upload,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import type { CustomCategory, CustomQuestion } from '@quiz/shared'
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
  const [showCustom, setShowCustom] = useState(false)

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
    <div className="mx-auto min-h-dvh max-w-7xl px-4 pb-8">
      <header className="sticky top-0 z-20 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-bg/80 px-4 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="rounded-lg bg-brand-600/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-300">
            Moderator
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 font-mono text-lg font-black tracking-[0.3em] transition hover:bg-white/10"
            title="Einladungslink kopieren"
          >
            {state.roomCode}
            <Copy className="h-4 w-4 text-white/60" />
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

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr_1fr]">
        {/* ---------- Linke Spalte: Steuerung ---------- */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">Steuerung</h3>
              <span className="text-xs text-white/60">Runde {state.round}</span>
            </div>
            <PhaseControls state={state} />
          </div>

          {/* Benutzerdefinierte Kategorien & Fragen */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setShowCustom((v) => !v)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/60">
                <Plus className="h-4 w-4" /> Eigene Kategorien
              </span>
              <ChevronDown className={cn('h-4 w-4 transition', showCustom && 'rotate-180')} />
            </button>
            {showCustom && <CustomCategoriesPanel categories={state.settings.customCategories} questions={state.settings.customQuestions} />}
          </div>

          {/* Einstellungen */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setShowSettings((v) => !v)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/60">
                Einstellungen
              </span>
              <ChevronDown className={cn('h-4 w-4 transition', showSettings && 'rotate-180')} />
            </button>
            {showSettings && <SettingsPanel />}
          </div>
        </div>

        {/* ---------- Mitte: Bühne ---------- */}
        <div className="space-y-5">
          {state.phase === 'lobby' && (
            <div className="card flex flex-col items-center p-8 text-center">
              <h2 className="text-2xl font-bold">Spieler beitreten lassen</h2>
              <p className="mt-2 text-sm text-white/60">QR scannen oder Code teilen</p>
              <div className="mt-6 rounded-2xl bg-white p-4">
                <QRCodeSVG value={joinLink} size={200} />
              </div>
              <div className="mt-5 font-mono text-4xl font-black tracking-[0.4em]">{state.roomCode}</div>
              <p className="mt-4 flex items-center gap-2 text-sm text-white/60">
                <Users className="h-4 w-4" /> {contestantCount} Mitspieler bereit
              </p>
            </div>
          )}

          {state.phase === 'category' && (
            <div className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Kategorie-Wahl</h2>
                <span className="text-sm text-white/60">
                  {votedCount}/{contestantCount} abgestimmt
                </span>
              </div>
              <p className="mb-4 text-sm text-white/60">
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
              <div className="card p-6">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold uppercase tracking-wider text-white/60">
                    {state.currentQuestion.category}
                  </span>
                  <div className="rounded-lg bg-brand-500/20 px-3 py-1 text-sm font-bold text-brand-300">
                    +{state.currentQuestion.points}
                  </div>
                </div>
                <p className="text-2xl font-bold leading-snug">{state.currentQuestion.text}</p>
                {answerVisible && (
                  <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400/80">
                      <Eye className="h-3.5 w-3.5" /> Lösung (nur für dich)
                    </div>
                    <div className="text-xl font-bold text-emerald-300">{answerVisible}</div>
                  </div>
                )}
                {state.phase === 'hotseat' && (
                  <div className="mt-6 flex items-center gap-4">
                    <TimerRing timer={state.timer} size={110} stroke={8} />
                    <div>
                      <div className="text-xs uppercase text-white/60">Am Zug</div>
                      <div className="text-2xl font-black" style={{ color: activePlayer?.color }}>
                        {activePlayer?.name ?? '—'}
                      </div>
                    </div>
                  </div>
                )}
                {state.phase === 'drop' && (
                  <p className="mt-5 text-sm text-white/60">
                    {state.ttsActive ? 'Bot liest vor …' : 'Bereit'} · Warte auf den ersten Buzz.
                  </p>
                )}
              </div>
            )}

          {state.phase === 'gameover' && (
            <div className="card p-8 text-center">
              <Trophy className="mx-auto mb-3 h-12 w-12 text-yellow-400" />
              <h2 className="text-2xl font-black">Spiel beendet</h2>
              <p className="mt-2 text-white/60">Starte ein neues Spiel über die Steuerung.</p>
            </div>
          )}
        </div>

        {/* ---------- Rechte Spalte: Queue + Rangliste ---------- */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/60">Buzzer-Queue</h3>
            <BuzzQueue queue={state.buzzQueue} activePlayerId={state.activePlayerId} />
          </div>
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">Rangliste</h3>
              <button
                onClick={() => mod.resetScores()}
                className="flex items-center gap-1 text-xs text-white/60 transition hover:text-white"
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
  const hasCustomContent = state.settings.customCategories.length > 0 && state.settings.customQuestions.length > 0

  if (phase === 'lobby' || phase === 'gameover') {
    return (
      <div className="space-y-2">
        <Button
          className="w-full"
          size="lg"
          onClick={() => mod.startVote()}
          disabled={!hasCustomContent}
        >
          <Play className="h-5 w-5" /> {phase === 'lobby' ? 'Spiel starten' : 'Neues Spiel'}
          <Hotkey>Leertaste</Hotkey>
        </Button>
        {!hasCustomContent && (
          <p className="text-center text-xs text-white/60">
            Erstelle zuerst Kategorien und Fragen unter "Eigene Kategorien"
          </p>
        )}
      </div>
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
        <div className="flex items-center justify-center gap-4 text-xs text-white/60">
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
          <span className="text-white/60">Rundenzeit-Limit</span>
          <span className="font-mono font-bold">{settings.roundTimeLimit > 0 ? `${settings.roundTimeLimit / 1000}s` : 'Aus'}</span>
        </div>
        <input
          type="range"
          min={0}
          max={120}
          step={10}
          value={settings.roundTimeLimit / 1000}
          onChange={(e) => mod.updateSettings({ roundTimeLimit: Number(e.target.value) * 1000 })}
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
          {settings.ttsEnabled ? <Volume2 className="h-4 w-4 text-accent" /> : <VolumeX className="h-4 w-4 text-white/60" />}
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

function CustomCategoriesPanel({
  categories,
  questions,
}: {
  categories: CustomCategory[]
  questions: CustomQuestion[]
}) {
  const [newCatName, setNewCatName] = useState('')
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null)
  const [newQ, setNewQ] = useState({ text: '', answer: '' })
  const setError = useGame((s) => s.setError)

  const selectedCat = categories.find((c) => c.id === selectedCatId)
  const catQuestions = questions.filter((q) => q.categoryId === selectedCatId)

  // Save to localStorage whenever categories/questions change
  useEffect(() => {
    if (categories.length > 0 || questions.length > 0) {
      localStorage.setItem('quizbuzz_categories', JSON.stringify(categories))
      localStorage.setItem('quizbuzz_questions', JSON.stringify(questions))
    }
  }, [categories, questions])

  // Load from localStorage on mount
  useEffect(() => {
    const savedCats = localStorage.getItem('quizbuzz_categories')
    const savedQuestions = localStorage.getItem('quizbuzz_questions')
    if (savedCats || savedQuestions) {
      // Note: This would need server-side persistence to be fully functional
      // For now, we're just setting up the structure
    }
  }, [])

  async function createCategory() {
    if (!newCatName.trim()) return
    const res = await mod.createCategory(newCatName)
    if (res && typeof res === 'object' && 'ok' in res && res.ok) {
      setNewCatName('')
      setError('Kategorie erstellt')
    } else if (res && typeof res === 'object' && 'error' in res) {
      setError(String(res.error) || 'Fehler')
    }
  }

  async function addQuestion() {
    if (!selectedCatId || !newQ.text.trim() || !newQ.answer.trim()) return
    const res = await mod.addQuestion({
      categoryId: selectedCatId,
      category: selectedCat?.name || '',
      points: 500,
      text: newQ.text,
      answer: newQ.answer,
    })
    if (res && typeof res === 'object' && 'ok' in res && res.ok) {
      setNewQ({ text: '', answer: '' })
      setError('Frage hinzugefügt')
    } else if (res && typeof res === 'object' && 'error' in res) {
      setError(String(res.error) || 'Fehler')
    }
  }

  function deleteCategory(id: string) {
    mod.deleteCategory(id)
    if (selectedCatId === id) setSelectedCatId(null)
  }

  function deleteQuestion(id: string) {
    mod.deleteQuestion(id)
  }

  return (
    <div className="space-y-4 border-t border-white/5 p-4">
      {/* Neue Kategorie erstellen */}
      <div className="space-y-2">
        <label className="label">Neue Kategorie erstellen</label>
        <div className="flex gap-2">
          <input
            className="input flex-1 py-2"
            placeholder="z.B. Filme, Sport, Geschichte..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createCategory()}
          />
          <Button size="sm" onClick={createCategory}>
            <Plus className="h-4 w-4" /> Erstellen
          </Button>
        </div>
        <div className="mt-3">
          <label className="label text-xs text-white/60">Oder Vorlage verwenden:</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {['Allgemeinwissen', 'Geographie', 'Geschichte', 'Wissenschaft', 'Sport', 'Musik', 'Filme', 'Literatur'].map((template) => (
              <button
                key={template}
                onClick={() => setNewCatName(template)}
                className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kategorien-Liste */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-white/40">
              Deine Kategorien ({categories.length})
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const data = { categories, questions }
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `quizbuzz-kategorien-${Date.now()}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                  setError('Kategorien exportiert')
                }}
              >
                <Download className="h-4 w-4" /> Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'application/json'
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (!file) return
                    try {
                      const text = await file.text()
                      const data = JSON.parse(text)
                      if (data.categories && data.questions) {
                        // Import categories
                        for (const cat of data.categories) {
                          await mod.createCategory(cat.name)
                        }
                        // Import questions (need to map category names to IDs)
                        // This is a simplified version - in production you'd want better error handling
                        setError('Kategorien importiert')
                      } else {
                        setError('Ungültiges Dateiformat')
                      }
                    } catch {
                      setError('Fehler beim Import')
                    }
                  }
                  input.click()
                }}
              >
                <Upload className="h-4 w-4" /> Import
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            {categories.map((cat) => {
              const questionCount = questions.filter((q) => q.categoryId === cat.id).length
              return (
                <div
                  key={cat.id}
                  className={cn(
                    'group relative overflow-hidden rounded-xl border transition-all duration-200',
                    selectedCatId === cat.id
                      ? 'border-brand-500/50 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
                  )}
                >
                  <button
                    onClick={() => setSelectedCatId(cat.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-white">{cat.name}</div>
                      <div className="mt-1 text-xs text-white/50">
                        {questionCount} {questionCount === 1 ? 'Frage' : 'Fragen'}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteCategory(cat.id)
                      }}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Fragen für ausgewählte Kategorie */}
      {selectedCat && (
        <div className="space-y-4 border-t border-white/5 pt-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-white/40">
              Fragen für: {selectedCat.name}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCatId(null)}
              className="text-xs text-white/50 hover:text-white"
            >
              Schließen
            </Button>
          </div>

          {/* Neue Frage */}
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/50">Jede Frage gibt +500 Punkte</div>
              <Button onClick={addQuestion}>
                <Plus className="h-4 w-4" /> Frage hinzufügen
              </Button>
            </div>
            <div>
              <label className="label">Frage</label>
              <textarea
                className="input min-h-[64px] py-2"
                placeholder="Deine Frage..."
                value={newQ.text}
                onChange={(e) => setNewQ({ ...newQ, text: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Lösung</label>
              <input
                className="input py-2"
                placeholder="Die richtige Antwort..."
                value={newQ.answer}
                onChange={(e) => setNewQ({ ...newQ, answer: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
              />
            </div>
          </div>

          {/* Fragen-Liste */}
          {catQuestions.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-white/40">
                Vorhandene Fragen ({catQuestions.length})
              </div>
              {catQuestions.map((q) => (
                <div
                  key={q.id}
                  className="group rounded-xl border border-white/10 bg-white/5 p-3 transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-brand-500/20 px-2 py-0.5 text-xs font-bold text-brand-300">
                          +{q.points}
                        </div>
                        <span className="font-medium text-white">{q.text}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <span className="font-mono">Lösung:</span>
                        <span className="text-white/70">{q.answer}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteQuestion(q.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
              <p className="text-sm text-white/50">Noch keine Fragen in dieser Kategorie</p>
              <p className="mt-1 text-xs text-white/30">Füge oben deine erste Frage hinzu</p>
            </div>
          )}
        </div>
      )}

      {/* Leerer Zustand */}
      {categories.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-white/50">Noch keine Kategorien erstellt</p>
          <p className="mt-1 text-xs text-white/30">Erstelle oben deine erste Kategorie</p>
        </div>
      )}
    </div>
  )
}
