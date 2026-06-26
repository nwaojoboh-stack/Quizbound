import type { CategoryOption } from '@quiz/shared'
import { DifficultyBadge } from './DifficultyBadge'
import { cn } from '@/lib/cn'

export function CategoryGrid({
  options,
  myVote,
  onVote,
  disabled,
  showForce,
}: {
  options: CategoryOption[]
  myVote: string | null
  onVote: (id: string) => void
  disabled?: boolean
  showForce?: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {options.map((o) => {
        const sel = o.id === myVote
        return (
          <button
            key={o.id}
            disabled={disabled}
            onClick={() => onVote(o.id)}
            className={cn(
              'group relative overflow-hidden rounded-2xl border p-4 text-left transition active:scale-[0.99] disabled:cursor-default',
              sel
                ? 'border-brand-500 bg-brand-600/20 shadow-glow'
                : 'border-white/10 bg-white/5 hover:border-white/25',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-lg font-bold">{o.category}</span>
              <span className="font-mono text-2xl font-black text-gradient">{o.points}</span>
            </div>
            <div className="mt-2">
              <DifficultyBadge difficulty={o.difficulty} />
            </div>
            {sel && (
              <span className="absolute right-3 top-3 text-[10px] font-bold uppercase tracking-wide text-brand-300">
                {showForce ? 'Erzwingen' : 'Deine Wahl'}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
