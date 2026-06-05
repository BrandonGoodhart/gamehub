import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { Question } from '../types'

interface Props {
  question: Question | null
  tick: number
  onAnswer: (choice: number) => void
}

const COLORS = ['fg-answer-orange', 'fg-answer-blue', 'fg-answer-green', 'fg-answer-red']

function QuestionInner({ question, onAnswer }: { question: Question; onAnswer: (i: number) => void }) {
  const [picked, setPicked] = useState<number | null>(null)

  function handle(i: number) {
    if (picked !== null) return
    setPicked(i)
    setTimeout(() => onAnswer(i), 600)
  }

  return (
    <div className="space-y-5">
      <div
        className="text-center font-extrabold tracking-tight text-white"
        style={{ fontSize: 'clamp(1.3rem, 3vw, 2rem)', lineHeight: 1.2 }}
      >
        {question.q}
      </div>
      <div className="fg-answer-grid">
        {question.choices.map((c, i) => {
          const isPicked = picked === i
          const isAnswer = i === question.answer
          const userRight = picked !== null && picked === question.answer
          // Build class list per slot using the new feedback rules
          const slotClass: string[] = ['fg-answer', COLORS[i]]
          if (picked !== null) {
            if (userRight) {
              if (isAnswer) slotClass.push('fg-answer-correct')
              else slotClass.push('fg-answer-others-red')
            } else {
              if (isPicked) slotClass.push('fg-answer-wrong-pick')
              else if (isAnswer) slotClass.push('fg-answer-reveal')
              else slotClass.push('fg-answer-others-orange')
            }
          }
          return (
            <button
              key={i}
              onClick={() => handle(i)}
              disabled={picked !== null}
              className={slotClass.join(' ')}
            >
              {c}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function QuestionCard({ question, tick, onAnswer }: Props) {
  if (!question) {
    return <div className="fg-sub text-sm animate-pulse text-center">loading question…</div>
  }
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tick}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.25 }}
      >
        <QuestionInner key={tick} question={question} onAnswer={onAnswer} />
      </motion.div>
    </AnimatePresence>
  )
}
