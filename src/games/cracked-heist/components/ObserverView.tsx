import { motion, AnimatePresence } from 'framer-motion'
import type { RoomState } from '../types'
import AvatarSvg from './AvatarSvg'
import EventFeed from './EventFeed'

interface Props {
  state: RoomState
  onEndGame: () => void
}

// Standard competition ranking: tied players share a rank, next rank skips.
function computeRanks(coins: number[]): number[] {
  const ranks: number[] = []
  for (let i = 0; i < coins.length; i++) {
    if (i === 0) ranks.push(1)
    else if (coins[i] === coins[i - 1]) ranks.push(ranks[i - 1])
    else ranks.push(i + 1)
  }
  return ranks
}

function FinishFlagIcon({ size = 18 }: { size?: number }) {
  const cell = 4
  const rows = 3
  const cols = 4
  const flagX = 6
  const flagY = 4
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <line x1={5} y1={3} x2={5} y2={21} stroke="#111" strokeWidth={1.6} strokeLinecap="round" />
      <rect x={flagX} y={flagY} width={cols * cell} height={rows * cell} fill="#fff" />
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          if ((r + c) % 2 !== 0) return null
          return (
            <rect
              key={`${r}-${c}`}
              x={flagX + c * cell}
              y={flagY + r * cell}
              width={cell}
              height={cell}
              fill="#111"
            />
          )
        }),
      )}
      <rect x={flagX} y={flagY} width={cols * cell} height={rows * cell} fill="none" stroke="#111" strokeWidth={1} />
    </svg>
  )
}

export default function ObserverView({ state, onEndGame }: Props) {
  const sorted = [...state.players].sort((a, b) => b.coins - a.coins)
  const ranks = computeRanks(sorted.map((p) => p.coins))
  const remaining = state.timeLeft
  const danger = remaining <= 10
  const warn = remaining <= 20 && !danger
  const timeLabel = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`

  return (
    <div className="max-w-5xl mx-auto w-full space-y-4 pb-5">
      {/* Header / HUD-ish bar */}
      <div className="fg-panel px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="rounded-full px-3 py-1 text-xs font-extrabold tracking-wider"
            style={{
              background: 'rgba(94,234,212,0.12)',
              border: '1px solid rgba(94,234,212,0.4)',
              color: '#5eead4',
            }}
          >
            OBSERVING
          </div>
          <div className="flex flex-col">
            <div className="fg-lbl text-[9px]">room</div>
            <div className="fg-code text-sm" style={{ letterSpacing: '0.2em' }}>
              {state.code}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="rounded-xl px-3 py-2 text-center tabular-nums"
            style={{
              background: danger
                ? 'rgba(251,113,133,0.12)'
                : 'rgba(74,222,128,0.08)',
              border: danger
                ? '1.5px solid rgba(251,113,133,0.5)'
                : '1.5px solid rgba(74,222,128,0.3)',
            }}
          >
            <div className="fg-lbl text-[9px]">time</div>
            <div
              className="font-extrabold"
              style={{
                color: danger ? '#fda4af' : warn ? '#fbbf24' : '#4ade80',
                fontSize: '1.2rem',
                lineHeight: 1.1,
              }}
            >
              {timeLabel}
            </div>
          </div>

          <button
            onClick={onEndGame}
            title="End game early"
            aria-label="End game early"
            className="flex items-center justify-center rounded-full"
            style={{
              width: 34,
              height: 34,
              background: 'rgba(255,255,255,0.92)',
              border: '1.5px solid rgba(255,255,255,0.5)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
          >
            <FinishFlagIcon size={20} />
          </button>
        </div>
      </div>

      {/* Live leaderboard + event feed side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="fg-panel p-5">
          <div className="fg-lbl mb-3">live leaderboard</div>
          <div className="space-y-2">
            <AnimatePresence>
              {sorted.map((p, i) => {
                const r = ranks[i]
                const tied = ranks.filter((x) => x === r).length > 1
                const isTop = r === 1
                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2"
                    style={{
                      background: isTop
                        ? 'rgba(251,191,36,0.08)'
                        : 'rgba(255,255,255,0.03)',
                      border: isTop
                        ? '1.5px solid rgba(251,191,36,0.45)'
                        : '1px solid rgba(74,222,128,0.10)',
                    }}
                  >
                    <span
                      className="min-w-[28px] h-7 px-1.5 rounded-full flex items-center justify-center text-xs font-extrabold tabular-nums"
                      style={{
                        background: isTop
                          ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                          : tied
                            ? 'rgba(94,234,212,0.15)'
                            : 'rgba(74,222,128,0.12)',
                        color: isTop ? '#451a03' : tied ? '#5eead4' : '#86efac',
                      }}
                    >
                      {tied ? `T${r}` : r}
                    </span>
                    <AvatarSvg avatar={p.avatar} size={28} initial={p.handle} />
                    <div className="flex-1">
                      <div className="font-bold text-white text-sm">{p.handle}</div>
                      <div className="fg-sub text-[10px]">
                        {p.hacksDone} hacks · {p.caughtCount} caught ·{' '}
                        {p.passwordsGuessed} phish
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="font-extrabold tabular-nums"
                        style={{ color: '#fbbf24', fontSize: '1.1rem' }}
                      >
                        {p.coins}c
                      </div>
                      <div className="fg-sub text-[10px]">{p.tokens}t</div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {sorted.length === 0 && (
              <div className="fg-sub text-sm text-center py-4">
                No players yet.
              </div>
            )}
          </div>
        </div>

        <div className="fg-panel p-5">
          <div className="fg-lbl mb-3">live feed</div>
          <EventFeed events={state.events} />
        </div>
      </div>

      <p className="fg-sub text-[11px] text-center">
        You're observing this game — you can't take actions. Tap the flag in
        the top-right to end the round early.
      </p>
    </div>
  )
}
