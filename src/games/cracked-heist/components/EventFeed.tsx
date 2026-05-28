import { AnimatePresence, motion } from 'framer-motion'
import type { EventLog } from '../types'

const TONE_COLOR: Record<EventLog['tone'], string> = {
  good: 'text-emerald-300',
  bad: 'text-red-400',
  neutral: 'text-emerald-200/70',
  system: 'text-cyan-300',
}

export default function EventFeed({ events }: { events: EventLog[] }) {
  return (
    <div className="font-mono text-xs space-y-1 max-h-80 overflow-y-auto pr-1">
      <AnimatePresence initial={false}>
        {events.map((e) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className={`${TONE_COLOR[e.tone]} leading-snug`}
          >
            <span className="text-emerald-700/60">[{new Date(e.ts).toTimeString().slice(0, 8)}]</span>{' '}
            {e.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
