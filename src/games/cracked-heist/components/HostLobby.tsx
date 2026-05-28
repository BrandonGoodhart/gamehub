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
  return (
    <div className="max-w-3xl mx-auto w-full space-y-5">
      <div className="text-center">
        <div className="fg-lbl mb-2">// room active</div>
        <h1 className="fg-display text-[clamp(2rem,6vw,3rem)]">Cracked-Heist</h1>
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fg-panel fg-panel-lg text-center"
      >
        <div className="fg-lbl mb-2">/ join code</div>
        <div
          className="select-all fg-code"
          style={{ fontSize: 'clamp(2.5rem, 9vw, 4rem)' }}
        >
          {state.code}
        </div>
        <div className="fg-sub text-xs mt-3">
          students enter this on their device →{' '}
          <span className="text-[var(--green-l)] font-bold">cracked-heist</span>
        </div>
      </motion.div>

      <div className="fg-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="fg-lbl">connected ({state.players.length})</div>
          {isHost && (
            <div className="fg-sub text-xs">tap × to kick</div>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence>
            {state.players.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ delay: i * 0.04 }}
                className="relative rounded-2xl p-3 flex flex-col items-center gap-1 fg-mode-card"
                style={{ cursor: 'default' }}
              >
                <AvatarSvg avatar={p.avatar} size={64} />
                <div className="font-bold text-sm truncate max-w-full text-white">{p.handle}</div>
                <div className="text-[10px]">
                  {p.isHost ? (
                    <span
                      className="px-2 py-0.5 rounded-full font-extrabold tracking-wider"
                      style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#451a03' }}
                    >
                      HOST
                    </span>
                  ) : p.id === state.meId ? (
                    <span className="text-[var(--teal)] font-bold">you</span>
                  ) : (
                    <span className="fg-sub">player</span>
                  )}
                </div>
                {isHost && !p.isHost && (
                  <button
                    onClick={() => onKick(p.id)}
                    title={`kick ${p.handle}`}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-xs font-extrabold flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg,#fb7185,#e11d48)',
                      boxShadow: '0 4px 12px rgba(251,113,133,.5)',
                    }}
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
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="fg-btn fg-btn-grad"
        >
          Start Game →
        </motion.button>
      ) : (
        <div className="text-center fg-sub py-4 animate-pulse">
          waiting for host to start...
        </div>
      )}
    </div>
  )
}
