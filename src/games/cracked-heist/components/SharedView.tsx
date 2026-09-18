import { useState } from 'react'
import { motion } from 'framer-motion'
import type { SharedGame } from '../types'
import AvatarSvg from './AvatarSvg'

interface Props {
  game: SharedGame | null
  code: string
  onBack: () => void
}

// Standard competition ranking: [10,10,8,5] → [1,1,3,4]
function computeRanks(coins: number[]): number[] {
  const ranks: number[] = []
  for (let i = 0; i < coins.length; i++) {
    if (i === 0) ranks.push(1)
    else if (coins[i] === coins[i - 1]) ranks.push(ranks[i - 1])
    else ranks.push(i + 1)
  }
  return ranks
}

export default function SharedView({ game, code, onBack }: Props) {
  const [copied, setCopied] = useState(false)

  function copy() {
    try {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <div className="max-w-[480px] mx-auto w-full space-y-5 pb-5">
      <div className="flex">
        <button onClick={onBack} className="fg-back">
          ← Back
        </button>
      </div>

      <div className="text-center">
        <h1
          className="fg-display"
          style={{ fontSize: 'clamp(2rem, 7vw, 3rem)', padding: '0 8px' }}
        >
          Leaderboard
        </h1>
        <p className="fg-sub text-xs mt-1">share code (tap to copy)</p>
        <button
          onClick={copy}
          className="fg-code mt-2 cursor-pointer"
          style={{ fontSize: '1.6rem', background: 'none', border: 'none' }}
        >
          {code} {copied && <span className="text-[var(--green-l)] text-xs ml-2">copied</span>}
        </button>
      </div>

      {!game ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fg-panel fg-panel-lg text-center"
        >
          <div className="font-extrabold text-lg text-white mb-2">No game found.</div>
          <p className="fg-sub text-sm">
            That share code isn't saved on this device. Cross-device sharing needs a backend (coming soon).
          </p>
        </motion.div>
      ) : (
        <>
          <div className="fg-panel p-5">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="fg-lbl">category</div>
                <div className="text-white font-bold text-sm">{game.category ?? 'Custom'}</div>
              </div>
              <div>
                <div className="fg-lbl">length</div>
                <div className="text-white font-bold text-sm">{game.seconds}s</div>
              </div>
            </div>
          </div>

          <div className="fg-panel p-4">
            <div className="fg-lbl mb-3">final standings</div>
            <Standings players={game.players} />
          </div>

        </>
      )}
    </div>
  )
}

function Standings({ players }: { players: SharedGame['players'] }) {
  const sorted = [...players].sort((a, b) => b.coins - a.coins)
  const ranks = computeRanks(sorted.map((p) => p.coins))
  const tiedCount = (rank: number) => ranks.filter((r) => r === rank).length

  return (
    <div className="space-y-2">
      {sorted.map((p, i) => {
        const r = ranks[i]
        const tied = tiedCount(r) > 1
        const isTopRank = r === 1
        return (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl p-2"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(74,222,128,0.1)',
            }}
          >
            <span
              className="min-w-[28px] h-7 px-1.5 rounded-full flex items-center justify-center text-xs font-extrabold tabular-nums"
              style={{
                background: isTopRank
                  ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                  : tied
                    ? 'rgba(94,234,212,0.15)'
                    : 'rgba(74,222,128,0.12)',
                color: isTopRank ? '#451a03' : tied ? '#5eead4' : '#86efac',
              }}
              title={tied ? 'Tied with another player' : undefined}
            >
              {tied ? `T${r}` : r}
            </span>
            <AvatarSvg avatar={{ color: p.color }} size={32} initial={p.handle} />
            <div className="flex-1">
              <div className="font-bold text-white text-sm">{p.handle}</div>
              <div className="fg-sub text-[10px]">
                {p.hacks} hacks · {p.caught} caught
              </div>
            </div>
            <div className="font-extrabold tabular-nums" style={{ color: '#fbbf24' }}>
              {p.coins}c
            </div>
          </div>
        )
      })}
    </div>
  )
}
