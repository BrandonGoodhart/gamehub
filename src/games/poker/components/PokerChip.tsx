import { motion } from 'framer-motion'
import type { ChipDenomination } from '../types'

interface PokerChipProps {
  chip: ChipDenomination
  count?: number
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

export default function PokerChip({ chip, count, size = 'md', onClick }: PokerChipProps) {
  const sizes = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-12 h-12 text-xs',
    lg: 'w-16 h-16 text-sm',
  }

  const borderColor = chip.color === 'white' ? '#9ca3af' : chip.hex
  const textColor = chip.color === 'white' || chip.color === 'green' ? '#111' : '#fff'

  return (
    <motion.button
      className={`${sizes[size]} rounded-full relative font-bold flex items-center justify-center cursor-pointer select-none`}
      style={{
        backgroundColor: chip.hex,
        color: textColor,
        border: `3px dashed ${chip.color === 'black' ? '#6b7280' : borderColor}`,
        boxShadow: `0 2px 8px ${chip.hex}44, inset 0 1px 2px rgba(255,255,255,0.2)`,
      }}
      onClick={onClick}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      ${chip.value}
      {count !== undefined && count > 0 && (
        <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {count}
        </span>
      )}
    </motion.button>
  )
}
