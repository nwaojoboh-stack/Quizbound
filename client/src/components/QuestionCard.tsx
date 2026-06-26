import type { CurrentQuestionPublic } from '@quiz/shared'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

export function QuestionCard({
  q,
  size = 'md',
  ttsActive,
}: {
  q: CurrentQuestionPublic
  size?: 'md' | 'lg' | 'xl'
  ttsActive?: boolean
}) {
  const textCls =
    size === 'xl'
      ? 'text-4xl font-bold leading-snug sm:text-6xl'
      : size === 'lg'
        ? 'text-2xl font-bold leading-snug sm:text-4xl'
        : 'text-xl font-semibold leading-snug sm:text-2xl'

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-white/50">{q.category}</span>
        <div className="flex items-center gap-2">
          {ttsActive && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
              <span className="flex gap-0.5">
                <span className="h-3 w-1 animate-pulse rounded-full bg-accent" />
                <span className="h-3 w-1 animate-pulse rounded-full bg-accent [animation-delay:120ms]" />
                <span className="h-3 w-1 animate-pulse rounded-full bg-accent [animation-delay:240ms]" />
              </span>
              liest vor
            </span>
          )}
          <div className="rounded-lg bg-brand-500/20 px-3 py-1 text-sm font-bold text-brand-300">
            +{q.points}
          </div>
        </div>
      </div>
      <p className={textCls}>{q.text}</p>
      {q.answer && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4')}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400/80">Lösung</div>
          <div
            className={cn(
              'font-bold text-emerald-300',
              size === 'xl' ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl',
            )}
          >
            {q.answer}
          </div>
        </motion.div>
      )}
    </div>
  )
}
