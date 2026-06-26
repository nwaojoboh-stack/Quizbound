import type { CueType } from '@quiz/shared'

// Kleine WebAudio-Soundkulisse fuer Spannung & Feedback (Buzz, Richtig, Falsch ...)
let ctx: AudioContext | null = null

function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

export function unlockAudio(): void {
  const c = audioCtx()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
}

function tone(
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.15,
): void {
  const c = audioCtx()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, c.currentTime + start)
  g.gain.setValueAtTime(0.0001, c.currentTime + start)
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + duration)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(c.currentTime + start)
  osc.stop(c.currentTime + start + duration + 0.02)
}

export function playCue(type: CueType): void {
  const c = audioCtx()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})
  switch (type) {
    case 'buzz':
      // Dramatic buzz - like Jeopardy timer
      tone(800, 0, 0.15, 'square', 0.2)
      tone(600, 0.08, 0.15, 'square', 0.18)
      tone(400, 0.16, 0.2, 'square', 0.15)
      break
    case 'correct':
      // Celebratory ascending melody - like winning
      tone(523, 0, 0.15, 'triangle', 0.2)
      tone(659, 0.12, 0.15, 'triangle', 0.22)
      tone(784, 0.24, 0.15, 'triangle', 0.24)
      tone(1047, 0.36, 0.25, 'triangle', 0.2)
      break
    case 'wrong':
      // Descending failure sound - classic "buzzer"
      tone(200, 0, 0.2, 'sawtooth', 0.25)
      tone(150, 0.1, 0.25, 'sawtooth', 0.22)
      tone(100, 0.2, 0.3, 'sawtooth', 0.18)
      break
    case 'steal':
      // Alert sound for steal opportunity
      tone(440, 0, 0.08, 'square', 0.16)
      tone(550, 0.08, 0.08, 'square', 0.18)
      tone(660, 0.16, 0.12, 'square', 0.2)
      break
    case 'reveal':
      // Dramatic reveal - ascending chord
      tone(392, 0, 0.2, 'triangle', 0.18)
      tone(523, 0.15, 0.2, 'triangle', 0.2)
      tone(659, 0.3, 0.25, 'triangle', 0.22)
      tone(784, 0.45, 0.3, 'triangle', 0.18)
      break
    case 'start':
      // Round start - energetic
      tone(330, 0, 0.1, 'sine', 0.15)
      tone(440, 0.08, 0.1, 'sine', 0.18)
      tone(554, 0.16, 0.12, 'sine', 0.2)
      tone(659, 0.24, 0.15, 'sine', 0.22)
      break
    case 'tick':
      // Timer tick - sharper
      tone(1200, 0, 0.03, 'sine', 0.1)
      break
  }
}
