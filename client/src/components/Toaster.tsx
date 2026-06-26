import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '@/lib/store'

export function Toaster() {
  const error = useGame((s) => s.error)
  const setError = useGame((s) => s.setError)

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 3500)
      return () => clearTimeout(t)
    }
  }, [error, setError])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="pointer-events-auto rounded-xl border border-danger/40 bg-danger/15 px-4 py-3 text-sm font-medium text-red-200 backdrop-blur-xl"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
