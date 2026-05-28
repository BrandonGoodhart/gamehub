import { motion } from 'framer-motion'
import type { Player, RoomState } from '../types'
import AvatarSvg from './AvatarSvg'

interface Props {
  state: RoomState
  me: Player
}

export default function HUD({ state, me }: Props) {
  const pct = (state.timeLeft / state.settings.roundSeconds) * 100
  const danger = state.timeLeft <= 10
  return (
    <div className="bg-black/70 border border-emerald-700 rounded-lg px-4 py-3 font-mono flex items-center justify-between gap-4 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <AvatarSvg avatar={me.avatar} size={48} />
        <div>
          <div className="text-emerald-500 text-[10px] uppercase">room</div>
          <div className="text-emerald-200 text-sm tracking-widest">{state.code}</div>
        </div>
        <div>
          <div className="text-emerald-500 text-[10px] uppercase">round</div>
          <div className="text-emerald-200 text-sm">
            {state.round}<span className="text-emerald-700">/{state.settings.totalRounds}</span>
          </div>
        </div>
        <div>
          <div className="text-emerald-500 text-[10px] uppercase">handle</div>
          <div className="text-cyan-300 text-sm">{me.handle}</div>
        </div>
      </div>
      <motion.div
        animate={danger ? { scale: [1, 1.06, 1] } : {}}
        transition={{ duration: 0.5, repeat: danger ? Infinity : 0 }}
        className="flex items-center gap-3"
      >
        <div className="text-right">
          <div className={`text-2xl font-bold ${danger ? 'text-red-400' : 'text-emerald-200'} tabular-nums`}>
            {String(Math.floor(state.timeLeft / 60)).padStart(1, '0')}:
            {String(state.timeLeft % 60).padStart(2, '0')}
          </div>
          <div className="w-32 h-1.5 bg-emerald-950 rounded overflow-hidden">
            <div
              className={`h-full transition-all ${danger ? 'bg-red-500' : 'bg-emerald-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="text-right">
          <div className="text-emerald-500 text-[10px] uppercase">balance</div>
          <div className="text-amber-300 text-xl font-bold tabular-nums">{me.coins}c</div>
        </div>
      </motion.div>
    </div>
  )
}
