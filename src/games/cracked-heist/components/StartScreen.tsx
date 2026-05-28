import { motion } from 'framer-motion'

interface Props {
  onHost: () => void
  onJoin: () => void
}

export default function StartScreen({ onHost, onJoin }: Props) {
  return (
    <div className="max-w-md mx-auto w-full text-center pt-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="fg-lbl mb-3">// class hacking trivia</div>
        <h1 className="fg-display text-[clamp(2.5rem,9vw,4.5rem)]">
          Cracked-Heist
        </h1>
        <p className="fg-sub text-sm mt-3">
          Answer fast. Steal coins. Don't get caught.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 mt-8">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          onClick={onHost}
          className="fg-mode-card text-left p-7"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-extrabold"
                 style={{ background: 'linear-gradient(135deg, #22c55e, #4ade80, #a3e635)', color: '#052e16', boxShadow: '0 6px 20px rgba(74,222,128,.35)' }}>
              H
            </div>
            <div className="flex-1">
              <div className="fg-lbl mb-1">teacher</div>
              <div className="text-xl font-extrabold tracking-tight">Host a game</div>
              <div className="fg-sub text-xs mt-1">Create a room, share the code, pick the category.</div>
            </div>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          onClick={onJoin}
          className="fg-mode-card text-left p-7"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-extrabold"
                 style={{ background: 'linear-gradient(135deg, #34d399, #5eead4)', color: '#042f2e', boxShadow: '0 6px 20px rgba(94,234,212,.35)' }}>
              J
            </div>
            <div className="flex-1">
              <div className="fg-lbl mb-1">student</div>
              <div className="text-xl font-extrabold tracking-tight">Join with code</div>
              <div className="fg-sub text-xs mt-1">Got a 6-character code? Hop in.</div>
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  )
}
