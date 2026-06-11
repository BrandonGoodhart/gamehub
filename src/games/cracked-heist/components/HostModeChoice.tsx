import { motion } from 'framer-motion'

interface Props {
  onPlay: () => void
  onObserve: () => void
  onBack: () => void
}

export default function HostModeChoice({ onPlay, onObserve, onBack }: Props) {
  return (
    <div className="max-w-[440px] mx-auto w-full space-y-5 pb-5">
      <div className="flex">
        <button onClick={onBack} className="fg-back">
          ← Back
        </button>
      </div>

      <div className="text-center">
        <h1
          className="fg-display"
          style={{ fontSize: 'clamp(2rem, 7vw, 3rem)', padding: '0 8px' }}
        >
          Will you play?
        </h1>
        <p className="fg-sub text-xs mt-1">
          Pick how you want to host this round.
        </p>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.97 }}
        onClick={onPlay}
        className="fg-mode-card text-left w-full"
        style={{ padding: '22px 18px' }}
      >
        <div className="fg-lbl mb-2">play</div>
        <div
          className="text-white"
          style={{ fontWeight: 800, fontSize: '1.15rem' }}
        >
          Host and play
        </div>
        <div className="fg-sub mt-1" style={{ fontSize: '0.78rem' }}>
          Run the room and compete with the other players. You'll pick a name,
          color, and password.
        </div>
      </motion.button>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.97 }}
        onClick={onObserve}
        className="fg-mode-card text-left w-full"
        style={{ padding: '22px 18px' }}
      >
        <div className="fg-lbl mb-2">observe</div>
        <div
          className="text-white"
          style={{ fontWeight: 800, fontSize: '1.15rem' }}
        >
          Host and watch
        </div>
        <div className="fg-sub mt-1" style={{ fontSize: '0.78rem' }}>
          Just run the room. You'll see a live leaderboard and what every
          player is doing — but you don't play yourself.
        </div>
      </motion.button>
    </div>
  )
}
