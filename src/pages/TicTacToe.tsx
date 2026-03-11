import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router'

type SquareValue = 'X' | 'O' | null

function calculateWinner(squares: SquareValue[]): { winner: 'X' | 'O'; line: number[] } | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ]
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a]!, line: [a, b, c] }
    }
  }
  return null
}

function Square({
  value,
  onClick,
  isWinning,
  index,
}: {
  value: SquareValue
  onClick: () => void
  isWinning: boolean
  index: number
}) {
  return (
    <motion.button
      className={`aspect-square rounded-xl text-4xl sm:text-5xl font-bold cursor-pointer transition-colors ${
        isWinning
          ? 'bg-purple-600/30 border-2 border-purple-400'
          : 'bg-gray-800 border-2 border-gray-700 hover:border-gray-500'
      }`}
      onClick={onClick}
      whileHover={{ scale: value ? 1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
    >
      <AnimatePresence mode="wait">
        {value && (
          <motion.span
            key={value}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className={value === 'X' ? 'text-purple-400' : 'text-pink-400'}
          >
            {value}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export default function TicTacToe() {
  const [squares, setSquares] = useState<SquareValue[]>(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState(true)

  const result = calculateWinner(squares)
  const isDraw = !result && squares.every((s) => s !== null)

  const handleClick = useCallback(
    (i: number) => {
      if (squares[i] || result) return
      const next = squares.slice()
      next[i] = xIsNext ? 'X' : 'O'
      setSquares(next)
      setXIsNext(!xIsNext)
    },
    [squares, xIsNext, result],
  )

  const reset = () => {
    setSquares(Array(9).fill(null))
    setXIsNext(true)
  }

  let status: string
  if (result) {
    status = `${result.winner} wins!`
  } else if (isDraw) {
    status = "It's a draw!"
  } else {
    status = `Next: ${xIsNext ? 'X' : 'O'}`
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 gap-8">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <motion.h1
          className="text-4xl font-bold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Tic Tac Toe
        </motion.h1>
      </div>

      <motion.p
        className="text-xl text-gray-300 font-semibold"
        key={status}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {status}
      </motion.p>

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {squares.map((value, i) => (
          <Square
            key={i}
            value={value}
            onClick={() => handleClick(i)}
            isWinning={result?.line.includes(i) ?? false}
            index={i}
          />
        ))}
      </div>

      <motion.button
        className="px-6 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white transition-colors cursor-pointer"
        onClick={reset}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Reset
      </motion.button>
    </div>
  )
}
