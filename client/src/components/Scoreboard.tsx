import { motion } from 'framer-motion'
import type { Player } from '@quiz/shared'
import { Crown, X } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Scoreboard({
  players,
  meId,
  activePlayerId,
  onKick,
}: {
  players: Player[]
  meId?: string | null
  activePlayerId?: string | null
  onKick?: (id: string) => void
}) {
  const contestants = players.filter((p) => !p.isModerator)
  if (contestants.length === 0) {
    return <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-sm text-white/40">Noch keine Mitspieler.</div>
  }
  return (
    <div className="space-y-2">
      {contestants.map((p, i) => (
        <motion.div
          layout
          key={p.id}
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          className={cn(
            'flex items-center gap-3 rounded-xl border px-3 py-2.5',
            p.id === activePlayerId
              ? 'border-brand-500 bg-brand-600/15'
              : p.id === meId
                ? 'border-brand-500/40 bg-brand-600/10'
                : 'border-white/10 bg-white/5',
            !p.connected && 'opacity-50',
          )}
        >
          <span
            className={cn(
              'w-6 text-center font-mono text-lg font-black',
              i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-white/40',
            )}
          >
            {i + 1}
          </span>
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: p.color }} />
          <span className="flex-1 truncate font-semibold">
            {p.name}
            {i === 0 && contestants.length > 1 && (
              <Crown className="ml-1.5 inline h-4 w-4 -translate-y-0.5 text-yellow-400" />
            )}
          </span>
          {!p.connected && <span className="text-[10px] uppercase text-white/30">offline</span>}
          <span className="font-mono text-lg font-black tabular-nums">{p.score}</span>
          {onKick && p.id !== meId && (
            <button
              onClick={() => onKick(p.id)}
              className="text-white/30 transition hover:text-danger"
              title="Entfernen"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      ))}
    </div>
  )
}
