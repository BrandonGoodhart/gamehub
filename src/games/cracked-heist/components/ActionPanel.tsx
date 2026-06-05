import { motion } from 'framer-motion'
import type { Player, RoomState } from '../types'

interface Props {
  state: RoomState
  me: Player
  onChoose: (kind: 'spy' | 'hack' | 'password') => void
}

type Kind = 'spy' | 'hack' | 'password'

const STYLES: Record<Kind, { grad: string; bg: string; border: string; text: string }> = {
  hack: {
    grad: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    bg: 'rgba(251,191,36,0.06)',
    border: 'rgba(251,191,36,0.3)',
    text: '#fcd34d',
  },
  spy: {
    grad: 'linear-gradient(135deg, #34d399, #5eead4)',
    bg: 'rgba(94,234,212,0.05)',
    border: 'rgba(94,234,212,0.3)',
    text: '#99f6e4',
  },
  password: {
    grad: 'linear-gradient(135deg, #4ade80, #a3e635)',
    bg: 'rgba(163,230,53,0.05)',
    border: 'rgba(163,230,53,0.3)',
    text: '#d9f99d',
  },
}

interface BtnProps {
  kind: Kind
  label: string
  costLabel: string
  desc: string
  ok: boolean
  onChoose: (k: Kind) => void
}

function Btn({ kind, label, costLabel, desc, ok, onChoose }: BtnProps) {
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
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-extrabold"
            style={{ background: s.grad, color: '#052e16' }}
          >
            {label.charAt(0)}
          </div>
          <div className="font-extrabold text-base" style={{ color: ok ? s.text : 'rgba(255,255,255,0.4)' }}>
            {label}
          </div>
        </div>
        <div className="text-xs font-extrabold tabular-nums" style={{ color: ok ? s.text : 'rgba(255,255,255,0.3)' }}>
          {costLabel}
        </div>
      </div>
      <div className="fg-sub text-xs leading-tight">{desc}</div>
    </motion.button>
  )
}

export default function ActionPanel({ state, me, onChoose }: Props) {
  const c = state.settings.costs
  return (
    <div className="space-y-3">
      <Btn
        kind="hack"
        label="Hack Computer"
        costLabel={`${c.hack} tokens`}
        desc={`Spend tokens to crack open a computer panel for bonus coins (3-20).`}
        ok={me.tokens >= c.hack}
        onChoose={onChoose}
      />
      <Btn
        kind="spy"
        label="Spy"
        costLabel={`${c.spy} tokens`}
        desc={`Find the hacker among 3 suspects. Right = +${state.settings.rewards.spyCatch} coins.`}
        ok={me.tokens >= c.spy}
        onChoose={onChoose}
      />
      <Btn
        kind="password"
        label="Send Phishing"
        costLabel={`${c.password} tokens`}
        desc={`Pick a target + the message that will trick them. Right = +${state.settings.rewards.passwordCatch} coins.`}
        ok={me.tokens >= c.password}
        onChoose={onChoose}
      />
    </div>
  )
}
