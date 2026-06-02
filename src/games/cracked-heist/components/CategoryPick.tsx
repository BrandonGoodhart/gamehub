import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Question, Settings } from '../types'
import NumberSpinner from './NumberSpinner'

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
  const [aiTopic, setAiTopic] = useState('')
  const [aiCount, setAiCount] = useState(10)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  async function generate() {
    const topic = aiTopic.trim()
    if (!topic) {
      setAiError('Type a topic first.')
      return
    }
    setAiBusy(true)
    setAiError(null)
    try {
      const resp = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: topic, count: aiCount }),
      })
      const text = await resp.text()
      let data: { questions?: Question[]; error?: string } = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        // non-JSON response (usually a 404 HTML page when the function isn't deployed)
      }
      if (!resp.ok) {
        if (resp.status === 404) {
          setAiError(
            "AI server isn't connected yet. The Netlify function needs to be deployed and ANTHROPIC_API_KEY set.",
          )
        } else {
          setAiError(data.error ?? `Generation failed (${resp.status}).`)
        }
        return
      }
      const qs: Question[] = data.questions ?? []
      if (qs.length === 0) {
        setAiError('No questions returned. Try a different topic.')
        return
      }
      onAiGenerated(topic, qs)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      setAiError(`Couldn't reach the AI server: ${msg}`)
    } finally {
      setAiBusy(false)
    }
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
              onClick={() => {
                setAiOpen((o) => !o)
                setAiError(null)
              }}
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
              {aiOpen
                ? 'Tell the AI a topic. You can edit what it gives you.'
                : 'Tap to open the chat.'}
            </div>

            {aiOpen && (
              <div className="mt-4 space-y-3 text-left">
                <div>
                  <div className="fg-lbl mb-1.5">topic</div>
                  <input
                    value={aiTopic}
                    onChange={(e) => {
                      setAiTopic(e.target.value)
                      setAiError(null)
                    }}
                    placeholder="e.g. world capitals, ocean animals, ancient Egypt"
                    className="fg-inp"
                    style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                    disabled={aiBusy}
                  />
                </div>
                <div>
                  <div className="fg-lbl mb-1.5">how many questions</div>
                  <NumberSpinner
                    value={aiCount}
                    min={4}
                    max={40}
                    step={1}
                    onChange={setAiCount}
                  />
                </div>
                {aiError && (
                  <div
                    className="rounded-xl px-3 py-2 text-xs font-semibold"
                    style={{
                      background: 'rgba(251,113,133,0.1)',
                      border: '1px solid rgba(251,113,133,0.3)',
                      color: '#fda4af',
                    }}
                  >
                    {aiError}
                  </div>
                )}
                <button
                  onClick={generate}
                  disabled={aiBusy}
                  className="fg-btn fg-btn-grad"
                  style={{ width: '100%', opacity: aiBusy ? 0.6 : 1 }}
                >
                  {aiBusy ? 'Generating...' : 'Generate Questions →'}
                </button>
                <p className="fg-sub text-[11px] italic">
                  AI questions land in the editor — you can change them before
                  starting the game.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
