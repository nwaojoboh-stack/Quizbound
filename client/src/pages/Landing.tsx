import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, LogIn, Mic, Radio, RotateCcw, Tv, Zap } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConnectionDot } from '@/components/ConnectionDot'
import { createRoom, joinRoom } from '@/lib/socket'
import { useGame } from '@/lib/store'
import { unlockAudio } from '@/lib/sound'
import { primeTTS } from '@/lib/tts'

const AVATARS = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎪', '🎸', '🎺', '🎻', '🎹', '🥁', '🎤', '🎧', '🎬', '🎨', '🎭', '🎪', '🎯', '🎲']

export default function Landing() {
  const nav = useNavigate()
  const identity = useGame((s) => s.identity)
  const setError = useGame((s) => s.setError)
  const [name, setName] = useState(identity.name || '')
  const [avatar, setAvatar] = useState(identity.avatar || '🎮')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState<'create' | 'join' | null>(null)

  function prime() {
    unlockAudio()
    primeTTS()
  }

  async function onCreate() {
    if (busy) return
    prime()
    if (!name.trim()) {
      setError('Bitte gib einen Namen ein.')
      return
    }
    setBusy('create')
    const r = await createRoom(name.trim(), avatar)
    setBusy(null)
    if (r.ok && r.roomCode) nav(`/room/${r.roomCode}`)
    else setError(r.error || 'Konnte Raum nicht erstellen.')
  }

  async function onJoin() {
    if (busy) return
    prime()
    if (!name.trim()) {
      setError('Bitte gib einen Namen ein.')
      return
    }
    if (code.trim().length < 4) {
      setError('Bitte gib einen gültigen Raum-Code ein.')
      return
    }
    setBusy('join')
    const r = await joinRoom(code.trim(), name.trim(), avatar)
    setBusy(null)
    if (r.ok) nav(`/room/${code.trim().toUpperCase()}`)
    else setError(r.error || 'Beitritt fehlgeschlagen.')
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-6 py-8">
      <header className="flex items-center justify-between">
        <Logo />
        <ConnectionDot />
      </header>

      {identity.roomCode && identity.role && (
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() =>
            nav(identity.role === 'spectator' ? `/present/${identity.roomCode}` : `/room/${identity.roomCode}`)
          }
          className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-brand-500/40 bg-brand-600/15 px-5 py-4 text-left transition hover:bg-brand-600/25"
        >
          <span className="flex items-center gap-2 text-sm">
            <RotateCcw className="h-4 w-4 text-brand-300" />
            Zurück zu Raum <span className="font-mono font-bold">{identity.roomCode}</span>
          </span>
          <ArrowRight className="h-4 w-4 text-brand-300" />
        </motion.button>
      )}

      <div className="flex flex-1 flex-col justify-center py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/60">
            <Radio className="h-4 w-4 text-accent" />
            Kompetitive Live-Voice-Quiz-Engine
          </div>
          <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-7xl">
            Wissen. Reaktion. <span className="text-gradient">Buzzer.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/60">
            Keine Multiple-Choice-Antworten. Millisekunden-genauer Server-Buzzer, Steal-Mechanik und ein
            God-Mode-Dashboard für den Moderator. Spielbar auf Handy, Tablet und PC.
          </p>
        </motion.div>

        <div className="grid items-start gap-6 md:grid-cols-2">
          <Card className="border-brand-500/30 p-6">
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg bg-brand-600/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-300">
              <Mic className="h-4 w-4" /> Spiel leiten
            </div>
            <h2 className="text-2xl font-bold">Neuen Raum erstellen</h2>
            <p className="mt-2 text-sm text-white/60">Du wirst Moderator und steuerst das Spiel.</p>
            <div className="mt-5">
              <label className="label">Dein Name</label>
              <input
                className="input"
                value={name}
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. Moderator Max"
                onKeyDown={(e) => e.key === 'Enter' && onCreate()}
              />
            </div>
            <div className="mt-5">
              <label className="label">Avatar wählen</label>
              <div className="grid grid-cols-5 gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAvatar(a)}
                    className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl transition ${
                      avatar === a
                        ? 'bg-brand-500/30 border-2 border-brand-500'
                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <Button className="mt-5 w-full" size="lg" onClick={onCreate} disabled={busy !== null}>
              <Zap className="h-5 w-5" />
              {busy === 'create' ? 'Erstelle …' : 'Raum erstellen'}
            </Button>
          </Card>

          <Card className="p-6">
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/70">
              <LogIn className="h-4 w-4" /> Mitspielen
            </div>
            <h2 className="text-2xl font-bold">Raum beitreten</h2>
            <p className="mt-2 text-sm text-white/60">Gib den Code vom Moderator ein.</p>
            <div className="mt-5 grid grid-cols-1 gap-4">
              <div>
                <label className="label">Raum-Code</label>
                <input
                  className="input text-center font-mono text-2xl font-black uppercase tracking-[0.4em]"
                  value={code}
                  maxLength={6}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  onKeyDown={(e) => e.key === 'Enter' && onJoin()}
                />
              </div>
              <div>
                <label className="label">Dein Name</label>
                <input
                  className="input"
                  value={name}
                  maxLength={24}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z. B. Alex"
                  onKeyDown={(e) => e.key === 'Enter' && onJoin()}
                />
              </div>
              <div>
                <label className="label">Avatar wählen</label>
                <div className="grid grid-cols-5 gap-2">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvatar(a)}
                      className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl transition ${
                        avatar === a
                          ? 'bg-brand-500/30 border-2 border-brand-500'
                          : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Button className="mt-5 w-full" size="lg" variant="secondary" onClick={onJoin} disabled={busy !== null}>
              <ArrowRight className="h-5 w-5" />
              {busy === 'join' ? 'Trete bei …' : 'Beitreten'}
            </Button>
          </Card>
        </div>

        <div className="mt-8 flex items-center justify-center">
          <button
            onClick={() => code.trim().length >= 4 && nav(`/present/${code.trim().toUpperCase()}`)}
            className="flex items-center gap-2 text-sm text-white/50 transition hover:text-white/70"
          >
            <Tv className="h-4 w-4" />
            Beamer-/Präsentationsansicht öffnen (Code oben eingeben)
          </button>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-white/40">
        Tipp: Sprach-Chat läuft parallel über Discord o. Ä. – integrierter Voice folgt.
      </footer>
    </div>
  )
}
