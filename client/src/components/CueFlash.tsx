import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '@/lib/store'

const colors: Record<string, string> = {
  correct: 'rgba(34,197,94,0.22)',
  wrong: 'rgba(239,68,68,0.26)',
  buzz: 'rgba(124,58,237,0.20)',
  steal: 'rgba(245,158,11,0.20)',
  reveal: 'rgba(34,211,238,0.16)',
}

export function CueFlash() {
  const cue = useGame((s) => s.cue)
  const [flash, setFlash] = useState<{ key: number; color: string } | null>(null)

  useEffect(() => {
    if (cue && colors[cue.type]) {
      setFlash({ key: cue.at, color: colors[cue.type] })
      const t = setTimeout(() => setFlash(null), 480)
      return () => clearTimeout(t)
    }
  }, [cue])

  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          key={flash.key}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.48 }}
          className="pointer-events-none fixed inset-0 z-40"
          style={{ background: flash.color }}
        />
      )}
    </AnimatePresence>
  )
}
