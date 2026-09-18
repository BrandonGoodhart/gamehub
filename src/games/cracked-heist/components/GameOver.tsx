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

// Standard competition ranking: tied players share the same rank, next
// rank skips ahead. So [10, 10, 8, 5] → [1, 1, 3, 4].
function computeRanks(coins: number[]): number[] {
  const ranks: number[] = []
  for (let i = 0; i < coins.length; i++) {
    if (i === 0) ranks.push(1)
    else if (coins[i] === coins[i - 1]) ranks.push(ranks[i - 1])
    else ranks.push(i + 1)
  }
  return ranks
}

export default function GameOver({ state, meId, onReset }: Props) {
  const sorted = [...state.players].sort((a, b) => b.coins - a.coins)
  const ranks = computeRanks(sorted.map((p) => p.coins))
  // Indices where rank === 1 (all tied winners)
  const winnerIndices = ranks.map((r, i) => (r === 1 ? i : -1)).filter((i) => i >= 0)
  const winners = winnerIndices.map((i) => sorted[i])
  const isMultiwayTieAtTop = winners.length > 1
  const me = state.players.find((p) => p.id === meId)
  const myIdx = me ? sorted.findIndex((p) => p.id === me.id) : -1
  const myRank = myIdx >= 0 ? ranks[myIdx] : 0
  // Count how many players share my rank — used to display "T1" etc.
  const tiedCount = (rank: number) => ranks.filter((r) => r === rank).length
  const youWon = winners.some((w) => w.id === meId)
  const code = useMemo(() => state.shareCode ?? persistGame(state), [state])
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const { origin, pathname } = window.location
    return `${origin}${pathname}?share=${code}`
  }, [code])
  const [copied, setCopied] = useState<'none' | 'link'>('none')

  useEffect(() => {
    if (myRank >= 1 && myRank <= 3) {
      launchConfetti(myRank)
    }
  }, [myRank])

  function copyLink() {
    try {
      navigator.clipboard.writeText(shareUrl)
      setCopied('link')
      setTimeout(() => setCopied('none'), 1500)
    } catch {
      // ignore
    }
  }

  // For observer hosts, me is undefined. We skip the "your stats" section and
  // use neutral game-over framing instead of "You Won!".
  const isObserver = !me
  const headerLabel = isObserver
    ? 'game over'
    : myRank === 1
      ? isMultiwayTieAtTop
        ? `tied for first place`
        : 'first place'
      : myRank === 2
        ? tiedCount(2) > 1
          ? 'tied for second place'
          : 'second place'
        : myRank === 3
          ? tiedCount(3) > 1
            ? 'tied for third place'
            : 'third place'
          : 'game over'

  const bigTitle = isObserver
    ? 'Game Over'
    : youWon
      ? isMultiwayTieAtTop
        ? "It's a Tie!"
        : 'You Won!'
      : myRank === 2
        ? 'Silver!'
        : myRank === 3
          ? 'Bronze!'
          : 'Cracked.'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto fg-panel fg-panel-lg relative overflow-hidden"
    >
      <div className="text-center mb-6">
        <div className="fg-lbl text-[#fbbf24] mb-1">{headerLabel}</div>
        <h2 className="fg-display text-5xl mb-3">{bigTitle}</h2>
        <p className="fg-sub text-xs mb-3">
          Winner = the player with the most coins.{' '}
          {isMultiwayTieAtTop && `Tied — ${winners.length} players share first.`}
        </p>

        {/* Winner card — one tile per winner */}
        <div className="flex items-center justify-center flex-wrap gap-3 mt-3">
          {winners.map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{
                background: 'rgba(251,191,36,0.06)',
                border: '1.5px solid rgba(251,191,36,0.35)',
              }}
            >
              <AvatarSvg avatar={w.avatar} size={40} initial={w.handle} />
              <div className="text-left">
                <div className="fg-lbl">
                  {isMultiwayTieAtTop ? 'tied 1st' : 'winner'}
                </div>
                <div className="text-base font-extrabold text-white">{w.handle}</div>
                <div className="text-xs font-bold" style={{ color: '#fbbf24' }}>
                  {w.coins}c
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl p-4 mb-5 text-center"
        style={{
          background: 'rgba(74,222,128,0.06)',
          border: '1.5px solid rgba(74,222,128,0.3)',
        }}
      >
        <div className="fg-lbl mb-2">share the leaderboard</div>
        <button
          onClick={copyLink}
          className="fg-btn fg-btn-grad w-full"
          style={{ padding: '12px 16px', fontSize: '0.95rem' }}
        >
          {copied === 'link' ? 'Link copied ✓' : 'Copy share link'}
        </button>
        <p className="fg-sub text-xs mt-2">
          Paste the link into any messaging app — anyone who opens it sees this leaderboard.
        </p>
      </div>

      {me && (
        <>
          <div className="fg-lbl mb-2">your stats</div>
          <div className="grid grid-cols-3 gap-2 mb-5">
            <Stat label="coins" value={`${me.coins}c`} />
            <Stat label="hacks" value={me.hacksDone} />
            <Stat label="caught" value={me.caughtCount} />
            <Stat label="spies" value={me.spiesDone} />
            <Stat label="cracks" value={me.passwordsGuessed} />
            <Stat
              label="rank"
              value={`${tiedCount(myRank) > 1 ? 'T' : ''}#${myRank}`}
            />
          </div>
        </>
      )}

      <div className="fg-lbl mb-2">final standings</div>
      <div className="space-y-1.5 mb-5">
        {sorted.map((p, i) => {
          const r = ranks[i]
          const tied = tiedCount(r) > 1
          return (
            <div
              key={p.id}
              className="flex items-center justify-between px-3 py-1.5 rounded-xl"
              style={{
                background: p.id === meId ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(74,222,128,0.08)',
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-9 text-right font-extrabold text-sm tabular-nums"
                  style={{ color: tied ? '#5eead4' : 'rgba(255,255,255,0.55)' }}
                  title={tied ? 'Tied with another player' : undefined}
                >
                  {tied ? `T${r}` : r}.
                </span>
                <AvatarSvg avatar={p.avatar} size={24} initial={p.handle} />
                <span className="font-bold text-white text-sm">{p.handle}</span>
              </div>
              <span className="font-extrabold text-sm tabular-nums" style={{ color: '#fbbf24' }}>
                {p.coins}c
              </span>
            </div>
          )
        })}
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
