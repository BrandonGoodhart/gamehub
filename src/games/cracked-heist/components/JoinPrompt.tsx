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
    <div className="max-w-md mx-auto w-full">
      <button onClick={onBack} className="fg-sub text-sm mb-4 hover:text-white transition-colors">
        ← back
      </button>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="fg-panel fg-panel-lg text-center"
      >
        <div className="fg-lbl mb-2">/ join game</div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1 fg-display">
          Enter Room Code
        </h2>
        <p className="fg-sub text-xs mb-6">your teacher will share it on the board</p>

        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="------"
          className="fg-inp text-center text-3xl tracking-[0.6em]"
          style={{ fontFamily: 'JetBrains Mono, SF Mono, ui-monospace, monospace' }}
        />
        {error && <div className="text-[var(--red)] text-xs mt-3 font-semibold">!! {error}</div>}

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
