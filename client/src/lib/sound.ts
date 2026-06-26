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
      tone(880, 0, 0.18, 'square', 0.18)
      tone(660, 0.05, 0.2, 'square', 0.14)
      break
    case 'correct':
      tone(523, 0, 0.12, 'triangle', 0.18)
      tone(659, 0.12, 0.12, 'triangle', 0.18)
      tone(784, 0.24, 0.22, 'triangle', 0.2)
      break
    case 'wrong':
      tone(220, 0, 0.28, 'sawtooth', 0.16)
      tone(160, 0.08, 0.34, 'sawtooth', 0.14)
      break
    case 'steal':
      tone(440, 0, 0.1, 'square', 0.14)
      tone(620, 0.1, 0.16, 'square', 0.14)
      break
    case 'reveal':
      tone(392, 0, 0.16, 'triangle', 0.16)
      tone(587, 0.16, 0.3, 'triangle', 0.18)
      break
    case 'start':
      tone(330, 0, 0.1, 'sine', 0.12)
      tone(494, 0.1, 0.18, 'sine', 0.14)
      break
    case 'tick':
      tone(1000, 0, 0.04, 'sine', 0.08)
      break
  }
}
