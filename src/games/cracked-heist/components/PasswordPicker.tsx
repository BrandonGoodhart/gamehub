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
    <div className="space-y-3">
      <div className="text-emerald-400 text-sm">
        Target: <span className="text-emerald-200 font-bold">{target.handle}</span>
      </div>
      <div className="text-emerald-200/70 text-xs">Pick the right password to crack their wallet:</div>
      <div className="space-y-2">
        {options.map((opt) => (
          <motion.button
            key={opt}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onGuess(opt)}
            className="w-full text-left px-4 py-3 rounded border border-fuchsia-500 bg-black/60 hover:bg-fuchsia-900/30 text-fuchsia-200 transition-colors"
          >
            <span className="text-fuchsia-500 mr-2">$</span>
            <span className="tracking-wider">{opt}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
