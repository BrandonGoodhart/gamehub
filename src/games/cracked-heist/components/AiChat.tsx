import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Question } from '../types'

const MIN_COUNT = 4
const MAX_COUNT = 40

interface Props {
  onDone: (topic: string, questions: Question[]) => void
}

type Step = 'askTopic' | 'askCount' | 'askDifficulty' | 'generating' | 'success' | 'error'
export type Difficulty = 'easy' | 'medium' | 'hard'

interface Bubble {
  id: number
  who: 'bot' | 'me'
  text: string
}

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: 'askTopic', label: '1. Topic' },
  { key: 'askCount', label: '2. How many' },
  { key: 'askDifficulty', label: '3. Difficulty' },
  { key: 'generating', label: '4. Writing' },
  { key: 'success', label: '5. Edit' },
]

const DIFFICULTY_OPTIONS: { key: Difficulty; label: string; desc: string }[] = [
  { key: 'easy', label: 'Easy', desc: 'Anyone can get most of them.' },
  { key: 'medium', label: 'Medium', desc: 'Mix of warm-up and tougher.' },
  { key: 'hard', label: 'Hard', desc: 'Stretch the best students.' },
]

export default function AiChat({ onDone }: Props) {
  const [bubbles, setBubbles] = useState<Bubble[]>([
    {
      id: 0,
      who: 'bot',
      text: "Hi! I'll write the trivia questions for you. First — what topic should they be about?",
    },
  ])
  const [step, setStep] = useState<Step>('askTopic')
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(10)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [generated, setGenerated] = useState<Question[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const nextId = useRef(1)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })
  }, [bubbles, step])

  useEffect(() => {
    if (step === 'askTopic') {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [step])

  function addBubble(who: 'bot' | 'me', text: string) {
    setBubbles((prev) => [...prev, { id: nextId.current++, who, text }])
  }

  function submitTopic() {
    const t = topic.trim()
    if (!t) return
    addBubble('me', t)
    setTimeout(() => {
      addBubble('bot', `Got it — "${t}". How many questions do you want? (4 to 40)`)
      setStep('askCount')
    }, 350)
  }

  function submitCount() {
    addBubble('me', `${count} please.`)
    setTimeout(() => {
      addBubble(
        'bot',
        'How tough should they be? Easy is warm-up level, hard stretches the strongest student.',
      )
      setStep('askDifficulty')
    }, 350)
  }

  function submitDifficulty(d: Difficulty) {
    setDifficulty(d)
    const label = DIFFICULTY_OPTIONS.find((o) => o.key === d)?.label ?? d
    addBubble('me', `${label}.`)
    setTimeout(() => {
      addBubble('bot', `Writing ${count} ${label.toLowerCase()} questions about "${topic}" — give me a few seconds…`)
      setStep('generating')
      generate(d)
    }, 350)
  }

  async function generate(d: Difficulty = difficulty) {
    try {
      const resp = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: topic.trim(), count, difficulty: d }),
      })
      const text = await resp.text()
      let data: { questions?: Question[]; error?: string } = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        // non-JSON
      }
      if (!resp.ok) {
        const msg =
          resp.status === 404
            ? "I can't reach the AI server. The Netlify function isn't deployed yet."
            : data.error ?? `Something went wrong (error ${resp.status}).`
        setErrorMsg(msg)
        addBubble('bot', `Hmm — ${msg}`)
        setStep('error')
        return
      }
      const qs = data.questions ?? []
      if (qs.length === 0) {
        setErrorMsg('No questions came back. Try a different topic.')
        addBubble('bot', 'I came up empty on that. Try a different topic?')
        setStep('error')
        return
      }
      setGenerated(qs)
      addBubble(
        'bot',
        `Done! I wrote ${qs.length} questions. Tap continue and you'll go to the editor — you can change anything you don't like before starting the game.`,
      )
      setStep('success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      setErrorMsg(msg)
      addBubble('bot', `Couldn't reach the AI server: ${msg}`)
      setStep('error')
    }
  }

  function retry() {
    setErrorMsg(null)
    addBubble('bot', `Let's try again. Same topic and count, or pick new ones below.`)
    setStep('askCount')
  }

  function startOver() {
    setBubbles([
      { id: nextId.current++, who: 'bot', text: 'No problem — give me a new topic.' },
    ])
    setTopic('')
    setErrorMsg(null)
    setStep('askTopic')
  }

  return (
    <div
      className="rounded-2xl mt-4 overflow-hidden"
      style={{
        background: 'rgba(0,0,0,0.45)',
        border: '1.5px solid rgba(74,222,128,0.25)',
      }}
    >
      {/* Step indicator */}
      <div
        className="px-3 py-2.5 flex items-center justify-between text-left"
        style={{
          background: 'rgba(74,222,128,0.08)',
          borderBottom: '1px solid rgba(74,222,128,0.18)',
        }}
      >
        {STEP_LABELS.map((s) => {
          const active = s.key === step || (step === 'error' && s.key === 'generating')
          const done =
            STEP_LABELS.findIndex((x) => x.key === s.key) <
            STEP_LABELS.findIndex((x) => x.key === step)
          return (
            <div
              key={s.key}
              className="text-[10px] font-extrabold uppercase tracking-wider"
              style={{
                color: active ? '#fbbf24' : done ? '#86efac' : 'rgba(255,255,255,0.35)',
              }}
            >
              {s.label}
            </div>
          )
        })}
      </div>

      {/* Bubbles */}
      <div
        ref={scrollRef}
        className="space-y-2.5 px-3 py-4"
        style={{ maxHeight: 320, overflowY: 'auto' }}
      >
        <AnimatePresence initial={false}>
          {bubbles.map((b) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22 }}
              className={`flex ${b.who === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="rounded-2xl px-3.5 py-2.5 leading-snug text-left"
                style={{
                  maxWidth: '88%',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  background:
                    b.who === 'bot'
                      ? 'rgba(74,222,128,0.14)'
                      : 'rgba(94,234,212,0.18)',
                  border:
                    b.who === 'bot'
                      ? '1px solid rgba(74,222,128,0.3)'
                      : '1px solid rgba(94,234,212,0.4)',
                  color: b.who === 'bot' ? '#bbf7d0' : '#cffafe',
                }}
              >
                {b.text}
              </div>
            </motion.div>
          ))}

          {step === 'generating' && (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div
                className="rounded-2xl px-4 py-3"
                style={{
                  background: 'rgba(74,222,128,0.14)',
                  border: '1px solid rgba(74,222,128,0.3)',
                }}
              >
                <Typing />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input area */}
      <div
        className="px-3 py-3"
        style={{
          background: 'rgba(0,0,0,0.55)',
          borderTop: '1px solid rgba(74,222,128,0.18)',
        }}
      >
        {step === 'askTopic' && (
          <>
            <div className="fg-lbl mb-2 text-left">your topic</div>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitTopic()
                }}
                placeholder="Type here — e.g. ocean animals"
                className="flex-1 rounded-xl"
                style={{
                  padding: '14px 16px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.08)',
                  border: '2px solid rgba(74,222,128,0.35)',
                  color: '#ffffff',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={submitTopic}
                disabled={!topic.trim()}
                className="fg-btn fg-btn-grad"
                style={{
                  padding: '14px 18px',
                  fontSize: '1rem',
                  opacity: topic.trim() ? 1 : 0.4,
                  cursor: topic.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Send →
              </button>
            </div>
            <p className="fg-sub text-[11px] mt-2 text-left">
              Tip: be specific. "Ancient Egypt" works better than "history".
            </p>
          </>
        )}

        {step === 'askCount' && (
          <>
            <div className="fg-lbl mb-2 text-left">how many questions</div>
            <div
              className="flex items-stretch rounded-2xl mb-3 overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '2px solid rgba(74,222,128,0.35)',
              }}
            >
              <button
                aria-label="decrease"
                onClick={() => setCount((n) => Math.max(MIN_COUNT, n - 1))}
                disabled={count <= MIN_COUNT}
                style={{
                  width: 64,
                  fontSize: '2rem',
                  fontWeight: 900,
                  background: count <= MIN_COUNT ? 'rgba(255,255,255,0.02)' : 'rgba(74,222,128,0.18)',
                  color: count <= MIN_COUNT ? 'rgba(255,255,255,0.2)' : '#4ade80',
                  border: 'none',
                  cursor: count <= MIN_COUNT ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                −
              </button>
              <div
                className="flex-1 flex items-center justify-center tabular-nums"
                style={{
                  color: '#ffffff',
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  padding: '14px 0',
                }}
              >
                {count}
              </div>
              <button
                aria-label="increase"
                onClick={() => setCount((n) => Math.min(MAX_COUNT, n + 1))}
                disabled={count >= MAX_COUNT}
                style={{
                  width: 64,
                  fontSize: '2rem',
                  fontWeight: 900,
                  background: count >= MAX_COUNT ? 'rgba(255,255,255,0.02)' : 'rgba(74,222,128,0.18)',
                  color: count >= MAX_COUNT ? 'rgba(255,255,255,0.2)' : '#4ade80',
                  border: 'none',
                  cursor: count >= MAX_COUNT ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                +
              </button>
            </div>
            <button
              onClick={submitCount}
              className="fg-btn fg-btn-grad w-full"
              style={{ padding: '14px 16px', fontSize: '1rem' }}
            >
              Make {count} questions →
            </button>
            <p className="fg-sub text-[11px] mt-2 text-left">
              Minimum 4, max 40. More questions take longer (usually under 15 seconds).
            </p>
          </>
        )}

        {step === 'askDifficulty' && (
          <>
            <div className="fg-lbl mb-2 text-left">pick the difficulty</div>
            <div className="grid grid-cols-1 gap-2">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => submitDifficulty(opt.key)}
                  className="rounded-xl text-left"
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.04)',
                    border: '2px solid rgba(74,222,128,0.18)',
                    color: '#fff',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  <div className="font-extrabold text-sm" style={{ color: '#86efac' }}>
                    {opt.label}
                  </div>
                  <div className="fg-sub text-[11px] mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
            <p className="fg-sub text-[11px] mt-2 text-left">
              Tap one to start writing.
            </p>
          </>
        )}

        {step === 'generating' && (
          <div className="fg-sub text-sm text-center py-2">
            writing your questions…
          </div>
        )}

        {step === 'success' && (
          <button
            onClick={() => onDone(topic.trim(), generated)}
            className="fg-btn fg-btn-grad w-full"
            style={{ padding: '16px 16px', fontSize: '1.05rem' }}
          >
            Continue to editor →
          </button>
        )}

        {step === 'error' && (
          <div className="space-y-2">
            {errorMsg && (
              <div
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-left"
                style={{
                  background: 'rgba(251,113,133,0.12)',
                  border: '1px solid rgba(251,113,133,0.35)',
                  color: '#fda4af',
                }}
              >
                {errorMsg}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={retry}
                className="fg-btn fg-btn-grad flex-1"
                style={{ padding: '12px 16px', fontSize: '0.95rem' }}
              >
                Try again
              </button>
              <button
                onClick={startOver}
                className="fg-btn flex-1"
                style={{
                  padding: '12px 16px',
                  fontSize: '0.95rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.18)',
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                New topic
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Typing() {
  return (
    <div className="flex gap-2 items-center" aria-label="typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.14 }}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#86efac',
            display: 'inline-block',
          }}
        />
      ))}
    </div>
  )
}
