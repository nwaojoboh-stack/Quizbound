import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Tv } from 'lucide-react'
import { Logo } from './Logo'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { joinRoom } from '@/lib/socket'
import { useGame } from '@/lib/store'
import { unlockAudio } from '@/lib/sound'
import { primeTTS } from '@/lib/tts'

const AVATARS = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎪', '🎸', '🎺', '🎻', '🎹', '🥁', '🎤', '🎧', '🎬', '🎨', '🎭', '🎪', '🎯', '🎲']

export function JoinGate({ roomCode }: { roomCode: string }) {
  const nav = useNavigate()
  const identity = useGame((s) => s.identity)
  const setError = useGame((s) => s.setError)
  const [name, setName] = useState(identity.name || '')
  const [avatar, setAvatar] = useState(identity.avatar || '🎮')
  const [busy, setBusy] = useState(false)

  async function go() {
    unlockAudio()
    primeTTS()
    if (!name.trim()) {
      setError('Bitte gib einen Namen ein.')
      return
    }
    setBusy(true)
    const r = await joinRoom(roomCode, name.trim(), avatar)
    setBusy(false)
    if (!r.ok) setError(r.error || 'Beitritt fehlgeschlagen.')
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <Card>
        <h1 className="text-2xl font-bold">Raum beitreten</h1>
        <p className="mt-1 text-white/50">
          Du trittst Raum <span className="font-mono font-bold text-white">{roomCode}</span> bei.
        </p>
        <div className="mt-5">
          <label className="label">Dein Name</label>
          <input
            className="input"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Alex"
            onKeyDown={(e) => e.key === 'Enter' && go()}
            autoFocus
          />
        </div>
        <div className="mt-4">
          <label className="label">Avatar wählen</label>
          <div className="grid grid-cols-5 gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-2xl transition ${
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
        <Button className="mt-5 w-full" size="lg" onClick={go} disabled={busy}>
          <LogIn className="h-5 w-5" />
          {busy ? 'Trete bei …' : 'Mitspielen'}
        </Button>
        <button
          onClick={() => nav(`/present/${roomCode}`)}
          className="mt-3 flex w-full items-center justify-center gap-2 text-sm text-white/60 transition hover:text-white/70"
        >
          <Tv className="h-4 w-4" />
          Nur zuschauen (Beamer-Ansicht)
        </button>
      </Card>
    </div>
  )
}
