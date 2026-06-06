import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Question, Settings } from '../types'
import NumberSpinner from './NumberSpinner'
import AiChat from './AiChat'

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
        <div className="fg-lbl mb-2 text-center">game length (seconds)</div>
        <NumberSpinner
          value={settings.roundSeconds}
          min={60}
          max={600}
          step={5}
          onChange={(v) => onChange({ roundSeconds: v })}
        />
        <p className="fg-sub text-[11px] mt-3 text-center">
          One round per game. Minimum 60 seconds. Everyone starts at 0 coins and 0 tokens.
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

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="fg-mode-card text-center w-full"
            style={{ padding: '22px 16px', cursor: 'default' }}
          >
            <div className="fg-lbl mb-2">ai assistant</div>
            <button
              onClick={() => setAiOpen((o) => !o)}
              className="text-white text-center"
              style={{
                fontWeight: 800,
                fontSize: '1.1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Ask AI to make questions
            </button>
            <div className="fg-sub mt-1" style={{ fontSize: '0.78rem' }}>
              {aiOpen ? 'Chat with the AI to make a set.' : 'Tap to open the chat.'}
            </div>

            {aiOpen && (
              <AiChat
                onDone={(topic, qs) => {
                  setAiOpen(false)
                  onAiGenerated(topic, qs)
                }}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
