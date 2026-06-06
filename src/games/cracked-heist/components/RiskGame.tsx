import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RISK_COST, RISK_OUTCOMES, type RiskOutcome } from '../types'

interface Props {
  coins: number
  onClose: () => void
  onResult: (outcome: RiskOutcome) => void
}

const LABEL: Record<RiskOutcome, string> = {
  x2: '×2',
  x3: '×3',
  half: '÷2',
  plus5: '+5',
  plus10: '+10',
  minus5: '−5',
  minus10: '−10',
}

const TONE: Record<RiskOutcome, { color: string; bg: string; border: string; good: boolean }> = {
  x3:      { color: '#fde047', bg: 'rgba(253,224,71,0.12)',   border: 'rgba(253,224,71,0.55)',   good: true  },
  x2:      { color: '#86efac', bg: 'rgba(134,239,172,0.10)',  border: 'rgba(134,239,172,0.45)',  good: true  },
  plus10:  { color: '#86efac', bg: 'rgba(134,239,172,0.10)',  border: 'rgba(134,239,172,0.45)',  good: true  },
  plus5:   { color: '#86efac', bg: 'rgba(134,239,172,0.10)',  border: 'rgba(134,239,172,0.45)',  good: true  },
  half:    { color: '#fda4af', bg: 'rgba(253,164,175,0.10)',  border: 'rgba(253,164,175,0.45)',  good: false },
  minus5:  { color: '#fda4af', bg: 'rgba(253,164,175,0.10)',  border: 'rgba(253,164,175,0.45)',  good: false },
  minus10: { color: '#fda4af', bg: 'rgba(253,164,175,0.10)',  border: 'rgba(253,164,175,0.45)',  good: false },
}

function computePreview(coins: number, outcome: RiskOutcome): number {
  const after = Math.max(0, coins - RISK_COST)
  switch (outcome) {
    case 'x2':      return after * 2
    case 'x3':      return after * 3
    case 'half':    return Math.floor(after / 2)
    case 'plus5':   return after + 5
    case 'plus10':  return after + 10
    case 'minus5':  return Math.max(0, after - 5)
    case 'minus10': return Math.max(0, after - 10)
  }
}

export default function RiskGame({ coins, onClose, onResult }: Props) {
  const [stage, setStage] = useState<'confirm' | 'spinning' | 'result'>('confirm')
  const [final, setFinal] = useState<RiskOutcome | null>(null)
  const [tickIndex, setTickIndex] = useState(0)

  // Slot-machine cycle while spinning
  useEffect(() => {
    if (stage !== 'spinning') return
    const start = performance.now()
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      const elapsed = performance.now() - start
      // Slow down over ~2s
      const delay = 60 + Math.pow(elapsed / 2000, 2) * 350
      setTickIndex((i) => (i + 1) % RISK_OUTCOMES.length)
      if (elapsed >= 2000) {
        const picked = RISK_OUTCOMES[Math.floor(Math.random() * RISK_OUTCOMES.length)]
        setFinal(picked)
        setStage('result')
        onResult(picked)
        return
      }
      timer = setTimeout(tick, delay)
    }
    timer = setTimeout(tick, 60)
    return () => clearTimeout(timer)
  }, [stage, onResult])

  const canAfford = coins >= RISK_COST

  if (stage === 'confirm') {
    return (
      <div className="space-y-4">
        <p className="fg-sub text-sm">
          Pay <b style={{ color: '#fbbf24' }}>{RISK_COST} coins</b> to spin. The result applies to your
          coin balance after the entry fee. No tokens needed.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {RISK_OUTCOMES.map((o) => {
            const t = TONE[o]
            return (
              <div
                key={o}
                className="rounded-xl p-2 text-center font-extrabold tabular-nums"
                style={{ background: t.bg, border: `1.5px solid ${t.border}`, color: t.color }}
              >
                {LABEL[o]}
              </div>
            )
          })}
        </div>
        <button
          disabled={!canAfford}
          onClick={() => setStage('spinning')}
          className="fg-btn fg-btn-grad w-full"
          style={{ opacity: canAfford ? 1 : 0.45, cursor: canAfford ? 'pointer' : 'not-allowed' }}
        >
          {canAfford ? `Spin (−${RISK_COST}c)` : `Need ${RISK_COST} coins`}
        </button>
      </div>
    )
  }

  if (stage === 'spinning') {
    const current = RISK_OUTCOMES[tickIndex]
    const t = TONE[current]
    return (
      <div className="text-center py-8">
        <div className="fg-lbl mb-3">rolling…</div>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={tickIndex}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="mx-auto rounded-2xl px-6 py-5 inline-block"
            style={{
              background: t.bg,
              border: `2px solid ${t.border}`,
              color: t.color,
              minWidth: 160,
              fontSize: '2.5rem',
              fontWeight: 900,
            }}
          >
            {LABEL[current]}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // result stage
  if (!final) return null
  const t = TONE[final]
  const preview = computePreview(coins, final)
  return (
    <div className="text-center space-y-4">
      <div className="fg-lbl">result</div>
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 16 }}
        className="mx-auto rounded-2xl px-6 py-5 inline-block"
        style={{
          background: t.bg,
          border: `2px solid ${t.border}`,
          color: t.color,
          minWidth: 200,
          fontSize: '3rem',
          fontWeight: 900,
        }}
      >
        {LABEL[final]}
      </motion.div>
      <div
        className="rounded-xl px-4 py-3 inline-block"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(74,222,128,0.18)',
        }}
      >
        <span className="fg-sub text-xs mr-2">coins:</span>
        <span className="tabular-nums font-extrabold text-white">{coins}</span>
        <span className="fg-sub text-xs mx-2">→</span>
        <span className="tabular-nums font-extrabold" style={{ color: t.good ? '#86efac' : '#fda4af' }}>
          {preview}
        </span>
      </div>
      <button onClick={onClose} className="fg-btn fg-btn-grad w-full">
        Close
      </button>
    </div>
  )
}
