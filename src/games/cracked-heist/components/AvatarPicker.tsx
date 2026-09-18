import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Avatar } from '../types'
import { COLOR_PALETTE } from '../avatar'
import AvatarSvg from './AvatarSvg'

interface Props {
  initialHandle?: string
  initialAvatar: Avatar
  onConfirm: (handle: string, avatar: Avatar) => void
  onBack?: () => void
}

export default function AvatarPicker({
  initialHandle = '',
  initialAvatar,
  onConfirm,
  onBack,
}: Props) {
  const [avatar, setAvatar] = useState<Avatar>(initialAvatar)
  const [handle, setHandle] = useState(initialHandle)

  return (
    <div className="max-w-[440px] mx-auto w-full space-y-5 pb-5">
      {onBack && (
        <div className="flex">
          <button onClick={onBack} className="fg-back">
            ← Back
          </button>
        </div>
      )}

      <div className="text-center">
        <h1
          className="fg-display"
          style={{ fontSize: 'clamp(2rem, 7vw, 3rem)', padding: '0 8px' }}
        >
          Pick a Color
        </h1>
        <p className="fg-sub text-xs mt-1">name yourself and pick a color</p>
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fg-panel fg-panel-lg flex flex-col items-center gap-4"
      >
        <div
          className="rounded-3xl p-3"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${avatar.color}33, transparent 70%)`,
          }}
        >
          <AvatarSvg avatar={avatar} size={140} initial={handle || '?'} />
        </div>
        <div className="w-full">
          <div className="fg-lbl text-center mb-2">your name</div>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value.slice(0, 12))}
            placeholder="Your name"
            className="fg-name-input"
          />
        </div>
      </motion.div>

      <div className="fg-panel p-4">
        <div className="fg-lbl mb-3">color</div>
        <div className="grid grid-cols-8 gap-2">
          {COLOR_PALETTE.map((c) => {
            const active = avatar.color === c
            return (
              <button
                key={c}
                onClick={() => setAvatar({ color: c })}
                style={{
                  backgroundColor: c,
                  boxShadow: active
                    ? `0 0 0 3px rgba(255,255,255,0.9), 0 0 16px ${c}aa`
                    : `0 2px 6px ${c}44`,
                }}
                className={`aspect-square rounded-xl border-2 transition-transform ${
                  active
                    ? 'border-white scale-110'
                    : 'border-transparent hover:scale-110'
                }`}
                aria-label={`color ${c}`}
              />
            )
          })}
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
