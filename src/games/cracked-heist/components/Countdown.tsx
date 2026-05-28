import { AnimatePresence, motion } from 'framer-motion'

export default function Countdown({ value }: { value: number }) {
  const display = value > 0 ? String(value) : 'GO'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={display}
          initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 2.4, opacity: 0 }}
          transition={{ type: 'spring', damping: 14, stiffness: 200 }}
          className={`font-mono font-bold text-[180px] md:text-[240px] tracking-wider drop-shadow-[0_0_40px_rgba(50,220,120,0.9)] ${
            display === 'GO' ? 'text-emerald-300' : 'text-emerald-200'
          }`}
        >
          {display}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
