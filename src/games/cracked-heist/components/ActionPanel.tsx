import { motion } from 'framer-motion'
import type { Player, RoomState } from '../types'

interface Props {
  state: RoomState
  me: Player
  onChoose: (kind: 'spy' | 'hack' | 'password') => void
}

type Kind = 'spy' | 'hack' | 'password'

const STYLES: Record<Kind, { border: string; bg: string; text: string; glow: string }> = {
  hack: {
    border: 'border-amber-500',
    bg: 'hover:bg-amber-900/30',
    text: 'text-amber-200',
    glow: 'shadow-[0_0_12px_rgba(252,211,77,0.25)]',
  },
  spy: {
    border: 'border-cyan-400',
    bg: 'hover:bg-cyan-900/30',
    text: 'text-cyan-200',
    glow: 'shadow-[0_0_12px_rgba(103,232,249,0.25)]',
  },
  password: {
    border: 'border-fuchsia-400',
    bg: 'hover:bg-fuchsia-900/30',
    text: 'text-fuchsia-200',
    glow: 'shadow-[0_0_12px_rgba(240,171,252,0.25)]',
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
      whileHover={ok ? { scale: 1.03 } : {}}
      whileTap={ok ? { scale: 0.97 } : {}}
      disabled={!ok}
      onClick={() => onChoose(kind)}
      className={`w-full text-left px-4 py-3 rounded border font-mono text-sm transition-all ${
        ok
          ? `${s.border} ${s.bg} ${s.text} ${s.glow} bg-black/60 cursor-pointer`
          : 'border-emerald-900/40 bg-black/30 text-emerald-700/50 cursor-not-allowed'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold">&gt; {label}</span>
        <span className="text-xs">-{cost}c</span>
      </div>
      <div className="text-xs opacity-80 leading-tight">{desc}</div>
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
        label="HACK"
        cost={c.hack}
        desc={`Steal +${r.hack}c instantly. Leaves a trace for 3 rounds.`}
        meCoins={me.coins}
        onChoose={onChoose}
      />
      <Btn
        kind="spy"
        label="SPY"
        cost={c.spy}
        desc={`Tail a hacker. If they hacked recently, steal up to ${r.spyCatch}c.`}
        meCoins={me.coins}
        onChoose={onChoose}
      />
      <Btn
        kind="password"
        label="CRACK PASSWORD"
        cost={c.password}
        desc={`Pick 1 of 3 passwords. Right = steal ${r.passwordCatch}c. Wrong = nothing.`}
        meCoins={me.coins}
        onChoose={onChoose}
      />
    </div>
  )
}
