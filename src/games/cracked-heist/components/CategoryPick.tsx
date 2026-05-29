import { useState } from 'react'
import { motion } from 'framer-motion'
import { CATEGORIES } from '../questions'
import type { Settings } from '../types'

interface Props {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onStart: (category: string) => void
  onCustom: () => void
  onBack?: () => void
}

export default function CategoryPick({ settings, onChange, onStart, onCustom, onBack }: Props) {
  const [confirmCat, setConfirmCat] = useState<string | null>(null)

  return (
    <div className="max-w-[440px] mx-auto w-full space-y-5 pb-5">
      {onBack && (
        <div className="flex">
          <button onClick={onBack} className="fg-back">
            ← Back
          </button>
        </div>
      )}

      <div className="text-center">
        <h1
          className="fg-display"
          style={{ fontSize: 'clamp(2rem, 7vw, 3rem)', padding: '0 8px' }}
        >
          Pick Questions
        </h1>
        <p className="fg-sub text-xs mt-1">choose a category or write your own</p>
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

      <div className="grid grid-cols-2 gap-3" style={{ maxWidth: 380, margin: '0 auto' }}>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCustom}
          className="fg-mode-card text-center col-span-2"
          style={{ padding: '20px 16px' }}
        >
          <div className="fg-lbl mb-2">custom</div>
          <div className="text-white" style={{ fontWeight: 800, fontSize: '1.1rem' }}>
            Write your own questions
          </div>
          <div className="fg-sub mt-1" style={{ fontSize: '0.78rem' }}>
            Minimum 4. No maximum.
          </div>
        </motion.button>

        {CATEGORIES.map((cat, i) => (
          <motion.button
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setConfirmCat(cat)}
            className="fg-mode-card text-center"
            style={{ padding: '22px 14px' }}
          >
            <div className="fg-lbl mb-2">category</div>
            <div
              className="text-white"
              style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}
            >
              {cat}
            </div>
          </motion.button>
        ))}
      </div>

      {confirmCat && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setConfirmCat(null)}
          className="fixed inset-0 z-[250] flex items-center justify-center p-4"
          style={{
            background: 'rgba(5,14,8,0.8)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="fg-panel fg-panel-lg max-w-md w-full text-center"
          >
            <div className="fg-lbl mb-1">selected category</div>
            <div className="fg-display text-2xl mb-1">{confirmCat}</div>
            <p className="fg-sub text-xs mb-5">Start the game with this category?</p>
            <div className="flex gap-2.5">
              <button onClick={() => setConfirmCat(null)} className="fg-back flex-1 justify-center">
                Cancel
              </button>
              <button
                onClick={() => onStart(confirmCat)}
                className="fg-btn fg-btn-grad"
                style={{ flex: 1 }}
              >
                Start →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
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
        onChange={(e) => onChange(Math.max(min, Math.min(max, +e.target.value || min)))}
        className="fg-inp text-center"
        style={{ padding: '10px 12px', fontSize: '0.9rem' }}
      />
    </label>
  )
}
