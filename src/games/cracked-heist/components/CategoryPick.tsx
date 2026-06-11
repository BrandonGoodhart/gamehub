import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Question, Settings } from '../types'
import AiChat from './AiChat'

const LENGTH_OPTIONS: { mins: number; label: string }[] = [
  { mins: 2, label: '2 min' },
  { mins: 7, label: '7 min' },
  { mins: 12, label: '12 min' },
]

interface Props {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onCustom: () => void
  onAiGenerated: (category: string, questions: Question[]) => void
  onBack?: () => void
}

export default function CategoryPick({
  settings,
  onChange,
  onCustom,
  onAiGenerated,
  onBack,
}: Props) {
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
          Set Up Round
        </h1>
        <p className="fg-sub text-xs mt-1">questions and round settings</p>
      </div>

      <div className="fg-panel p-5">
        <div className="fg-lbl mb-3 text-center">game length</div>
        <div className="grid grid-cols-3 gap-2">
          {LENGTH_OPTIONS.map(({ mins, label }) => {
            const secs = mins * 60
            const active = settings.roundSeconds === secs
            return (
              <button
                key={mins}
                onClick={() => onChange({ roundSeconds: secs })}
                className="rounded-xl font-extrabold tabular-nums"
                style={{
                  padding: '14px 0',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  background: active
                    ? 'linear-gradient(135deg,#4ade80,#a3e635)'
                    : 'rgba(255,255,255,0.06)',
                  color: active ? '#052e16' : '#d1d5db',
                  border: active
                    ? '2px solid #86efac'
                    : '2px solid rgba(74,222,128,0.18)',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        <p className="fg-sub text-[11px] mt-3 text-center">
          One round per game. Everyone starts at 0 coins and 0 tokens.
        </p>
      </div>

      <div>
        <div className="fg-lbl text-center mb-3">pick how to make questions</div>
        <div className="space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCustom}
            className="fg-mode-card text-center w-full"
            style={{ padding: '22px 16px' }}
          >
            <div className="fg-lbl mb-2">manual</div>
            <div className="text-white" style={{ fontWeight: 800, fontSize: '1.1rem' }}>
              Write your own questions
            </div>
            <div className="fg-sub mt-1" style={{ fontSize: '0.78rem' }}>
              Minimum 4 questions, 4 answers each. No maximum.
            </div>
          </motion.button>

          {!aiOpen ? (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setAiOpen(true)}
              className="fg-mode-card text-center w-full"
              style={{ padding: '22px 16px' }}
            >
              <div className="fg-lbl mb-2">ai assistant</div>
              <div className="text-white" style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                Ask AI to make questions
              </div>
              <div className="fg-sub mt-1" style={{ fontSize: '0.78rem' }}>
                Tap to open the chat.
              </div>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="fg-mode-card text-center w-full"
              style={{ padding: '22px 16px', cursor: 'default' }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="fg-lbl">ai assistant</div>
                <button
                  onClick={() => setAiOpen(false)}
                  className="fg-sub text-xs"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  close
                </button>
              </div>
              <div
                className="text-white text-left"
                style={{ fontWeight: 800, fontSize: '1.05rem' }}
              >
                Ask AI to make questions
              </div>
              <AiChat
                onDone={(topic, qs) => {
                  setAiOpen(false)
                  onAiGenerated(topic, qs)
                }}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
