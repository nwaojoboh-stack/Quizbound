import { useEffect, useRef, useState } from 'react'
import type { TimerState } from '@quiz/shared'
import { serverNow } from '@/lib/store'
import { cn } from '@/lib/cn'

export function TimerRing({
  timer,
  size = 120,
  stroke = 10,
}: {
  timer: TimerState | null
  size?: number
  stroke?: number
}) {
  const [now, setNow] = useState(() => serverNow())
  const raf = useRef<number | undefined>(undefined)

  useEffect(() => {
    let active = true
    const loop = () => {
      if (!active) return
      setNow(serverNow())
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => {
      active = false
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [])

  if (!timer) return null

  const remaining = Math.max(0, timer.endsAt - now)
  const frac = Math.max(0, Math.min(1, remaining / timer.durationMs))
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const danger = remaining <= 3000
  const color = danger ? '#ef4444' : remaining <= 6000 ? '#f59e0b' : '#22d3ee'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          style={{ transition: 'stroke 0.3s linear' }}
        />
      </svg>
      <div
        className={cn(
          'absolute inset-0 grid place-items-center font-mono font-black tabular-nums',
          danger ? 'animate-pulse text-danger' : 'text-white',
        )}
      >
        <span style={{ fontSize: size * 0.3 }}>{(remaining / 1000).toFixed(1)}</span>
      </div>
    </div>
  )
}
