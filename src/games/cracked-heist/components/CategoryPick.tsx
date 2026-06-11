import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Question, Settings } from '../types'
import AiChat from './AiChat'

const MIN_MIN = 2
const STEP_MIN = 5

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
        <div
          className="flex items-stretch rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '2px solid rgba(74,222,128,0.35)',
          }}
        >
          <button
            aria-label="decrease"
            onClick={() => {
              const curMin = Math.max(MIN_MIN, Math.round(settings.roundSeconds / 60))
              const nextMin = Math.max(MIN_MIN, curMin - STEP_MIN)
              onChange({ roundSeconds: nextMin * 60 })
            }}
            disabled={Math.round(settings.roundSeconds / 60) <= MIN_MIN}
            style={{
              width: 72,
              fontSize: '2rem',
              fontWeight: 900,
              background:
                Math.round(settings.roundSeconds / 60) <= MIN_MIN
                  ? 'rgba(255,255,255,0.02)'
                  : 'rgba(74,222,128,0.18)',
              color:
                Math.round(settings.roundSeconds / 60) <= MIN_MIN
                  ? 'rgba(255,255,255,0.2)'
                  : '#4ade80',
              border: 'none',
              cursor:
                Math.round(settings.roundSeconds / 60) <= MIN_MIN
                  ? 'not-allowed'
                  : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            −
          </button>
          <div
            className="flex-1 flex flex-col items-center justify-center tabular-nums"
            style={{ padding: '14px 0' }}
          >
            <div
              style={{
                color: '#ffffff',
                fontSize: '2rem',
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {Math.round(settings.roundSeconds / 60)}
            </div>
            <div className="fg-sub text-[11px] mt-1">minutes</div>
          </div>
          <button
            aria-label="increase"
            onClick={() => {
              const curMin = Math.max(MIN_MIN, Math.round(settings.roundSeconds / 60))
              onChange({ roundSeconds: (curMin + STEP_MIN) * 60 })
            }}
            style={{
              width: 72,
              fontSize: '2rem',
              fontWeight: 900,
              background: 'rgba(74,222,128,0.18)',
              color: '#4ade80',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            +
          </button>
        </div>
        <p className="fg-sub text-[11px] mt-3 text-center">
          Starts at 7 minutes. ± 5 minutes each tap. Minimum 2.
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
