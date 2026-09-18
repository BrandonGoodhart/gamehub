import { motion } from 'framer-motion'
import type { RoomState } from '../types'

interface Props {
  state: RoomState
  onContinue: () => void
}

export default function Lobby({ state, onContinue }: Props) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="text-emerald-500 font-mono text-sm mb-2">// room established</div>
        <h1 className="text-5xl md:text-7xl font-mono font-bold text-emerald-300 tracking-widest drop-shadow-[0_0_15px_rgba(50,220,120,0.7)]">
          CRACKED<span className="text-emerald-500">-</span>HEIST
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-black/70 border border-emerald-500 rounded-lg p-8 text-center shadow-[0_0_25px_rgba(50,220,120,0.3)]"
      >
        <div className="text-emerald-400 font-mono text-sm mb-3">/* JOIN CODE */</div>
        <div className="text-6xl md:text-7xl font-mono font-bold text-emerald-200 tracking-[0.4em] select-all">
          {state.code}
        </div>
        <div className="text-emerald-700 font-mono text-xs mt-4">
          # share with hackers // ephemeral session
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-black/60 border border-emerald-800 rounded-lg p-4"
      >
        <div className="text-emerald-400 font-mono text-xs mb-3">CONNECTED [{state.players.length}]:</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {state.players.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-2 rounded bg-emerald-950/40 border border-emerald-900 font-mono text-sm flex items-center gap-2"
            >
              <span className={`w-2 h-2 rounded-full ${p.isHuman ? 'bg-cyan-400' : 'bg-emerald-400'} animate-pulse`} />
              <span className="text-emerald-200">{p.handle}</span>
              {p.id === state.meId && <span className="text-cyan-400 text-xs">[you]</span>}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onContinue}
        className="w-full py-4 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xl tracking-wider shadow-[0_0_25px_rgba(50,220,120,0.6)]"
      >
        &gt; INITIATE SESSION_
      </motion.button>
    </div>
  )
}
