import { motion } from 'framer-motion'
import { Link } from 'react-router'

const games = [
  {
    title: 'Tic Tac Toe',
    description: 'Classic X and O game for two players',
    path: '/tic-tac-toe',
    emoji: '#',
  },
  {
    title: 'Texas Hold\'em',
    description: 'Poker with up to 3 players and colored chips',
    path: '/poker',
    emoji: '$',
  },
]

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <motion.h1
        className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        GameHub
      </motion.h1>
      <motion.p
        className="text-xl text-gray-400 mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        A collection of games to play
      </motion.p>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {games.map((game) => (
          <Link key={game.path} to={game.path}>
            <motion.div
              className="p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-purple-500/50 transition-colors cursor-pointer group"
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-4xl mb-3 font-mono text-purple-400">{game.emoji}</div>
              <h2 className="text-xl font-semibold mb-1 group-hover:text-purple-300 transition-colors">
                {game.title}
              </h2>
              <p className="text-gray-500 text-sm">{game.description}</p>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  )
}
