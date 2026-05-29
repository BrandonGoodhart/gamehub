import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pickN } from '../utils'

interface Props {
  hackCost: number
  tokens: number
  onHack: (gainedCoins: number) => void
  onClose: () => void
}

const VALUES = [3, 5, 8, 10, 12, 15, 18, 20]

export default function ComputerPicker({ hackCost, tokens, onHack, onClose }: Props) {
  const values = useMemo(() => pickN(VALUES, 3), [])
  const [revealed, setRevealed] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const canHack = tokens >= hackCost

  function pick(i: number) {
    if (picked !== null) return
    setPicked(i)
    setTimeout(() => onHack(values[i]), 1200)
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="fg-sub text-sm">
          Three closed computers. Pick one to crack and win the coins inside.
          {!revealed && canHack && (
            <>
              {' '}
              You have <span className="text-[#fbbf24] font-extrabold">{tokens}</span> tokens — spend{' '}
              <span className="text-[#fbbf24] font-extrabold">{hackCost}</span> to reveal what's inside first.
            </>
          )}
          {!revealed && !canHack && (
            <>
              {' '}
              You don't have enough tokens to peek (need {hackCost}). Pick blind!
            </>
          )}
          {revealed && <> Values revealed. Pick the best one.</>}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {values.map((v, i) => {
          const isPicked = picked === i
          return (
            <motion.button
              key={i}
              whileHover={picked === null ? { y: -4 } : {}}
              whileTap={{ scale: 0.96 }}
              onClick={() => pick(i)}
              disabled={picked !== null}
              className="rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all"
              style={{
                background:
                  picked === i
                    ? 'linear-gradient(135deg, #4ade80, #a3e635)'
                    : 'rgba(255,255,255,0.04)',
                border: '2px solid rgba(74,222,128,0.3)',
                minHeight: 120,
                cursor: picked !== null ? 'default' : 'pointer',
                color: picked === i ? '#052e16' : '#fff',
                boxShadow: picked === i ? '0 0 30px rgba(74,222,128,0.7)' : 'none',
              }}
            >
              <div
                className="font-extrabold"
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.15em',
                  opacity: 0.7,
                  marginBottom: 8,
                }}
              >
                PC-{i + 1}
              </div>
              <AnimatePresence mode="wait">
                {revealed || isPicked ? (
                  <motion.div
                    key="val"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-extrabold"
                    style={{ fontSize: '1.8rem' }}
                  >
                    {v}c
                  </motion.div>
                ) : (
                  <motion.div
                    key="locked"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-extrabold"
                    style={{ fontSize: '1.4rem', letterSpacing: '0.2em', opacity: 0.4 }}
                  >
                    ???
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>

      <div className="flex gap-2">
        <button onClick={onClose} className="fg-back flex-1 justify-center" disabled={picked !== null}>
          Cancel
        </button>
        {!revealed && (
          <button
            onClick={() => setRevealed(true)}
            disabled={!canHack || picked !== null}
            className="fg-btn fg-btn-grad"
            style={{
              flex: 1,
              padding: '14px 20px',
              fontSize: '0.95rem',
              opacity: canHack && picked === null ? 1 : 0.5,
            }}
          >
            Hack ({hackCost} tokens)
          </button>
        )}
      </div>
    </div>
  )
}
