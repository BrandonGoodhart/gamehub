import { motion } from 'framer-motion'
import type { RoomState } from '../types'

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
            className={`w-full text-left px-3 py-2 rounded border font-mono text-sm flex items-center justify-between transition-all ${
              selectable
                ? 'border-emerald-500 hover:bg-emerald-500/10 cursor-pointer'
                : 'border-emerald-900/50 cursor-default'
            } ${isYou ? 'bg-emerald-900/30' : 'bg-black/40'} ${
              recentlyHacked ? 'border-red-500/80 shadow-[0_0_10px_rgba(255,80,80,0.4)]' : ''
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${p.isHuman ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
              <span className="text-emerald-300">{p.handle}</span>
              {isYou && <span className="text-xs text-cyan-400">[you]</span>}
              {recentlyHacked && <span className="text-xs text-red-400">[sus]</span>}
            </span>
            <span className="text-emerald-200 tabular-nums">{p.coins}c</span>
          </motion.button>
        )
      })}
    </div>
  )
}

