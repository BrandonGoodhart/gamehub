import { motion } from 'framer-motion'
import type { RoomState } from '../types'
import AvatarSvg from './AvatarSvg'

interface Props {
  state: RoomState
  selectableIds?: string[]
  onSelect?: (id: string) => void
  highlightHacked?: boolean
}

export default function PlayerList({ state, selectableIds, onSelect, highlightHacked }: Props) {
  const sorted = [...state.players].sort((a, b) => b.coins - a.coins)
  return (
    <div className="space-y-2">
      {sorted.map((p, i) => {
        const selectable = !!selectableIds && selectableIds.includes(p.id)
        const isYou = p.id === state.meId
        const recentlyHacked =
          highlightHacked && p.hackedInRounds.some((r) => r >= state.round - 2)
        return (
          <motion.button
            key={p.id}
            disabled={!selectable}
            onClick={() => selectable && onSelect?.(p.id)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="w-full text-left px-3 py-2 rounded-2xl border flex items-center gap-3 transition-all"
            style={{
              background: isYou ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
              borderColor: recentlyHacked
                ? 'rgba(251,113,133,0.6)'
                : selectable
                  ? 'rgba(74,222,128,0.5)'
                  : 'rgba(74,222,128,0.1)',
              boxShadow: recentlyHacked
                ? '0 0 14px rgba(251,113,133,0.4)'
                : selectable
                  ? '0 0 12px rgba(74,222,128,0.2)'
                  : 'none',
              cursor: selectable ? 'pointer' : 'default',
              backdropFilter: 'blur(10px)',
            }}
          >
            <AvatarSvg avatar={p.avatar} size={36} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white truncate">{p.handle}</span>
                {isYou && <span className="text-[10px] font-bold text-[var(--teal)]">you</span>}
                {recentlyHacked && (
                  <span
                    className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(251,113,133,0.18)', color: '#fda4af' }}
                  >
                    SUS
                  </span>
                )}
              </div>
              {p.isHost && <span className="text-[9px] font-bold text-[#fbbf24]">HOST</span>}
            </div>
            <span className="font-extrabold text-sm tabular-nums" style={{ color: '#fbbf24' }}>
              {p.coins}c
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
