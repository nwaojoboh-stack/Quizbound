import type { Difficulty } from '@quiz/shared'
import { DIFFICULTY_LABELS } from '@quiz/shared'
import { cn } from '@/lib/cn'

const styles: Record<Difficulty, string> = {
  easy: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  medium: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  hard: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  extreme: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
}

export function DifficultyBadge({
  difficulty,
  points,
  className,
}: {
  difficulty: Difficulty
  points?: number
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
        styles[difficulty],
        className,
      )}
    >
      {DIFFICULTY_LABELS[difficulty]}
      {points != null && <span className="opacity-80">· {points}</span>}
    </span>
  )
}
