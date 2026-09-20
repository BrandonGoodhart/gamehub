import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import type { RoomState } from '../types'
import AvatarSvg from './AvatarSvg'

interface Props {
  state: RoomState
  meId: string
  onReset: () => void
}

export default function BRChampion({ state, meId, onReset }: Props) {
  const championId = state.br?.championId ?? null
  const champion = state.players.find((p) => p.id === championId)
  const runnerUp = state.players
    .filter((p) => p.id !== championId)
    .sort((a, b) => b.brMatchesWon - a.brMatchesWon)[0]
  const iAmChampion = meId === championId

  useEffect(() => {
    if (champion) {
      // Confetti storm for the champion
      confetti({
        particleCount: 240,
        spread: 100,
        startVelocity: 55,
        origin: { y: 0.5, x: 0.5 },
        colors: ['#fbbf24', '#f97316', '#dc2626', '#f43f5e', '#fff7ed'],
        scalar: 1.4,
      })
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 130,
          origin: { y: 0.6, x: 0.2 },
          colors: ['#fbbf24', '#f97316', '#dc2626'],
        })
      }, 300)
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 130,
          origin: { y: 0.6, x: 0.8 },
          colors: ['#fbbf24', '#f97316', '#dc2626'],
        })
      }, 600)
    }
  }, [champion])

  const sorted = [...state.players].sort((a, b) => b.brMatchesWon - a.brMatchesWon)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto fg-panel fg-panel-lg text-center relative overflow-hidden"
    >
      <div className="fg-lbl mb-2" style={{ color: '#fbbf24' }}>
        battle royale · winner
      </div>
      {champion ? (
        <>
          <motion.h2
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 14 }}
            className="fg-display text-5xl mb-4"
          >
            {iAmChampion ? 'You Won!' : `${champion.handle} wins!`}
          </motion.h2>
          <div
            className="flex items-center justify-center gap-3 my-5 rounded-3xl px-5 py-4 mx-auto"
            style={{
              width: 'fit-content',
              background:
                'linear-gradient(135deg, rgba(251,191,36,0.14), rgba(249,115,22,0.14))',
              border: '2px solid rgba(251,191,36,0.5)',
              boxShadow: '0 10px 40px rgba(251,191,36,0.25)',
            }}
          >
            <AvatarSvg avatar={champion.avatar} size={72} initial={champion.handle} />
            <div className="text-left">
              <div className="fg-lbl" style={{ color: '#fbbf24' }}>
                champion
              </div>
              <div className="text-white font-extrabold text-2xl">{champion.handle}</div>
              <div className="text-xs font-bold" style={{ color: '#fbbf24' }}>
                {champion.brMatchesWon} rounds survived
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <h2 className="fg-display text-4xl mb-4">Nobody survived!</h2>
          <p className="fg-sub text-sm mb-4">
            Every remaining player got the question wrong at the same time. Try
            again with easier questions or more players.
          </p>
        </>
      )}

      <div className="fg-lbl mb-2">final standings</div>
      <div className="space-y-1.5 mb-5">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center justify-between px-3 py-1.5 rounded-xl"
            style={{
              background:
                p.id === championId
                  ? 'rgba(251,191,36,0.10)'
                  : p.id === meId
                    ? 'rgba(249,115,22,0.08)'
                    : 'rgba(255,255,255,0.03)',
              border:
                p.id === championId
                  ? '1.5px solid rgba(251,191,36,0.5)'
                  : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-8 text-right font-extrabold text-sm tabular-nums"
                style={{ color: i === 0 ? '#fbbf24' : 'rgba(255,255,255,0.55)' }}
              >
                {i + 1}.
              </span>
              <AvatarSvg avatar={p.avatar} size={24} initial={p.handle} />
              <span className="font-bold text-white text-sm">
                {p.handle}
                {p.id === championId && (
                  <span
                    className="ml-2 text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ color: '#fbbf24' }}
                  >
                    winner
                  </span>
                )}
              </span>
            </div>
            <span
              className="font-extrabold text-sm tabular-nums"
              style={{ color: '#f97316' }}
            >
              {p.brMatchesWon}R
            </span>
          </div>
        ))}
      </div>

      {runnerUp && !iAmChampion && meId !== runnerUp.id && (
        <p className="fg-sub text-xs mb-3">
          Runner-up: {runnerUp.handle} ({runnerUp.brMatchesWon} rounds)
        </p>
      )}

      <button onClick={onReset} className="fg-btn fg-btn-grad">
        New Game →
      </button>
    </motion.div>
  )
}
