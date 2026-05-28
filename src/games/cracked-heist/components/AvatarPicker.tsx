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
    <div className="max-w-4xl mx-auto w-full space-y-5">
      <div className="text-center">
        <div className="fg-lbl mb-2">/ build identity</div>
        <h2 className="fg-display text-[clamp(2rem,6vw,3rem)]">Make Your Hacker</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fg-panel fg-panel-lg flex flex-col items-center gap-4"
        >
          <div
            className="rounded-3xl p-3"
            style={{
              background: 'radial-gradient(circle at 50% 30%, rgba(74,222,128,.15), transparent 70%)',
            }}
          >
            <AvatarSvg avatar={avatar} size={180} />
          </div>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value.slice(0, 12))}
            placeholder="your name"
            className="fg-inp text-center text-lg font-bold"
          />
          <button onClick={() => setAvatar(randomAvatar())} className="fg-btn fg-btn-outline fg-btn-sm">
            🎲 Randomize
          </button>
        </motion.div>

        <div className="fg-panel p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          <Section title="Hair">
            <Row>
              {HAIR_STYLES.map((s) => (
                <Pill key={s} active={avatar.hairStyle === s} onClick={() => set({ hairStyle: s })}>
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

          <Section title="Skin">
            <Row>
              {SKIN_COLORS.map((c) => (
                <Swatch key={c} color={c} active={avatar.skinColor === c} onClick={() => set({ skinColor: c })} />
              ))}
            </Row>
          </Section>

          <Section title="Face">
            <Row>
              {EXPRESSIONS.map((e) => (
                <Pill key={e} active={avatar.expression === e} onClick={() => set({ expression: e })}>
                  {e}
                </Pill>
              ))}
            </Row>
          </Section>

          <Section title="Hat">
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
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        disabled={!handle.trim()}
        onClick={() => onConfirm(handle.trim(), avatar)}
        className="fg-btn fg-btn-grad"
      >
        Enter Lobby →
      </motion.button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="fg-lbl mb-2">{title}</div>
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
    <button onClick={onClick} className={`fg-pill ${active ? 'fg-pill-sel' : ''}`}>
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
      style={{
        backgroundColor: color,
        boxShadow: active ? '0 0 0 3px rgba(74,222,128,.8), 0 0 18px rgba(74,222,128,.5)' : undefined,
      }}
      className={`w-8 h-8 rounded-full border-2 transition-all ${
        active ? 'border-[var(--green-l)] scale-110' : 'border-[var(--glass-border)] hover:border-[var(--green)] hover:scale-105'
      }`}
    />
  )
}
