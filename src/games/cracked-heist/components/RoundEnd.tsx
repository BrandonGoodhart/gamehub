import { motion } from 'framer-motion'
import type { RoomState } from '../types'
import AvatarSvg from './AvatarSvg'

interface Props {
  state: RoomState
  onNext: () => void
}

export default function RoundEnd({ state, onNext }: Props) {
  const sorted = [...state.players].sort((a, b) => b.coins - a.coins)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto fg-panel fg-panel-lg"
    >
      <div className="text-center mb-5">
        <div className="fg-lbl">round {state.round} complete</div>
        <h2 className="fg-display text-3xl mt-1">Standings</h2>
      </div>
      <div className="space-y-2 mb-6">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center justify-between px-3 py-2 rounded-2xl"
            style={{
              background:
                p.id === state.meId ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
              border: p.id === state.meId ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold"
                style={{
                  background:
                    i === 0
                      ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                      : 'rgba(74,222,128,0.12)',
                  color: i === 0 ? '#451a03' : '#86efac',
                }}
              >
                {i + 1}
              </span>
              <AvatarSvg avatar={p.avatar} size={32} initial={p.handle} />
              <span className="font-bold text-white">{p.handle}</span>
              {p.id === state.meId && <span className="text-[10px] text-[var(--teal)] font-bold">you</span>}
            </div>
            <span className="font-extrabold text-base tabular-nums" style={{ color: '#fbbf24' }}>
              {p.coins}c
            </span>
          </div>
        ))}
      </div>
      <button onClick={onNext} className="fg-btn fg-btn-grad">
        Next Round →
      </button>
    </motion.div>
  )
}
