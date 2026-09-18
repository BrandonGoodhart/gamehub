import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { HANDLES } from '../words'
import { pickN } from '../utils'

interface Props {
  onPick: (handle: string) => void
}

export default function WordPick({ onPick }: Props) {
  const choices = useMemo(() => pickN(HANDLES, 3), [])
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <div className="text-emerald-500 font-mono text-sm mb-2">// identity_required</div>
        <h2 className="text-3xl md:text-4xl font-mono font-bold text-emerald-300 tracking-wider">
          CHOOSE YOUR HANDLE
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {choices.map((h, i) => (
          <motion.button
            key={h}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPick(h)}
            className="px-6 py-10 rounded-lg bg-black/60 border-2 border-emerald-700 hover:border-emerald-300 hover:bg-emerald-900/30 font-mono text-2xl font-bold text-emerald-200 hover:text-emerald-100 transition-all shadow-[0_0_15px_rgba(50,220,120,0.2)] hover:shadow-[0_0_25px_rgba(50,220,120,0.6)] tracking-widest"
          >
            {h}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
