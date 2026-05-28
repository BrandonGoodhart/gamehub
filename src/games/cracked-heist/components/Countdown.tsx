import { AnimatePresence, motion } from 'framer-motion'

export default function Countdown({ value }: { value: number }) {
  const display = value > 0 ? String(value) : 'GO'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
         style={{ background: 'rgba(5,14,8,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={display}
          initial={{ scale: 2.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fg-cdown-num"
        >
          {display}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
