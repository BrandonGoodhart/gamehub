import { motion } from 'framer-motion'
import { CATEGORIES } from '../questions'
import type { Settings } from '../types'

interface Props {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onStart: (category: string) => void
}

export default function CategoryPick({ settings, onChange, onStart }: Props) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <div className="text-emerald-500 font-mono text-sm mb-2">// configure_session</div>
        <h2 className="text-3xl md:text-4xl font-mono font-bold text-emerald-300 tracking-wider">
          CHOOSE A TARGET FEED
        </h2>
      </div>

      <div className="bg-black/60 border border-emerald-800 rounded-lg p-5 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <label className="text-sm">
          <div className="text-emerald-400 mb-1">round_time (sec):</div>
          <input
            type="number"
            min={20}
            max={300}
            value={settings.roundSeconds}
            onChange={(e) => onChange({ roundSeconds: Math.max(20, Math.min(300, +e.target.value || 60)) })}
            className="w-full bg-black border border-emerald-700 text-emerald-200 px-3 py-2 rounded focus:outline-none focus:border-emerald-300"
          />
        </label>
        <label className="text-sm">
          <div className="text-emerald-400 mb-1">total_rounds:</div>
          <input
            type="number"
            min={1}
            max={20}
            value={settings.totalRounds}
            onChange={(e) => onChange({ totalRounds: Math.max(1, Math.min(20, +e.target.value || 5)) })}
            className="w-full bg-black border border-emerald-700 text-emerald-200 px-3 py-2 rounded focus:outline-none focus:border-emerald-300"
          />
        </label>
        <label className="text-sm">
          <div className="text-emerald-400 mb-1">start_coins:</div>
          <input
            type="number"
            min={0}
            max={1000}
            value={settings.startingCoins}
            onChange={(e) => onChange({ startingCoins: Math.max(0, Math.min(1000, +e.target.value || 100)) })}
            className="w-full bg-black border border-emerald-700 text-emerald-200 px-3 py-2 rounded focus:outline-none focus:border-emerald-300"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CATEGORIES.map((cat, i) => (
          <motion.button
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onStart(cat)}
            className="px-5 py-4 rounded-lg bg-black/60 border-2 border-emerald-700 hover:border-emerald-300 hover:bg-emerald-900/30 font-mono text-emerald-200 hover:text-emerald-100 transition-all text-left"
          >
            <div className="text-emerald-500 text-xs mb-1">&gt; ./category</div>
            <div className="text-lg font-bold">{cat}</div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
