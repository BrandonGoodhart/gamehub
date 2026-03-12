import { motion } from 'framer-motion'
import type { Card } from '../types'
import { getSuitSymbol, getSuitColor } from '../deck'

interface PlayingCardProps {
  card?: Card
  faceDown?: boolean
  delay?: number
  small?: boolean
}

export default function PlayingCard({ card, faceDown = false, delay = 0, small = false }: PlayingCardProps) {
  const sizeClass = small ? 'w-14 h-20 text-sm' : 'w-20 h-28 text-lg'

  if (faceDown || !card) {
    return (
      <motion.div
        className={`${sizeClass} rounded-lg bg-gradient-to-br from-blue-700 to-blue-900 border-2 border-blue-500 shadow-lg flex items-center justify-center`}
        initial={{ opacity: 0, rotateY: 180 }}
        animate={{ opacity: 1, rotateY: 0 }}
        transition={{ delay, duration: 0.4 }}
      >
        <div className="text-blue-300 text-2xl font-bold opacity-50">?</div>
      </motion.div>
    )
  }

  const colorClass = getSuitColor(card.suit)
  const symbol = getSuitSymbol(card.suit)

  return (
    <motion.div
      className={`${sizeClass} rounded-lg bg-white border border-gray-300 shadow-lg flex flex-col items-center justify-center ${colorClass} font-bold`}
      initial={{ opacity: 0, rotateY: 180, scale: 0.8 }}
      animate={{ opacity: 1, rotateY: 0, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
    >
      <span className={small ? 'text-base' : 'text-xl'}>{card.rank}</span>
      <span className={small ? 'text-base' : 'text-xl'}>{symbol}</span>
    </motion.div>
  )
}
