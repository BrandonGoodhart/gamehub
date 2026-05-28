import { motion } from 'framer-motion'

interface Props {
  onHost: () => void
  onJoin: () => void
}

export default function StartScreen({ onHost, onJoin }: Props) {
  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="text-emerald-500 font-mono text-sm mb-2">// welcome_to_the_grid</div>
        <h1 className="text-5xl md:text-7xl font-mono font-bold text-emerald-300 tracking-widest drop-shadow-[0_0_20px_rgba(50,220,120,0.7)]">
          CRACKED<span className="text-emerald-500">-</span>HEIST
        </h1>
        <p className="text-emerald-400/80 font-mono text-sm mt-3">
          a class hacking trivia game
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.04, y: -4 }}
          whileTap={{ scale: 0.97 }}
          onClick={onHost}
          className="p-8 rounded-2xl bg-black/70 border-2 border-emerald-500 hover:border-emerald-300 text-left shadow-[0_0_25px_rgba(50,220,120,0.3)] hover:shadow-[0_0_35px_rgba(50,220,120,0.6)] transition-all"
        >
          <div className="text-emerald-500 font-mono text-xs mb-2">/* TEACHER */</div>
          <div className="text-emerald-200 font-mono text-3xl font-bold mb-2">&gt; HOST_</div>
          <div className="text-emerald-300/80 font-mono text-sm">
            Create a room, share the code, control the game.
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.04, y: -4 }}
          whileTap={{ scale: 0.97 }}
          onClick={onJoin}
          className="p-8 rounded-2xl bg-black/70 border-2 border-cyan-500 hover:border-cyan-300 text-left shadow-[0_0_25px_rgba(103,232,249,0.25)] hover:shadow-[0_0_35px_rgba(103,232,249,0.5)] transition-all"
        >
          <div className="text-cyan-500 font-mono text-xs mb-2">/* STUDENT */</div>
          <div className="text-cyan-200 font-mono text-3xl font-bold mb-2">&gt; JOIN_</div>
          <div className="text-cyan-300/80 font-mono text-sm">
            Got a 6-digit code? Hop in and start hacking.
          </div>
        </motion.button>
      </div>
    </div>
  )
}
