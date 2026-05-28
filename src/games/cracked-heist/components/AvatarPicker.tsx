import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Avatar } from '../types'
import {
  EXPRESSIONS,
  HAIR_COLORS,
  HAIR_STYLES,
  HATS,
  HAT_COLORS,
  SKIN_COLORS,
  randomAvatar,
} from '../avatar'
import AvatarSvg from './AvatarSvg'

interface Props {
  initialHandle?: string
  initialAvatar: Avatar
  onConfirm: (handle: string, avatar: Avatar) => void
}

export default function AvatarPicker({ initialHandle = '', initialAvatar, onConfirm }: Props) {
  const [avatar, setAvatar] = useState<Avatar>(initialAvatar)
  const [handle, setHandle] = useState(initialHandle)
  const set = (patch: Partial<Avatar>) => setAvatar((a) => ({ ...a, ...patch }))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <div className="text-emerald-500 font-mono text-sm mb-1">// build_identity</div>
        <h2 className="text-3xl md:text-4xl font-mono font-bold text-emerald-300 tracking-wider">
          MAKE YOUR HACKER
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-black/70 border-2 border-emerald-500 rounded-2xl p-5 shadow-[0_0_25px_rgba(50,220,120,0.3)] flex flex-col items-center gap-3"
        >
          <div className="relative">
            <AvatarSvg avatar={avatar} size={200} />
          </div>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value.slice(0, 12))}
            placeholder="enter_name"
            className="w-full bg-black border-2 border-emerald-700 text-emerald-200 px-3 py-2 rounded font-mono text-center text-lg tracking-wider focus:outline-none focus:border-emerald-300"
          />
          <button
            onClick={() => setAvatar(randomAvatar())}
            className="w-full py-2 rounded border border-emerald-600 hover:border-emerald-300 hover:bg-emerald-900/30 text-emerald-200 font-mono text-sm"
          >
            &gt; randomize
          </button>
        </motion.div>

        <div className="space-y-4 bg-black/60 border border-emerald-800 rounded-2xl p-4 max-h-[60vh] overflow-y-auto">
          <Section title="HAIR">
            <Row>
              {HAIR_STYLES.map((s) => (
                <Pill
                  key={s}
                  active={avatar.hairStyle === s}
                  onClick={() => set({ hairStyle: s })}
                >
                  {s}
                </Pill>
              ))}
            </Row>
            <Row>
              {HAIR_COLORS.map((c) => (
                <Swatch key={c} color={c} active={avatar.hairColor === c} onClick={() => set({ hairColor: c })} />
              ))}
            </Row>
          </Section>

          <Section title="SKIN">
            <Row>
              {SKIN_COLORS.map((c) => (
                <Swatch key={c} color={c} active={avatar.skinColor === c} onClick={() => set({ skinColor: c })} />
              ))}
            </Row>
          </Section>

          <Section title="FACE">
            <Row>
              {EXPRESSIONS.map((e) => (
                <Pill key={e} active={avatar.expression === e} onClick={() => set({ expression: e })}>
                  {e}
                </Pill>
              ))}
            </Row>
          </Section>

          <Section title="HAT">
            <Row>
              {HATS.map((h) => (
                <Pill key={h} active={avatar.hat === h} onClick={() => set({ hat: h })}>
                  {h}
                </Pill>
              ))}
            </Row>
            <Row>
              {HAT_COLORS.map((c) => (
                <Swatch key={c} color={c} active={avatar.hatColor === c} onClick={() => set({ hatColor: c })} />
              ))}
            </Row>
          </Section>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        disabled={!handle.trim()}
        onClick={() => onConfirm(handle.trim().toUpperCase(), avatar)}
        className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-900 disabled:text-emerald-700 text-black font-mono font-bold text-xl tracking-wider shadow-[0_0_25px_rgba(50,220,120,0.5)]"
      >
        &gt; ENTER LOBBY_
      </motion.button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-emerald-500 font-mono text-xs mb-2">/* {title} */</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full font-mono text-xs border transition-all ${
        active
          ? 'border-emerald-300 bg-emerald-500/30 text-emerald-100 shadow-[0_0_8px_rgba(50,220,120,0.6)]'
          : 'border-emerald-800 text-emerald-300/70 hover:border-emerald-500 hover:text-emerald-200'
      }`}
    >
      {children}
    </button>
  )
}

function Swatch({
  color,
  active,
  onClick,
}: {
  color: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{ backgroundColor: color }}
      className={`w-8 h-8 rounded-full border-2 transition-all ${
        active
          ? 'border-emerald-200 scale-110 shadow-[0_0_10px_rgba(50,220,120,0.8)]'
          : 'border-emerald-800 hover:border-emerald-400 hover:scale-105'
      }`}
    />
  )
}
