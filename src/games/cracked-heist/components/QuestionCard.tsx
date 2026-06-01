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
          const isCorrect = picked !== null && i === question.answer
          const isWrong = isPicked && i !== question.answer
          return (
            <button
              key={i}
              onClick={() => handle(i)}
              disabled={picked !== null}
              className={`fg-answer ${COLORS[i]} ${isCorrect ? 'fg-answer-correct' : ''} ${
                picked !== null && !isPicked && !isCorrect ? 'fg-answer-wrong' : ''
              } ${isWrong ? 'fg-answer-wrong' : ''}`}
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
