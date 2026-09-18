import { motion } from 'framer-motion'
import type { RoomState } from '../types'

interface Props {
  state: RoomState
  onPlay: () => void
}

export default function PregameSplash({ state, onPlay }: Props) {
  const questionCount = state.customQuestions ? state.customQuestions.length : '30+'
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="fg-lbl mb-3">ready when you are</div>
        <h1
          className="fg-display mb-3"
          style={{ fontSize: 'clamp(3rem, 12vw, 6rem)', padding: '0 12px' }}
        >
          {state.category ?? 'Custom'}
        </h1>
        <div className="flex items-center justify-center gap-5 fg-sub text-sm font-bold mt-2 mb-1">
          <span>
            <span className="text-[var(--green-l)]">{Math.round(state.settings.roundSeconds / 60)} min</span> total
          </span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span>
            <span className="text-[var(--green-l)]">{questionCount}</span> questions
          </span>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', damping: 14 }}
        whileHover={{ scale: 1.03, y: -3 }}
        whileTap={{ scale: 0.96 }}
        onClick={onPlay}
        className="fg-play-btn mt-12"
      >
        Play
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="fg-sub text-xs mt-6"
      >
        Tap Play to start the 3-2-1 countdown.
      </motion.p>
    </div>
  )
}
