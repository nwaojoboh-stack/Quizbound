import { useGame } from '@/lib/store'
import { cn } from '@/lib/cn'

export function ConnectionDot({ className }: { className?: string }) {
  const connected = useGame((s) => s.connected)
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', className)}>
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          connected ? 'bg-success shadow-[0_0_8px] shadow-success' : 'animate-pulse bg-danger',
        )}
      />
      <span className="text-white/50">{connected ? 'Verbunden' : 'Getrennt'}</span>
    </span>
  )
}
