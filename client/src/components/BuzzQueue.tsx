import type { BuzzEntry } from '@quiz/shared'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

export function BuzzQueue({
  queue,
  activePlayerId,
}: {
  queue: BuzzEntry[]
  activePlayerId: string | null
}) {
  if (!queue.length) {
    return <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-sm text-white/40">Noch kein Buzz.</div>
  }
  const first = queue[0]?.normalizedMs ?? 0
  return (
    <div className="space-y-2">
      {queue.map((b) => {
        const active = b.playerId === activePlayerId
        const delta = b.normalizedMs - first
        return (
          <motion.div
            layout
            key={b.playerId}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3 py-2',
              active
                ? 'border-brand-500 bg-brand-600/20 shadow-glow'
                : b.status === 'wrong'
                  ? 'border-rose-500/30 bg-rose-500/5 opacity-60'
                  : b.status === 'correct'
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-white/10 bg-white/5',
            )}
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-black/30 font-mono text-sm font-bold">
              {b.rank}
            </span>
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: b.color }} />
            <span className="flex-1 truncate font-semibold">{b.name}</span>
            <span className="font-mono text-xs text-white/50">
              {b.rank === 1 ? '+0 ms' : `+${Math.round(delta)} ms`}
            </span>
            {b.status === 'wrong' && <span className="text-xs font-bold text-rose-400">FALSCH</span>}
            {b.status === 'correct' && <span className="text-xs font-bold text-emerald-400">RICHTIG</span>}
            {active && b.status === 'pending' && (
              <span className="text-xs font-bold text-brand-300">DRAN</span>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
