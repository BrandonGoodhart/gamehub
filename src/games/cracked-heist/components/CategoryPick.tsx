import { motion } from 'framer-motion'
import { CATEGORIES } from '../questions'
import type { Settings } from '../types'

interface Props {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onStart: (category: string) => void
}

const CATEGORY_ICONS: Record<string, string> = {
  'General Knowledge': '◆',
  'Tech & Hacking': '⚡',
  'Pop Culture': '★',
  'Math': '∑',
  'Science': '⚛',
}

export default function CategoryPick({ settings, onChange, onStart }: Props) {
  return (
    <div className="max-w-[440px] mx-auto w-full space-y-5 pb-5">
      <div className="text-center">
        <h1
          className="fg-display"
          style={{ fontSize: 'clamp(2rem, 7vw, 3rem)', padding: '0 8px' }}
        >
          Pick a Category
        </h1>
        <p className="fg-sub text-xs mt-1">configure the round</p>
      </div>

      <div className="fg-panel p-4">
        <div className="grid grid-cols-3 gap-3">
          <NumField
            label="seconds"
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

      <div className="grid grid-cols-2 gap-3.5" style={{ maxWidth: 380, margin: '0 auto' }}>
        {CATEGORIES.map((cat, i) => (
          <motion.button
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onStart(cat)}
            className="fg-mode-card text-center"
            style={{ padding: '24px 14px' }}
          >
            <div
              className="fg-display"
              style={{
                fontSize: '2.4rem',
                lineHeight: 1,
                marginBottom: 8,
                padding: 0,
              }}
            >
              {CATEGORY_ICONS[cat] ?? '?'}
            </div>
            <div
              className="text-white"
              style={{ fontWeight: 700, fontSize: '0.95rem' }}
            >
              {cat}
            </div>
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
      <div className="fg-lbl mb-1.5 text-[10px]">{label}</div>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(Math.max(min, Math.min(max, +e.target.value || min)))
        }
        className="fg-inp text-center"
        style={{ padding: '10px 12px', fontSize: '0.9rem' }}
      />
    </label>
  )
}
