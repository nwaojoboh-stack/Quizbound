import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

export function BuzzerButton({
  onBuzz,
  disabled,
  hasBuzzed,
  label,
  sublabel,
}: {
  onBuzz: () => void
  disabled?: boolean
  hasBuzzed?: boolean
  label?: string
  sublabel?: string
}) {
  const idle = !disabled && !hasBuzzed
  return (
    <div className="relative grid place-items-center">
      {idle && (
        <span
          className="absolute rounded-full animate-pulse-ring"
          style={{ width: 'min(72vw, 300px)', height: 'min(72vw, 300px)' }}
        />
      )}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onBuzz}
        disabled={disabled}
        className={cn(
          'relative aspect-square w-[min(72vw,300px)] select-none rounded-full border-4 font-black uppercase tracking-wider text-white transition',
          hasBuzzed
            ? 'border-emerald-300/40 bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-glow-accent'
            : disabled
              ? 'border-white/10 bg-white/10 text-white/40 shadow-none'
              : 'border-rose-300/40 bg-gradient-to-b from-rose-500 to-rose-700 shadow-glow-danger active:from-rose-400',
        )}
      >
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="text-3xl sm:text-4xl">{label ?? (hasBuzzed ? 'GEBUZZERT' : 'BUZZER')}</span>
          {sublabel && <span className="text-xs font-semibold normal-case tracking-normal text-white/70">{sublabel}</span>}
        </div>
      </motion.button>
    </div>
  )
}
