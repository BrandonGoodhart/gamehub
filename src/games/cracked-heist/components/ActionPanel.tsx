import { motion } from 'framer-motion'
import type { Player, RoomState } from '../types'

interface Props {
  state: RoomState
  me: Player
  onChoose: (kind: 'spy' | 'hack' | 'password') => void
}

type Kind = 'spy' | 'hack' | 'password'

const STYLES: Record<
  Kind,
  { grad: string; bg: string; border: string; text: string; icon: string }
> = {
  hack: {
    grad: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    bg: 'rgba(251,191,36,0.06)',
    border: 'rgba(251,191,36,0.3)',
    text: '#fcd34d',
    icon: '⚡',
  },
  spy: {
    grad: 'linear-gradient(135deg, #34d399, #5eead4)',
    bg: 'rgba(94,234,212,0.05)',
    border: 'rgba(94,234,212,0.3)',
    text: '#99f6e4',
    icon: '👁',
  },
  password: {
    grad: 'linear-gradient(135deg, #4ade80, #a3e635)',
    bg: 'rgba(163,230,53,0.05)',
    border: 'rgba(163,230,53,0.3)',
    text: '#d9f99d',
    icon: '🔓',
  },
}

interface BtnProps {
  kind: Kind
  label: string
  cost: number
  desc: string
  meCoins: number
  onChoose: (k: Kind) => void
}

function Btn({ kind, label, cost, desc, meCoins, onChoose }: BtnProps) {
  const ok = meCoins >= cost
  const s = STYLES[kind]
  return (
    <motion.button
      whileHover={ok ? { y: -2 } : {}}
      whileTap={ok ? { scale: 0.97 } : {}}
      disabled={!ok}
      onClick={() => onChoose(kind)}
      className="w-full text-left p-4 rounded-2xl transition-all border backdrop-blur-md"
      style={{
        background: ok ? s.bg : 'rgba(255,255,255,0.02)',
        borderColor: ok ? s.border : 'rgba(255,255,255,0.05)',
        cursor: ok ? 'pointer' : 'not-allowed',
        opacity: ok ? 1 : 0.45,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-extrabold"
            style={{ background: s.grad, color: '#052e16', boxShadow: ok ? `0 4px 12px ${s.border}` : 'none' }}
          >
            {s.icon}
          </div>
          <div className="font-extrabold text-base" style={{ color: ok ? s.text : 'rgba(255,255,255,0.4)' }}>
            {label}
          </div>
        </div>
        <div className="text-xs font-extrabold tabular-nums" style={{ color: ok ? s.text : 'rgba(255,255,255,0.3)' }}>
          -{cost}c
        </div>
      </div>
      <div className="fg-sub text-xs leading-tight">{desc}</div>
    </motion.button>
  )
}

export default function ActionPanel({ state, me, onChoose }: Props) {
  const c = state.settings.costs
  const r = state.settings.rewards
  return (
    <div className="space-y-3">
      <Btn
        kind="hack"
        label="Hack"
        cost={c.hack}
        desc={`Steal +${r.hack}c instantly. Leaves a trace for 3 rounds.`}
        meCoins={me.coins}
        onChoose={onChoose}
      />
      <Btn
        kind="spy"
        label="Spy"
        cost={c.spy}
        desc={`Tail a hacker. If they hacked recently, steal up to ${r.spyCatch}c.`}
        meCoins={me.coins}
        onChoose={onChoose}
      />
      <Btn
        kind="password"
        label="Crack Password"
        cost={c.password}
        desc={`Pick 1 of 3 passwords. Right = steal ${r.passwordCatch}c.`}
        meCoins={me.coins}
        onChoose={onChoose}
      />
    </div>
  )
}
