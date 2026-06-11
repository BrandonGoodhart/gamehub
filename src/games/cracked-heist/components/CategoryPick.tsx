import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Question, Settings } from '../types'
import AiChat from './AiChat'

const QUICK_PICKS = [2, 7, 12] as const
const STEPPER_MIN = 5
const STEPPER_STEP = 5

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

  const currentMin = Math.round(settings.roundSeconds / 60)
  // Stepper has its own value so jumping to a chip doesn't lose your place
  const [stepperMin, setStepperMin] = useState(() =>
    (QUICK_PICKS as readonly number[]).includes(currentMin)
      ? STEPPER_MIN
      : Math.max(STEPPER_MIN, currentMin),
  )

  function setStepper(nextStepperMin: number) {
    const clamped = Math.max(STEPPER_MIN, nextStepperMin)
    setStepperMin(clamped)
    onChange({ roundSeconds: clamped * 60 })
  }

  function pickQuick(mins: number) {
    onChange({ roundSeconds: mins * 60 })
  }

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
        <div className="fg-lbl mb-2 text-center">game length</div>

        {/* Current total at the top */}
        <div className="text-center mb-3">
          <span
            className="font-extrabold tabular-nums"
            style={{
              color: '#ffffff',
              fontSize: '2.4rem',
              lineHeight: 1,
            }}
          >
            {currentMin}
          </span>
          <span className="fg-sub ml-2" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
            min
          </span>
        </div>

        {/* Stepper: multiples of 5, default 5 */}
        <div
          className="flex items-stretch rounded-2xl overflow-hidden mb-3"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '2px solid rgba(74,222,128,0.35)',
          }}
        >
          <button
            aria-label="decrease"
            onClick={() => setStepper(stepperMin - STEPPER_STEP)}
            disabled={stepperMin <= STEPPER_MIN}
            style={{
              width: 64,
              fontSize: '1.6rem',
              fontWeight: 900,
              background:
                stepperMin <= STEPPER_MIN
                  ? 'rgba(255,255,255,0.02)'
                  : 'rgba(74,222,128,0.18)',
              color:
                stepperMin <= STEPPER_MIN ? 'rgba(255,255,255,0.2)' : '#4ade80',
              border: 'none',
              cursor: stepperMin <= STEPPER_MIN ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            −
          </button>
          <button
            onClick={() => setStepper(stepperMin)}
            className="flex-1 tabular-nums"
            style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              background:
                currentMin === stepperMin
                  ? 'rgba(74,222,128,0.18)'
                  : 'transparent',
              color: currentMin === stepperMin ? '#86efac' : '#d1d5db',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: '14px 0',
            }}
          >
            {stepperMin} min
          </button>
          <button
            aria-label="increase"
            onClick={() => setStepper(stepperMin + STEPPER_STEP)}
            style={{
              width: 64,
              fontSize: '1.6rem',
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

        {/* Quick-pick chips */}
        <div className="grid grid-cols-3 gap-2">
          {QUICK_PICKS.map((mins) => {
            const active = currentMin === mins
            return (
              <button
                key={mins}
                onClick={() => pickQuick(mins)}
                className="rounded-xl font-extrabold tabular-nums"
                style={{
                  padding: '12px 0',
                  fontSize: '0.95rem',
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
                {mins} min
              </button>
            )
          })}
        </div>

        <p className="fg-sub text-[11px] mt-3 text-center">
          Stepper goes 5, 10, 15, 20… Quick picks are 2, 7, or 12.
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
