import { motion, AnimatePresence } from 'framer-motion'
import type { RoomState } from '../types'
import AvatarSvg from './AvatarSvg'

interface Props {
  state: RoomState
  isHost: boolean
  onKick: (id: string) => void
  onStart: () => void
  onAddBots: () => void
  onToggleLateJoin: () => void
}

export default function HostLobby({
  state,
  isHost,
  onKick,
  onStart,
  onAddBots,
  onToggleLateJoin,
}: Props) {
  return (
    <div className="max-w-[440px] mx-auto w-full space-y-5 pb-5">
      <div className="text-center">
        <h1
          className="fg-display"
          style={{ fontSize: 'clamp(2rem, 7vw, 3rem)', padding: '0 8px' }}
        >
          Cracked-Heist
        </h1>
        <p className="fg-sub text-xs mt-1">room is live · waiting for players</p>
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fg-panel fg-panel-lg text-center"
      >
        <div className="fg-lbl mb-2">join code</div>
        <div
          className="select-all fg-code"
          style={{ fontSize: 'clamp(2.5rem, 11vw, 3.5rem)' }}
        >
          {state.code}
        </div>
        <div className="fg-sub text-xs mt-3">
          students enter this on their device
        </div>
      </motion.div>

      <div className="fg-panel p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="fg-lbl">players ({state.players.length})</div>
          {isHost && state.players.length > 1 && (
            <div className="fg-sub text-[10px]">tap × to kick</div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <AnimatePresence>
            {state.players.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ delay: i * 0.04 }}
                className="relative rounded-2xl p-2 flex flex-col items-center gap-0.5"
                style={{
                  background: p.isHost ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.03)',
                  border: p.isHost
                    ? '1px solid rgba(251,191,36,0.3)'
                    : '1px solid rgba(74,222,128,0.12)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <AvatarSvg avatar={p.avatar} size={56} initial={p.handle} />
                <div
                  className="font-bold text-xs truncate max-w-full text-white text-center"
                  style={{ maxWidth: 80 }}
                >
                  {p.handle}
                </div>
                <div className="text-[9px]">
                  {p.isHost ? (
                    <span
                      className="px-1.5 py-0.5 rounded-full font-extrabold tracking-wider"
                      style={{
                        background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                        color: '#451a03',
                      }}
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
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[10px] font-extrabold flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
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
        <div className="space-y-2">
          <button
            onClick={onToggleLateJoin}
            className="w-full rounded-2xl p-3 text-left flex items-center gap-3"
            style={{
              background: state.settings.allowLateJoin
                ? 'rgba(74,222,128,0.10)'
                : 'rgba(255,255,255,0.04)',
              border: state.settings.allowLateJoin
                ? '2px solid rgba(74,222,128,0.45)'
                : '2px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: '#fff',
              transition: 'all 0.15s',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                flexShrink: 0,
                background: state.settings.allowLateJoin ? '#4ade80' : 'transparent',
                border: state.settings.allowLateJoin
                  ? '2px solid #4ade80'
                  : '2px solid rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#052e16',
                fontWeight: 900,
                fontSize: '0.95rem',
              }}
            >
              {state.settings.allowLateJoin ? '✓' : ''}
            </div>
            <div>
              <div className="font-extrabold text-sm">Allow players to join late</div>
              <div className="fg-sub text-[11px] mt-0.5">
                People with the code can join after the game starts. They get a
                random password and 0 coins.
              </div>
            </div>
          </button>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="fg-btn fg-btn-grad"
          >
            Start Game →
          </motion.button>
          <button
            onClick={onAddBots}
            className="fg-btn w-full"
            style={{
              padding: '10px 14px',
              fontSize: '0.85rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1.5px solid rgba(255,255,255,0.15)',
              color: '#d1d5db',
            }}
          >
            + Add 3 practice bots
          </button>
        </div>
      ) : (
        <div className="text-center fg-sub py-3 animate-pulse text-sm">
          waiting for host to start...
        </div>
      )}
    </div>
  )
}
