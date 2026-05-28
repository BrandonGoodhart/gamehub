import { motion } from 'framer-motion'
import type { RoomState } from '../types'

interface Props {
  state: RoomState
  onReset: () => void
}

export default function GameOver({ state, onReset }: Props) {
  const sorted = [...state.players].sort((a, b) => b.coins - a.coins)
  const winner = sorted[0]
  const me = state.players.find((p) => p.id === state.meId)!
  const youWon = winner.id === state.meId
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto bg-black/80 border-2 border-emerald-400 rounded-lg p-8 font-mono shadow-[0_0_40px_rgba(50,220,120,0.6)]"
    >
      <div className="text-center mb-6">
        <div className="text-emerald-500 text-sm mb-2">// session_terminated</div>
        <h2 className={`text-5xl font-bold mb-3 ${youWon ? 'text-emerald-300' : 'text-red-400'}`}>
          {youWon ? '> WINNER_' : '> CRACKED_'}
        </h2>
        <div className="text-emerald-200 text-xl">
          {winner.handle} <span className="text-emerald-500">::</span> {winner.coins}c
        </div>
      </div>

      <div className="text-emerald-500 text-xs mb-2">/* your stats */</div>
      <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
        <Stat label="balance" value={`${me.coins}c`} />
        <Stat label="hacks_run" value={me.hacksDone} />
        <Stat label="caught" value={me.caughtCount} />
        <Stat label="spies_run" value={me.spiesDone} />
        <Stat label="cracks_tried" value={me.passwordsGuessed} />
        <Stat label="rank" value={`#${sorted.findIndex((p) => p.id === me.id) + 1}`} />
      </div>

      <div className="text-emerald-500 text-xs mb-2">/* final standings */</div>
      <div className="space-y-1 mb-6">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-3 py-2 rounded ${
              p.id === state.meId ? 'bg-emerald-900/40 border border-emerald-700' : 'bg-black/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 w-6">{i + 1}.</span>
              <span className="text-emerald-200">{p.handle}</span>
            </div>
            <span className="text-amber-300 tabular-nums">{p.coins}c</span>
          </div>
        ))}
      </div>

      <button
        onClick={onReset}
        className="w-full py-3 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg tracking-wider"
      >
        &gt; NEW HEIST_
      </button>
    </motion.div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-black/50 border border-emerald-800 rounded px-3 py-2">
      <div className="text-emerald-500 text-[10px] uppercase">{label}</div>
      <div className="text-emerald-200 text-lg">{value}</div>
    </div>
  )
}
