import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  onJoin: (code: string) => void
  onBack: () => void
  error?: string
}

export default function JoinPrompt({ onJoin, onBack, error }: Props) {
  const [code, setCode] = useState('')

  function submit() {
    const c = code.trim().toUpperCase()
    if (c.length === 6) onJoin(c)
  }

  return (
    <div className="max-w-[440px] mx-auto w-full">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="rounded-xl px-3 py-2 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(74,222,128,0.18)',
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          ←
        </button>
        <div className="fg-display text-xl" style={{ padding: 0 }}>
          Join Game
        </div>
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="fg-panel fg-panel-lg text-center"
      >
        <div className="fg-lbl mb-2">room code</div>
        <p className="fg-sub text-xs mb-5">
          your teacher will share it on the board
        </p>

        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="------"
          className="fg-inp text-center"
          style={{
            fontSize: '2rem',
            letterSpacing: '0.5em',
            paddingLeft: '0.5em',
            fontFamily: 'JetBrains Mono, SF Mono, ui-monospace, monospace',
            fontWeight: 700,
          }}
        />
        {error && (
          <div className="text-[var(--red)] text-xs mt-3 font-semibold">
            !! {error}
          </div>
        )}

        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          disabled={code.length !== 6}
          onClick={submit}
          className="fg-btn fg-btn-grad mt-5"
        >
          Connect →
        </motion.button>
      </motion.div>
    </div>
  )
}
