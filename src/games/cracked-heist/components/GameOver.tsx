import { motion } from 'framer-motion'
import type { RoomState } from '../types'
import AvatarSvg from './AvatarSvg'

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
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto fg-panel fg-panel-lg relative overflow-hidden"
    >
      <div className="text-center mb-6">
        <div className="fg-lbl text-[#fbbf24] mb-1">game over</div>
        <h2 className="fg-display text-5xl mb-3">
          {youWon ? 'You Won!' : 'Cracked.'}
        </h2>
        <div className="flex items-center justify-center gap-3 mt-3">
          <AvatarSvg avatar={winner.avatar} size={56} />
          <div className="text-left">
            <div className="fg-lbl">winner</div>
            <div className="text-xl font-extrabold text-white">{winner.handle}</div>
            <div className="text-sm font-bold" style={{ color: '#fbbf24' }}>
              {winner.coins}c
            </div>
          </div>
        </div>
      </div>

      <div className="fg-lbl mb-2">your stats</div>
      <div className="grid grid-cols-3 gap-2 mb-5">
        <Stat label="coins" value={`${me.coins}c`} />
        <Stat label="hacks" value={me.hacksDone} />
        <Stat label="caught" value={me.caughtCount} />
        <Stat label="spies" value={me.spiesDone} />
        <Stat label="cracks" value={me.passwordsGuessed} />
        <Stat label="rank" value={`#${sorted.findIndex((p) => p.id === me.id) + 1}`} />
      </div>

      <div className="fg-lbl mb-2">final standings</div>
      <div className="space-y-1.5 mb-5">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center justify-between px-3 py-1.5 rounded-xl"
            style={{
              background: p.id === state.meId ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(74,222,128,0.08)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="fg-sub w-5 text-right">{i + 1}.</span>
              <AvatarSvg avatar={p.avatar} size={24} />
              <span className="font-bold text-white text-sm">{p.handle}</span>
            </div>
            <span className="font-extrabold text-sm tabular-nums" style={{ color: '#fbbf24' }}>
              {p.coins}c
            </span>
          </div>
        ))}
      </div>

      <button onClick={onReset} className="fg-btn fg-btn-grad">
        New Game →
      </button>
    </motion.div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-2xl p-3 text-center"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(74,222,128,0.12)',
      }}
    >
      <div className="fg-lbl text-[10px]">{label}</div>
      <div className="text-lg font-extrabold text-white tabular-nums">{value}</div>
    </div>
  )
}
