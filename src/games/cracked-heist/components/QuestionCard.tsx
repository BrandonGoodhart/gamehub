import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { Question } from '../types'

interface Props {
  question: Question | null
  onAnswer: (choice: number) => void
}

function QuestionInner({ question, onAnswer }: { question: Question; onAnswer: (i: number) => void }) {
  const [picked, setPicked] = useState<number | null>(null)

  function handle(i: number) {
    if (picked !== null) return
    setPicked(i)
    setTimeout(() => onAnswer(i), 450)
  }

  return (
    <div className="space-y-5">
      <div className="text-lg md:text-2xl font-extrabold tracking-tight leading-snug text-white">
        {question.q}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {question.choices.map((c, i) => {
          const isPicked = picked === i
          const isCorrect = picked !== null && i === question.answer
          const isWrong = isPicked && i !== question.answer
          return (
            <motion.button
              key={i}
              whileHover={picked === null ? { y: -2, scale: 1.01 } : {}}
              whileTap={{ scale: 0.97 }}
              onClick={() => handle(i)}
              disabled={picked !== null}
              className="text-left px-4 py-3 rounded-2xl border font-bold text-sm md:text-base transition-all"
              style={
                isWrong
                  ? {
                      borderColor: 'rgba(251,113,133,0.5)',
                      background: 'rgba(251,113,133,0.12)',
                      color: '#fda4af',
                    }
                  : isCorrect
                    ? {
                        borderColor: 'rgba(74,222,128,0.6)',
                        background: 'rgba(74,222,128,0.18)',
                        color: '#bbf7d0',
                        boxShadow: '0 0 24px rgba(74,222,128,0.4)',
                      }
                    : picked !== null && !isPicked
                      ? {
                          borderColor: 'rgba(255,255,255,0.06)',
                          background: 'rgba(255,255,255,0.02)',
                          color: 'rgba(255,255,255,0.3)',
                        }
                      : {
                          borderColor: 'rgba(74,222,128,0.18)',
                          background: 'rgba(255,255,255,0.03)',
                          color: '#f0fdf4',
                          backdropFilter: 'blur(10px)',
                        }
              }
            >
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold mr-3"
                    style={{
                      background: 'rgba(74,222,128,0.12)',
                      color: '#86efac',
                    }}>
                {String.fromCharCode(65 + i)}
              </span>
              {c}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export default function QuestionCard({ question, onAnswer }: Props) {
  if (!question) {
    return (
      <div className="fg-sub text-sm animate-pulse">loading next question…</div>
    )
  }
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.q}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.25 }}
      >
        <QuestionInner key={question.q} question={question} onAnswer={onAnswer} />
      </motion.div>
    </AnimatePresence>
  )
}
