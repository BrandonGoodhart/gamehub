import { useState } from 'react'
import { motion } from 'framer-motion'
import type { SharedGame } from '../types'
import AvatarSvg from './AvatarSvg'

interface Props {
  game: SharedGame | null
  code: string
  onBack: () => void
}

const TONE_COLOR: Record<string, string> = {
  good: '#86efac',
  bad: '#fda4af',
  neutral: 'rgba(220,252,231,0.7)',
  system: '#5eead4',
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
          Game Replay
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
            <div className="space-y-2">
              {[...game.players]
                .sort((a, b) => b.coins - a.coins)
                .map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-2xl p-2"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(74,222,128,0.1)',
                    }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold"
                      style={{
                        background:
                          i === 0
                            ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                            : 'rgba(74,222,128,0.12)',
                        color: i === 0 ? '#451a03' : '#86efac',
                      }}
                    >
                      {i + 1}
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
                ))}
            </div>
          </div>

          <div className="fg-panel p-4">
            <div className="fg-lbl mb-3">live feed</div>
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {(game.log ?? []).map((e) => {
                const color = TONE_COLOR[e.tone] ?? '#fff'
                return (
                  <div key={e.id} className="flex items-start gap-2 text-xs leading-snug">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                    />
                    <span className="font-semibold" style={{ color }}>
                      {e.text}
                    </span>
                  </div>
                )
              })}
              {(game.log ?? []).length === 0 && (
                <div className="fg-sub text-xs italic">No events recorded.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
