import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Player } from '../types'

interface Props {
  target: Player
  onResult: (correct: boolean) => void
}

function buildOptions(target: Player): string[] {
  const base = (target.passwordOptions && target.passwordOptions.length === 3)
    ? [...target.passwordOptions]
    : [target.password, target.password + '_a', target.password + '_b']
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[base[i], base[j]] = [base[j], base[i]]
  }
  return base
}

export default function PasswordPicker({ target, onResult }: Props) {
  const options = useMemo(() => buildOptions(target), [target])
  const [picked, setPicked] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<'right' | 'wrong' | null>(null)

  function pick(pw: string) {
    if (picked !== null) return
    const correct = pw === target.password
    setPicked(pw)
    setOutcome(correct ? 'right' : 'wrong')
    setTimeout(() => onResult(correct), 1300)
  }

  return (
    <div className="space-y-4">
      <div className="text-sm">
        <span className="fg-sub">Target:</span>{' '}
        <span className="font-extrabold text-[var(--green-l)]">{target.handle}</span>
      </div>
      <div className="fg-sub text-xs">Pick the right password to crack their wallet:</div>
      <div className="space-y-2">
        {options.map((opt) => {
          const isPicked = picked === opt
          const showResult = picked !== null && isPicked
          return (
            <motion.button
              key={opt}
              whileHover={picked === null ? { x: 4 } : {}}
              whileTap={picked === null ? { scale: 0.97 } : {}}
              onClick={() => pick(opt)}
              disabled={picked !== null}
              className="w-full text-left p-4 rounded-2xl border font-bold transition-all backdrop-blur-md"
              style={{
                borderColor:
                  showResult && outcome === 'right'
                    ? '#86efac'
                    : showResult && outcome === 'wrong'
                      ? '#fda4af'
                      : 'rgba(163,230,53,0.3)',
                background:
                  showResult && outcome === 'right'
                    ? 'rgba(74,222,128,0.18)'
                    : showResult && outcome === 'wrong'
                      ? 'rgba(251,113,133,0.18)'
                      : 'rgba(163,230,53,0.05)',
                color:
                  showResult && outcome === 'right'
                    ? '#86efac'
                    : showResult && outcome === 'wrong'
                      ? '#fda4af'
                      : '#d9f99d',
                opacity: picked !== null && !isPicked ? 0.4 : 1,
              }}
            >
              <span className="mr-2 text-[var(--lime)]">$</span>
              <span
                className="tracking-wider"
                style={{ fontFamily: 'JetBrains Mono, SF Mono, ui-monospace, monospace' }}
              >
                {opt}
              </span>
            </motion.button>
          )
        })}
      </div>
      <AnimatePresence>
        {outcome && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl p-3 text-center font-extrabold"
            style={{
              background:
                outcome === 'right'
                  ? 'rgba(74,222,128,0.15)'
                  : 'rgba(251,113,133,0.15)',
              border:
                outcome === 'right'
                  ? '2px solid rgba(74,222,128,0.5)'
                  : '2px solid rgba(251,113,133,0.5)',
              color: outcome === 'right' ? '#86efac' : '#fda4af',
              fontSize: '1.05rem',
            }}
          >
            {outcome === 'right' ? 'PASSWORD CRACKED' : 'WRONG PASSWORD'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
