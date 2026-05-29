import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Question } from '../types'

interface Props {
  onSubmit: (questions: Question[]) => void
  onBack: () => void
}

interface Draft {
  q: string
  choices: [string, string, string, string]
  answer: number
}

function emptyDraft(): Draft {
  return { q: '', choices: ['', '', '', ''], answer: 0 }
}

function isValid(d: Draft): boolean {
  return d.q.trim().length > 0 && d.choices.every((c) => c.trim().length > 0)
}

export default function CustomQuestions({ onSubmit, onBack }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>([
    emptyDraft(),
    emptyDraft(),
    emptyDraft(),
    emptyDraft(),
  ])
  const [error, setError] = useState('')

  function update(i: number, patch: Partial<Draft>) {
    setError('')
    setDrafts((arr) => arr.map((d, idx) => (idx === i ? { ...d, ...patch } : d)))
  }

  function updateChoice(i: number, ci: number, val: string) {
    update(i, {
      choices: drafts[i].choices.map((c, idx) => (idx === ci ? val : c)) as Draft['choices'],
    })
  }

  function add() {
    setDrafts((arr) => [...arr, emptyDraft()])
  }

  function remove(i: number) {
    if (drafts.length <= 4) {
      setError('Minimum 4 questions.')
      return
    }
    setDrafts((arr) => arr.filter((_, idx) => idx !== i))
  }

  function submit() {
    if (drafts.length < 4) {
      setError('Minimum 4 questions.')
      return
    }
    const bad = drafts.findIndex((d) => !isValid(d))
    if (bad >= 0) {
      setError(`Question ${bad + 1} is incomplete. Fill in the question and all 4 choices.`)
      return
    }
    onSubmit(
      drafts.map((d) => ({
        q: d.q.trim(),
        choices: d.choices.map((c) => c.trim()),
        answer: d.answer,
      })),
    )
  }

  return (
    <div className="max-w-[640px] mx-auto w-full space-y-5 pb-5">
      <div className="flex">
        <button onClick={onBack} className="fg-back">
          ← Back
        </button>
      </div>

      <div className="text-center">
        <h1
          className="fg-display"
          style={{ fontSize: 'clamp(1.8rem, 6vw, 2.6rem)', padding: '0 8px' }}
        >
          Custom Questions
        </h1>
        <p className="fg-sub text-xs mt-1">
          Minimum 4. No maximum. Tap the correct choice to mark it.
        </p>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {drafts.map((d, i) => (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fg-panel p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="fg-lbl">question {i + 1}</div>
                <button
                  onClick={() => remove(i)}
                  disabled={drafts.length <= 4}
                  className="text-xs font-extrabold rounded-lg px-2 py-1"
                  style={{
                    background: drafts.length <= 4 ? 'rgba(255,255,255,0.04)' : 'rgba(251,113,133,0.12)',
                    color: drafts.length <= 4 ? 'rgba(255,255,255,0.3)' : '#fda4af',
                    border: '1px solid rgba(251,113,133,0.2)',
                    cursor: drafts.length <= 4 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
              <input
                value={d.q}
                onChange={(e) => update(i, { q: e.target.value })}
                placeholder="Type your question..."
                className="fg-inp mb-2"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {d.choices.map((c, ci) => {
                  const correct = d.answer === ci
                  return (
                    <div
                      key={ci}
                      className="flex items-center gap-2 rounded-2xl pl-2 pr-2"
                      style={{
                        background: correct ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.03)',
                        border: correct
                          ? '1.5px solid rgba(74,222,128,0.5)'
                          : '1.5px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <button
                        onClick={() => update(i, { answer: ci })}
                        title="mark correct"
                        className="w-7 h-7 rounded-full font-extrabold text-xs flex-shrink-0 flex items-center justify-center transition-colors"
                        style={{
                          background: correct
                            ? 'linear-gradient(135deg,#22c55e,#4ade80)'
                            : 'rgba(255,255,255,0.06)',
                          color: correct ? '#052e16' : 'rgba(255,255,255,0.6)',
                        }}
                      >
                        {String.fromCharCode(65 + ci)}
                      </button>
                      <input
                        value={c}
                        onChange={(e) => updateChoice(i, ci, e.target.value)}
                        placeholder={`Choice ${String.fromCharCode(65 + ci)}`}
                        className="bg-transparent border-0 outline-none text-white py-2 px-1 text-sm font-medium flex-1 min-w-0"
                      />
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button onClick={add} className="fg-btn fg-btn-outline">
        + Add another question
      </button>

      {error && (
        <div
          className="text-center font-bold text-sm rounded-xl p-3"
          style={{
            background: 'rgba(251,113,133,0.1)',
            border: '1px solid rgba(251,113,133,0.3)',
            color: '#fda4af',
          }}
        >
          {error}
        </div>
      )}

      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={submit}
        className="fg-btn fg-btn-grad"
      >
        Use These Questions ({drafts.length}) →
      </motion.button>
    </div>
  )
}
