import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Question } from '../types'
import NumberSpinner from './NumberSpinner'

interface Props {
  onDone: (topic: string, questions: Question[]) => void
}

type Step = 'askTopic' | 'askCount' | 'generating' | 'success' | 'error'

interface Bubble {
  id: number
  who: 'bot' | 'me'
  text: string
}

export default function AiChat({ onDone }: Props) {
  const [bubbles, setBubbles] = useState<Bubble[]>([
    { id: 0, who: 'bot', text: "Hey — I'll write the questions for you. What topic should they be about?" },
  ])
  const [step, setStep] = useState<Step>('askTopic')
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(10)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [generated, setGenerated] = useState<Question[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9999, behavior: 'smooth' })
  }, [bubbles])

  function addBubble(who: 'bot' | 'me', text: string) {
    setBubbles((prev) => [...prev, { id: nextId.current++, who, text }])
  }

  function submitTopic() {
    const t = topic.trim()
    if (!t) return
    addBubble('me', t)
    setTimeout(() => {
      addBubble('bot', `Cool — "${t}". How many questions? Minimum is 4, max is 40.`)
      setStep('askCount')
    }, 300)
  }

  function submitCount() {
    addBubble('me', `${count} questions, please.`)
    setTimeout(() => {
      addBubble('bot', `On it. Writing ${count} questions about "${topic}"…`)
      setStep('generating')
      generate()
    }, 300)
  }

  async function generate() {
    try {
      const resp = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: topic.trim(), count }),
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
        `Done — ${qs.length} questions ready. Tap continue to look them over (you can edit any of them).`,
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
    addBubble('bot', `Want me to try again? Hit retry or change the topic.`)
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
      className="rounded-2xl p-3 mt-4"
      style={{
        background: 'rgba(0,0,0,0.35)',
        border: '1.5px solid rgba(74,222,128,0.18)',
      }}
    >
      <div
        ref={scrollRef}
        className="space-y-2"
        style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}
      >
        <AnimatePresence initial={false}>
          {bubbles.map((b) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className={`flex ${b.who === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="rounded-2xl px-3 py-2 text-sm font-semibold leading-snug"
                style={{
                  maxWidth: '85%',
                  background:
                    b.who === 'bot'
                      ? 'rgba(74,222,128,0.10)'
                      : 'rgba(94,234,212,0.15)',
                  border:
                    b.who === 'bot'
                      ? '1px solid rgba(74,222,128,0.25)'
                      : '1px solid rgba(94,234,212,0.35)',
                  color: b.who === 'bot' ? '#86efac' : '#a5f3fc',
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
                className="rounded-2xl px-3 py-2"
                style={{
                  background: 'rgba(74,222,128,0.10)',
                  border: '1px solid rgba(74,222,128,0.25)',
                }}
              >
                <Typing />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input area changes by step */}
      <div className="mt-3">
        {step === 'askTopic' && (
          <div className="flex gap-2">
            <input
              autoFocus
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitTopic()
              }}
              placeholder="e.g. world capitals, ocean animals"
              className="fg-inp flex-1"
              style={{ padding: '10px 14px', fontSize: '0.95rem' }}
            />
            <button
              onClick={submitTopic}
              disabled={!topic.trim()}
              className="fg-btn fg-btn-grad"
              style={{ padding: '10px 16px', opacity: topic.trim() ? 1 : 0.5 }}
            >
              Send →
            </button>
          </div>
        )}

        {step === 'askCount' && (
          <div className="space-y-3">
            <NumberSpinner value={count} min={4} max={40} step={1} onChange={setCount} />
            <button
              onClick={submitCount}
              className="fg-btn fg-btn-grad w-full"
              style={{ padding: '10px 16px' }}
            >
              Make {count} questions →
            </button>
          </div>
        )}

        {step === 'generating' && (
          <div className="fg-sub text-xs text-center">writing your questions…</div>
        )}

        {step === 'success' && (
          <button
            onClick={() => onDone(topic.trim(), generated)}
            className="fg-btn fg-btn-grad w-full"
            style={{ padding: '12px 16px' }}
          >
            Continue to editor →
          </button>
        )}

        {step === 'error' && (
          <div className="space-y-2">
            {errorMsg && (
              <div
                className="rounded-xl px-3 py-2 text-xs font-semibold"
                style={{
                  background: 'rgba(251,113,133,0.1)',
                  border: '1px solid rgba(251,113,133,0.3)',
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
                style={{ padding: '10px 16px' }}
              >
                Try again
              </button>
              <button
                onClick={startOver}
                className="fg-btn flex-1"
                style={{
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.85)',
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
    <div className="flex gap-1.5 items-center" aria-label="typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#86efac',
            display: 'inline-block',
          }}
        />
      ))}
    </div>
  )
}
