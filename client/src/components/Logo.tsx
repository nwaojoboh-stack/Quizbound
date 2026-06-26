import { Zap } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent shadow-glow">
        <Zap className="h-5 w-5 text-white" />
      </div>
      {!compact && (
        <span className="text-lg font-extrabold tracking-tight">
          Quiz<span className="text-gradient">Buzz</span>
        </span>
      )}
    </div>
  )
}
