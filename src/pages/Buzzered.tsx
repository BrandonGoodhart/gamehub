import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { SOUNDS } from '../games/buzzered/sounds'
import BuzzerButton from '../games/buzzered/BuzzerButton'

export default function Buzzered() {
  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-10 gap-8">
      <div className="flex items-center gap-4 self-start max-w-5xl w-full mx-auto">
        <Link to="/" className="text-gray-400 hover:text-white transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      </div>

      <motion.h1
        className="text-6xl font-black tracking-tight bg-gradient-to-r from-rose-400 via-amber-300 to-rose-500 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Buzzered
      </motion.h1>
      <motion.p
        className="text-lg text-gray-400 -mt-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Tap a buzzer to fire off its sound effect.
      </motion.p>

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-9 max-w-5xl w-full mx-auto place-items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {SOUNDS.map((sound) => (
          <BuzzerButton key={sound.id} sound={sound} />
        ))}
      </motion.div>
    </div>
  )
}
