import { motion } from 'framer-motion'
import { CATEGORIES } from '../questions'
import type { Settings } from '../types'

interface Props {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onStart: (category: string) => void
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  'General Knowledge': 'linear-gradient(135deg, #22c55e, #4ade80)',
  'Tech & Hacking': 'linear-gradient(135deg, #34d399, #5eead4)',
  'Pop Culture': 'linear-gradient(135deg, #4ade80, #a3e635)',
  'Math': 'linear-gradient(135deg, #10b981, #34d399)',
  'Science': 'linear-gradient(135deg, #16a34a, #84cc16)',
}

export default function CategoryPick({ settings, onChange, onStart }: Props) {
  return (
    <div className="max-w-3xl mx-auto w-full space-y-5">
      <div className="text-center">
        <div className="fg-lbl mb-2">/ configure session</div>
        <h2 className="fg-display text-[clamp(2rem,6vw,3rem)]">Pick a Category</h2>
      </div>

      <div className="fg-panel p-5">
        <div className="fg-lbl mb-3">round settings</div>
        <div className="grid grid-cols-3 gap-3">
          <NumField
            label="round (sec)"
            value={settings.roundSeconds}
            min={20}
            max={300}
            onChange={(v) => onChange({ roundSeconds: v })}
          />
          <NumField
            label="rounds"
            value={settings.totalRounds}
            min={1}
            max={20}
            onChange={(v) => onChange({ totalRounds: v })}
          />
          <NumField
            label="start coins"
            value={settings.startingCoins}
            min={0}
            max={1000}
            onChange={(v) => onChange({ startingCoins: v })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CATEGORIES.map((cat, i) => (
          <motion.button
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onStart(cat)}
            className="fg-mode-card p-5 text-left flex items-center gap-3"
          >
            <div
              className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl font-extrabold"
              style={{
                background: CATEGORY_GRADIENTS[cat] ?? 'linear-gradient(135deg, #22c55e, #4ade80)',
                color: '#052e16',
                boxShadow: '0 4px 14px rgba(74,222,128,.3)',
              }}
            >
              {cat.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="fg-lbl mb-0.5">category</div>
              <div className="text-base font-extrabold tracking-tight truncate">{cat}</div>
            </div>
            <span className="text-[var(--green-l)] text-xl">→</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function NumField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <div className="fg-lbl mb-1.5">{label}</div>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, +e.target.value || min)))}
        className="fg-inp text-center"
      />
    </label>
  )
}
