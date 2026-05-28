import { motion, AnimatePresence } from 'framer-motion'
import type { RoomState } from '../types'
import AvatarSvg from './AvatarSvg'

interface Props {
  state: RoomState
  isHost: boolean
  onKick: (id: string) => void
  onStart: () => void
}

export default function HostLobby({ state, isHost, onKick, onStart }: Props) {
  const host = state.players.find((p) => p.isHost)
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="text-emerald-500 font-mono text-sm mb-2">// room_active</div>
        <h1 className="text-4xl md:text-6xl font-mono font-bold text-emerald-300 tracking-widest drop-shadow-[0_0_15px_rgba(50,220,120,0.7)]">
          CRACKED<span className="text-emerald-500">-</span>HEIST
        </h1>
      </motion.div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-black/80 border-2 border-emerald-500 rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(50,220,120,0.3)]"
      >
        <div className="text-emerald-400 font-mono text-xs mb-2">/* JOIN CODE */</div>
        <div className="text-5xl md:text-7xl font-mono font-bold text-emerald-200 tracking-[0.4em] select-all mb-2">
          {state.code}
        </div>
        <div className="text-emerald-700 font-mono text-xs">
          # students enter this code on their device
        </div>
        {host && (
          <div className="text-emerald-500 font-mono text-xs mt-3">
            host: <span className="text-emerald-300">{host.handle}</span>
          </div>
        )}
      </motion.div>

      <div className="bg-black/60 border border-emerald-800 rounded-2xl p-5">
        <div className="text-emerald-400 font-mono text-xs mb-3">
          CONNECTED [{state.players.length}]:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence>
            {state.players.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`relative rounded-xl p-3 bg-emerald-950/40 border ${
                  p.isHost ? 'border-amber-500' : 'border-emerald-700'
                } flex flex-col items-center gap-1`}
              >
                <AvatarSvg avatar={p.avatar} size={72} />
                <div className="font-mono text-sm text-emerald-200 truncate max-w-full">{p.handle}</div>
                <div className="text-[10px] font-mono">
                  {p.isHost ? (
                    <span className="text-amber-400">HOST</span>
                  ) : p.id === state.meId ? (
                    <span className="text-cyan-400">you</span>
                  ) : (
                    <span className="text-emerald-700">player</span>
                  )}
                </div>
                {isHost && !p.isHost && (
                  <button
                    onClick={() => onKick(p.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                    title={`kick ${p.handle}`}
                  >
                    ×
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {isHost ? (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xl tracking-wider shadow-[0_0_25px_rgba(50,220,120,0.6)]"
        >
          &gt; START GAME_
        </motion.button>
      ) : (
        <div className="text-center font-mono text-emerald-400 py-4 animate-pulse">
          waiting for host to start...
        </div>
      )}
    </div>
  )
}
