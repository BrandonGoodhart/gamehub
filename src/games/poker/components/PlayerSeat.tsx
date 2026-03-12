import { motion } from 'framer-motion'
import type { Player, GamePhase } from '../types'
import PlayingCard from './PlayingCard'

interface PlayerSeatProps {
  player: Player
  isActive: boolean
  phase: GamePhase
  revealCards: boolean
}

export default function PlayerSeat({ player, isActive, phase, revealCards }: PlayerSeatProps) {
  const showCards = phase !== 'setup' && player.hand.length > 0

  return (
    <motion.div
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-colors ${
        player.folded
          ? 'bg-gray-900/50 border-gray-800 opacity-50'
          : isActive
            ? 'bg-gray-800 border-purple-500 shadow-lg shadow-purple-500/20'
            : 'bg-gray-900 border-gray-700'
      }`}
      animate={isActive ? { scale: 1.02 } : { scale: 1 }}
    >
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg">{player.name}</span>
        {player.isDealer && (
          <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">D</span>
        )}
      </div>

      {/* Chips */}
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-300" />
        <span className="text-sm font-mono text-yellow-400">{player.chips}</span>
      </div>

      {/* Cards */}
      {showCards && (
        <div className="flex gap-1">
          {player.hand.map((card, i) => (
            <PlayingCard
              key={i}
              card={card}
              faceDown={!revealCards}
              delay={i * 0.1}
              small
            />
          ))}
        </div>
      )}

      {/* Current bet */}
      {player.currentBet > 0 && (
        <div className="text-sm text-purple-300 font-mono">
          Bet: ${player.currentBet}
        </div>
      )}

      {/* Status */}
      {player.folded && <span className="text-xs text-red-400 font-semibold">FOLDED</span>}
      {player.isAllIn && <span className="text-xs text-yellow-400 font-semibold">ALL IN</span>}
    </motion.div>
  )
}
