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
    <div className="max-w-md mx-auto space-y-6">
      <button
        onClick={onBack}
        className="text-emerald-500 hover:text-emerald-300 font-mono text-sm"
      >
        &lt; back
      </button>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-black/80 border-2 border-cyan-500 rounded-2xl p-8 shadow-[0_0_30px_rgba(103,232,249,0.4)] text-center"
      >
        <div className="text-cyan-500 font-mono text-sm mb-2">// authenticate</div>
        <h2 className="text-2xl md:text-3xl font-mono font-bold text-cyan-300 mb-6 tracking-wider">
          ENTER ROOM CODE
        </h2>
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="------"
          className="w-full bg-black border-2 border-cyan-700 text-cyan-200 px-4 py-4 rounded-lg font-mono text-3xl text-center tracking-[0.6em] focus:outline-none focus:border-cyan-300"
        />
        {error && <div className="text-red-400 font-mono text-xs mt-3">!! {error}</div>}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={code.length !== 6}
          onClick={submit}
          className="w-full mt-5 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-900 disabled:text-cyan-700 text-black font-mono font-bold text-lg tracking-wider"
        >
          &gt; CONNECT_
        </motion.button>
      </motion.div>
    </div>
  )
}
