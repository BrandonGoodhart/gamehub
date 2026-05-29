import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  onDone: () => void
  duration?: number
}

export default function LoadingSplash({ onDone, duration = 2200 }: Props) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const p = Math.min(100, (elapsed / duration) * 100)
      setPct(p)
      if (p >= 100) {
        clearInterval(interval)
        setTimeout(onDone, 250)
      }
    }, 60)
    return () => clearInterval(interval)
  }, [duration, onDone])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.h1
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fg-display text-center"
        style={{
          fontSize: 'clamp(3rem, 11vw, 6rem)',
          padding: '0 8px',
        }}
      >
        CRACKED-HEIST
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="fg-sub mt-3 text-center"
        style={{ fontSize: '1rem' }}
      >
        Answer fast. Steal coins. Don't get caught.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-12 w-full"
        style={{ maxWidth: 640 }}
      >
        <div
          style={{
            width: '100%',
            height: 16,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(74,222,128,0.18)',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: 10,
              background: 'linear-gradient(90deg, #16a34a, #4ade80, #a3e635, #4ade80)',
              backgroundSize: '300% 100%',
              animation: 'fg-bar-shimmer 2s ease-in-out infinite',
              boxShadow:
                '0 0 20px rgba(74,222,128,.5), 0 0 40px rgba(74,222,128,.25), inset 0 1px 0 rgba(255,255,255,.25)',
              transition: 'width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          />
        </div>
        <div className="text-center mt-4 fg-sub" style={{ fontSize: '0.9rem' }}>
          Almost ready...
        </div>
      </motion.div>

      <style>{`
        @keyframes fg-bar-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}
