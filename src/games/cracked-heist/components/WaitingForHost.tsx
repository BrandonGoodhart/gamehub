import { motion } from 'framer-motion'
import type { RoomState } from '../types'

interface Props {
  state: RoomState
  detail?: string
}

export default function WaitingForHost({ state, detail }: Props) {
  const host = state.players.find((p) => p.id === state.hostId)
  const hostName = host?.handle ?? 'the host'
  const others = state.players.filter((p) => p.id !== state.hostId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto fg-panel fg-panel-lg text-center space-y-4"
    >
      <div className="fg-lbl">multiplayer</div>
      <h1 className="fg-display text-3xl">Waiting for {hostName}…</h1>
      <p className="fg-sub text-sm">
        {detail ?? "The host is getting the game ready. You'll start as soon as they hit play."}
      </p>

      <div className="flex justify-center gap-2 py-2" aria-label="loading">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.16 }}
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#86efac',
              display: 'inline-block',
            }}
          />
        ))}
      </div>

      <div
        className="rounded-2xl p-3 mt-2 text-left"
        style={{
          background: 'rgba(74,222,128,0.06)',
          border: '1px solid rgba(74,222,128,0.18)',
        }}
      >
        <div className="fg-lbl mb-2">players in this room</div>
        <ul className="space-y-1">
          {state.players.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 text-white text-sm font-semibold"
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: p.avatar.color,
                }}
              />
              <span>{p.handle}</span>
              {p.id === state.hostId && (
                <span className="fg-lbl" style={{ color: '#fbbf24' }}>
                  host
                </span>
              )}
            </li>
          ))}
        </ul>
        {others.length === 0 && state.hostId !== '' && (
          <p className="fg-sub text-[11px] mt-2 italic">You're the only joiner so far.</p>
        )}
      </div>
    </motion.div>
  )
}
