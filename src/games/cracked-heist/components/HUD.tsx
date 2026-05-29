import { motion } from 'framer-motion'
import type { Player, RoomState } from '../types'
import AvatarSvg from './AvatarSvg'

interface Props {
  state: RoomState
  me: Player
}

export default function HUD({ state, me }: Props) {
  const total = state.settings.roundSeconds
  const remaining = state.timeLeft
  const danger = remaining <= 10
  const warn = remaining <= 20 && !danger
  const r = 29
  const circumference = 2 * Math.PI * r
  const offset = circumference - (remaining / total) * circumference

  return (
    <div className="fg-panel px-4 py-3 flex items-center justify-between gap-4 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="relative">
          <AvatarSvg avatar={me.avatar} size={48} initial={me.handle} />
        </div>
        <div className="flex flex-col">
          <div className="fg-lbl text-[9px]">room</div>
          <div className="fg-code text-sm">{state.code}</div>
        </div>
        <div className="hidden sm:flex flex-col">
          <div className="fg-lbl text-[9px]">round</div>
          <div className="text-sm font-bold">
            {state.round}<span className="fg-sub">/{state.settings.totalRounds}</span>
          </div>
        </div>
        <div className="hidden md:flex flex-col">
          <div className="fg-lbl text-[9px]">you</div>
          <div className="text-sm font-bold text-[var(--green-l)]">{me.handle}</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <motion.div
          animate={danger ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 0.6, repeat: danger ? Infinity : 0 }}
          className="relative w-[60px] h-[60px]"
        >
          <svg className="w-full h-full -rotate-90" viewBox="0 0 66 66">
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#a3e635" />
              </linearGradient>
            </defs>
            <circle cx="33" cy="33" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5" />
            <circle
              cx="33"
              cy="33"
              r={r}
              fill="none"
              stroke={danger ? '#fb7185' : warn ? '#fbbf24' : 'url(#timerGrad)'}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transition: 'stroke-dashoffset 1s linear',
                filter: danger
                  ? 'drop-shadow(0 0 12px rgba(251,113,133,0.6))'
                  : 'drop-shadow(0 0 8px rgba(74,222,128,0.4))',
              }}
            />
          </svg>
          <div
            className={`absolute inset-0 flex items-center justify-center text-sm font-extrabold tabular-nums ${
              danger ? 'text-[var(--red)]' : 'text-white'
            }`}
          >
            {String(Math.floor(remaining / 60))}:{String(remaining % 60).padStart(2, '0')}
          </div>
        </motion.div>
        <div className="text-right">
          <div className="fg-lbl text-[9px]">coins</div>
          <div className="text-2xl font-extrabold tabular-nums" style={{ color: '#fbbf24' }}>
            {me.coins}
          </div>
        </div>
      </div>
    </div>
  )
}
