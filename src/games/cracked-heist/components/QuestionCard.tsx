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
    <div className="space-y-4">
      <div className="font-mono text-emerald-200 text-lg md:text-xl border-l-4 border-emerald-500 pl-4 py-2 bg-emerald-950/30">
        <span className="text-emerald-500">?&gt;</span> {question.q}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {question.choices.map((c, i) => {
          const isPicked = picked === i
          const isCorrect = picked !== null && i === question.answer
          const isWrong = isPicked && i !== question.answer
          return (
            <motion.button
              key={i}
              whileHover={picked === null ? { scale: 1.02 } : {}}
              whileTap={{ scale: 0.97 }}
              onClick={() => handle(i)}
              disabled={picked !== null}
              className={`text-left px-4 py-3 rounded border font-mono text-sm md:text-base transition-all ${
                isWrong
                  ? 'border-red-500 bg-red-900/30 text-red-300'
                  : isCorrect
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200 shadow-[0_0_20px_rgba(50,220,120,0.5)]'
                    : picked !== null && !isPicked
                      ? 'border-emerald-900/40 bg-black/30 text-emerald-500/40'
                      : 'border-emerald-700 bg-black/50 text-emerald-200 hover:bg-emerald-900/30 hover:border-emerald-400 cursor-pointer'
              }`}
            >
              <span className="text-emerald-500 mr-2">{String.fromCharCode(65 + i)}.</span>
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
      <div className="text-emerald-500 font-mono text-sm animate-pulse">
        &gt; loading_signal...
      </div>
    )
  }
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.q}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
      >
        <QuestionInner key={question.q} question={question} onAnswer={onAnswer} />
      </motion.div>
    </AnimatePresence>
  )
}
