import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Player } from '../types'
import { pickN } from '../utils'

interface Props {
  target: Player
  onGuess: (guess: string) => void
}

const DECOYS = ['hunter2', 'qwerty', 'iloveu', 'abc123', 'letmein', 'p@ss', 'dragon', 'matrix', 'admin', 'root', 'snake', 'ghost', 'pwn3d', 'kr4ken']

function buildOptions(real: string): string[] {
  const decoys = pickN(DECOYS.filter((d) => d !== real), 2)
  const all = [...decoys, real]
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  return all
}

export default function PasswordPicker({ target, onGuess }: Props) {
  const [options] = useState(() => buildOptions(target.password))

  return (
    <div className="space-y-4">
      <div className="text-sm">
        <span className="fg-sub">Target:</span>{' '}
        <span className="font-extrabold text-[var(--green-l)]">{target.handle}</span>
      </div>
      <div className="fg-sub text-xs">Pick the right password to crack their wallet:</div>
      <div className="space-y-2">
        {options.map((opt) => (
          <motion.button
            key={opt}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onGuess(opt)}
            className="w-full text-left p-4 rounded-2xl border font-bold transition-all backdrop-blur-md"
            style={{
              borderColor: 'rgba(163,230,53,0.3)',
              background: 'rgba(163,230,53,0.05)',
              color: '#d9f99d',
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
        ))}
      </div>
    </div>
  )
}
