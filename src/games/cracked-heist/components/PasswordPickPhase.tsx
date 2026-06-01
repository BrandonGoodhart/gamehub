import { useState } from 'react'
import { motion } from 'framer-motion'
import { PASSWORD_POOL } from '../utils'

interface Props {
  onLock: (password: string) => void
}

export default function PasswordPickPhase({ onLock }: Props) {
  const [picked, setPicked] = useState<string | null>(null)

  return (
    <div className="max-w-[440px] mx-auto w-full space-y-5 pb-5">
      <div className="text-center">
        <div className="fg-lbl mb-2">/ choose your password</div>
        <h1
          className="fg-display"
          style={{ fontSize: 'clamp(2rem, 7vw, 3rem)', padding: '0 8px' }}
        >
          Pick Your Password
        </h1>
        <p className="fg-sub text-xs mt-1">
          This is your password for the whole game. Don't show anyone.
        </p>
      </div>

      <div className="fg-panel p-5">
        <div className="grid grid-cols-2 gap-3">
          {PASSWORD_POOL.map((pw) => {
            const active = picked === pw
            return (
              <motion.button
                key={pw}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setPicked(pw)}
                className="rounded-2xl p-4 font-extrabold text-center transition-all"
                style={{
                  background: active
                    ? 'linear-gradient(135deg, #22c55e, #4ade80, #a3e635)'
                    : 'rgba(255,255,255,0.04)',
                  border: active
                    ? '2px solid rgba(74,222,128,0.7)'
                    : '2px solid rgba(74,222,128,0.18)',
                  color: active ? '#052e16' : '#fff',
                  boxShadow: active
                    ? '0 0 22px rgba(74,222,128,0.5)'
                    : '0 4px 14px rgba(0,0,0,0.3)',
                  fontSize: '1.1rem',
                  letterSpacing: '0.05em',
                  fontFamily:
                    'JetBrains Mono, SF Mono, ui-monospace, monospace',
                }}
              >
                {pw}
              </motion.button>
            )
          })}
        </div>
      </div>

      <motion.button
        whileHover={picked ? { y: -2 } : {}}
        whileTap={picked ? { scale: 0.97 } : {}}
        disabled={!picked}
        onClick={() => picked && onLock(picked)}
        className="fg-btn fg-btn-grad"
      >
        {picked ? `Lock In "${picked}" →` : 'Pick One Above'}
      </motion.button>
    </div>
  )
}
