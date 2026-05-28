import { AnimatePresence, motion } from 'framer-motion'
import type { EventLog } from '../types'

const TONE_STYLES: Record<EventLog['tone'], { color: string; dot: string }> = {
  good: { color: '#86efac', dot: '#4ade80' },
  bad: { color: '#fda4af', dot: '#fb7185' },
  neutral: { color: 'rgba(220,252,231,0.7)', dot: '#5eead4' },
  system: { color: '#5eead4', dot: '#a3e635' },
}

export default function EventFeed({ events }: { events: EventLog[] }) {
  return (
    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
      <AnimatePresence initial={false}>
        {events.map((e) => {
          const s = TONE_STYLES[e.tone]
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 leading-snug text-xs"
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: s.dot, boxShadow: `0 0 6px ${s.dot}` }}
              />
              <span className="font-semibold" style={{ color: s.color }}>
                {e.text}
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
