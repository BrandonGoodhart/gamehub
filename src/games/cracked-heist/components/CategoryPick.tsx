import { useState } from 'react'
import { motion } from 'framer-motion'
import { CATEGORIES } from '../questions'
import type { Settings } from '../types'
import NumberSpinner from './NumberSpinner'

interface Props {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onStart: (category: string) => void
  onCustom: () => void
  onBack?: () => void
}

export default function CategoryPick({ settings, onChange, onStart, onCustom, onBack }: Props) {
  const [confirmCat, setConfirmCat] = useState<string | null>(null)
  const [aiOpen, setAiOpen] = useState(false)

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
        <p className="fg-sub text-xs mt-1">choose a category or make your own</p>
      </div>

      <div className="fg-panel p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="fg-lbl mb-2">seconds per round</div>
            <NumberSpinner
              value={settings.roundSeconds}
              min={20}
              max={300}
              step={5}
              onChange={(v) => onChange({ roundSeconds: v })}
            />
          </div>
          <div>
            <div className="fg-lbl mb-2">number of rounds</div>
            <NumberSpinner
              value={settings.totalRounds}
              min={3}
              max={20}
              step={1}
              onChange={(v) => onChange({ totalRounds: v })}
            />
          </div>
        </div>
        <p className="fg-sub text-[11px] mt-3">
          Everyone starts at 0 coins and earns them by answering correctly.
        </p>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.97 }}
        onClick={onCustom}
        className="fg-mode-card text-center w-full"
        style={{ padding: '22px 16px' }}
      >
        <div className="fg-lbl mb-2">custom</div>
        <div className="text-white" style={{ fontWeight: 800, fontSize: '1.1rem' }}>
          Write your own questions
        </div>
        <div className="fg-sub mt-1" style={{ fontSize: '0.78rem' }}>
          Minimum 4 questions, 4 answers each. No maximum.
        </div>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="fg-mode-card text-center w-full"
        style={{ padding: '20px 16px', cursor: 'default' }}
      >
        <div className="fg-lbl mb-2">ai assistant</div>
        <button
          onClick={() => setAiOpen((o) => !o)}
          className="text-white w-full text-center"
          style={{
            fontWeight: 800,
            fontSize: '1.05rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Ask AI to make questions
        </button>
        <div className="fg-sub mt-1" style={{ fontSize: '0.78rem' }}>
          {aiOpen ? 'AI assistant coming soon.' : 'Tap to open chat (coming soon).'}
        </div>
        {aiOpen && (
          <div className="mt-3">
            <input
              disabled
              placeholder="Tell me a category, e.g. 'world capitals'..."
              className="fg-inp"
              style={{ opacity: 0.5, padding: '10px 14px', fontSize: '0.85rem' }}
            />
            <div className="fg-sub text-[11px] mt-2 italic">
              Not connected yet. Will arrive in a future update.
            </div>
          </div>
        )}
      </motion.div>

      <div>
        <div className="fg-lbl text-center mb-3">or pick a category</div>
        <div className="grid grid-cols-2 gap-3">
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
      </div>

      {confirmCat && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setConfirmCat(null)}
          className="fixed inset-0 z-[250] flex items-center justify-center p-4"
          style={{ background: 'rgba(5,14,8,0.8)', backdropFilter: 'blur(12px)' }}
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
