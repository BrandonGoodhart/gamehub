import { motion } from 'framer-motion'
import type { RoomState } from '../types'

interface Props {
  state: RoomState
  onNext: () => void
}

export default function RoundEnd({ state, onNext }: Props) {
  const sorted = [...state.players].sort((a, b) => b.coins - a.coins)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto bg-black/80 border border-emerald-500 rounded-lg p-6 font-mono shadow-[0_0_25px_rgba(50,220,120,0.4)]"
    >
      <h2 className="text-2xl text-emerald-300 mb-1">&gt; round_{state.round}_complete</h2>
      <p className="text-emerald-500 text-sm mb-4">// standings</p>
      <div className="space-y-1 mb-6">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-3 py-2 rounded ${
              p.id === state.meId ? 'bg-emerald-900/40 border border-emerald-700' : 'bg-black/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 w-6">{i + 1}.</span>
              <span className="text-emerald-200">{p.handle}</span>
              {p.id === state.meId && <span className="text-cyan-400 text-xs">[you]</span>}
            </div>
            <span className="text-amber-300 tabular-nums">{p.coins}c</span>
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        className="w-full py-3 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg tracking-wider"
      >
        &gt; NEXT ROUND_
      </button>
    </motion.div>
  )
}
