import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import type { RoomState } from '../types'
import AvatarSvg from './AvatarSvg'
import { persistGame } from '../shareStore'

interface Props {
  state: RoomState
  meId: string
  onReset: () => void
}

function launchConfetti(rank: number) {
  // Burst intensity scales with rank — 1st = biggest blast, 3rd = small
  const intensity = rank === 1 ? 1 : rank === 2 ? 0.65 : 0.4
  const count = Math.round(180 * intensity)
  const colors =
    rank === 1
      ? ['#fbbf24', '#f59e0b', '#fde047', '#22c55e', '#4ade80']
      : rank === 2
        ? ['#e5e7eb', '#cbd5e1', '#94a3b8', '#4ade80']
        : ['#fb923c', '#f97316', '#fbbf24', '#4ade80']
  // Three bursts from different origins
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      confetti({
        particleCount: count,
        spread: 80 + i * 10,
        startVelocity: 50,
        origin: { y: 0.6, x: 0.2 + i * 0.3 },
        colors,
        scalar: 1 + intensity * 0.4,
      })
    }, i * 250)
  }
}

export default function GameOver({ state, meId, onReset }: Props) {
  const sorted = [...state.players].sort((a, b) => b.coins - a.coins)
  const winner = sorted[0]
  const me = state.players.find((p) => p.id === meId)
  const myRank = me ? sorted.findIndex((p) => p.id === me.id) + 1 : 0
  const youWon = winner.id === meId
  const code = useMemo(() => state.shareCode ?? persistGame(state), [state])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (myRank >= 1 && myRank <= 3) {
      launchConfetti(myRank)
    }
  }, [myRank])

  function copy() {
    try {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  if (!me) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-xl mx-auto fg-panel fg-panel-lg text-center"
      >
        <div className="fg-display text-3xl mb-4">Game Over</div>
        <p className="fg-sub text-sm">Loading your stats…</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto fg-panel fg-panel-lg relative overflow-hidden"
    >
      <div className="text-center mb-6">
        <div className="fg-lbl text-[#fbbf24] mb-1">
          {myRank === 1 ? 'first place' : myRank === 2 ? 'second place' : myRank === 3 ? 'third place' : 'game over'}
        </div>
        <h2 className="fg-display text-5xl mb-3">
          {youWon ? 'You Won!' : myRank === 2 ? 'Silver!' : myRank === 3 ? 'Bronze!' : 'Cracked.'}
        </h2>
        <p className="fg-sub text-xs mb-3">Winner = the player with the most coins.</p>
        <div className="flex items-center justify-center gap-3 mt-3">
          <AvatarSvg avatar={winner.avatar} size={56} initial={winner.handle} />
          <div className="text-left">
            <div className="fg-lbl">winner</div>
            <div className="text-xl font-extrabold text-white">{winner.handle}</div>
            <div className="text-sm font-bold" style={{ color: '#fbbf24' }}>
              {winner.coins}c
            </div>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl p-4 mb-5 text-center"
        style={{
          background: 'rgba(74,222,128,0.06)',
          border: '1.5px solid rgba(74,222,128,0.3)',
        }}
      >
        <div className="fg-lbl mb-2">leaderboard code</div>
        <div
          className="rounded-lg p-2 mb-2 text-left"
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(74,222,128,0.18)',
            maxHeight: 80,
            overflowY: 'auto',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.7rem',
            color: '#86efac',
            wordBreak: 'break-all',
            lineHeight: 1.4,
          }}
        >
          {code}
        </div>
        <button
          onClick={copy}
          className="fg-btn fg-btn-grad"
          style={{ padding: '10px 20px', fontSize: '0.9rem' }}
        >
          {copied ? 'Copied ✓' : 'Copy code'}
        </button>
        <p className="fg-sub text-xs mt-2">
          Paste this code on the home page of any device to see the leaderboard.
        </p>
      </div>

      <div className="fg-lbl mb-2">your stats</div>
      <div className="grid grid-cols-3 gap-2 mb-5">
        <Stat label="coins" value={`${me.coins}c`} />
        <Stat label="hacks" value={me.hacksDone} />
        <Stat label="caught" value={me.caughtCount} />
        <Stat label="spies" value={me.spiesDone} />
        <Stat label="cracks" value={me.passwordsGuessed} />
        <Stat label="rank" value={`#${myRank}`} />
      </div>

      <div className="fg-lbl mb-2">final standings</div>
      <div className="space-y-1.5 mb-5">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center justify-between px-3 py-1.5 rounded-xl"
            style={{
              background: p.id === meId ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(74,222,128,0.08)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="fg-sub w-5 text-right">{i + 1}.</span>
              <AvatarSvg avatar={p.avatar} size={24} initial={p.handle} />
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
