import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Avatar } from '../types'
import { COLOR_PALETTE } from '../avatar'
import AvatarSvg from './AvatarSvg'

interface Props {
  initialHandle?: string
  initialAvatar: Avatar
  takenHandles?: string[]
  takenColors?: string[]
  onConfirm: (handle: string, avatar: Avatar) => void
  onBack?: () => void
}

export default function AvatarPicker({
  initialHandle = '',
  initialAvatar,
  takenHandles = [],
  takenColors = [],
  onConfirm,
  onBack,
}: Props) {
  const [avatar, setAvatar] = useState<Avatar>(initialAvatar)
  const [handle, setHandle] = useState(initialHandle)

  const takenHandleSet = new Set(takenHandles.map((h) => h.trim().toLowerCase()))
  const takenColorSet = new Set(takenColors.map((c) => c.toLowerCase()))
  const handleTrim = handle.trim()
  const handleTaken = handleTrim.length > 0 && takenHandleSet.has(handleTrim.toLowerCase())
  const colorTaken = takenColorSet.has(avatar.color.toLowerCase())
  const canConfirm = handleTrim.length > 0 && !handleTaken && !colorTaken

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
            style={
              handleTaken
                ? { borderColor: '#fb7185', boxShadow: '0 0 0 3px rgba(251,113,133,0.15)' }
                : undefined
            }
          />
          {handleTaken && (
            <div
              className="text-xs mt-2 text-center font-bold"
              style={{ color: '#fda4af' }}
            >
              "{handleTrim}" is already taken. Pick a different name.
            </div>
          )}
        </div>
      </motion.div>

      <div className="fg-panel p-4">
        <div className="fg-lbl mb-3">color</div>
        <div className="grid grid-cols-8 gap-2">
          {COLOR_PALETTE.map((c) => {
            const active = avatar.color === c
            const isTaken = takenColorSet.has(c.toLowerCase()) && !active
            return (
              <button
                key={c}
                onClick={() => {
                  if (!isTaken) setAvatar({ color: c })
                }}
                disabled={isTaken}
                title={isTaken ? 'Someone already picked this color' : undefined}
                style={{
                  backgroundColor: isTaken ? '#3f3f46' : c,
                  boxShadow: active
                    ? `0 0 0 3px rgba(255,255,255,0.9), 0 0 16px ${c}aa`
                    : isTaken
                      ? 'none'
                      : `0 2px 6px ${c}44`,
                  opacity: isTaken ? 0.45 : 1,
                  cursor: isTaken ? 'not-allowed' : 'pointer',
                }}
                className={`aspect-square rounded-xl border-2 transition-transform ${
                  active
                    ? 'border-white scale-110'
                    : isTaken
                      ? 'border-transparent'
                      : 'border-transparent hover:scale-110'
                }`}
                aria-label={`color ${c}${isTaken ? ' (taken)' : ''}`}
              />
            )
          })}
        </div>
        {colorTaken && (
          <div
            className="text-xs mt-3 text-center font-bold"
            style={{ color: '#fda4af' }}
          >
            That color is already taken. Pick a different one.
          </div>
        )}
      </div>

      <motion.button
        whileHover={canConfirm ? { y: -2 } : {}}
        whileTap={canConfirm ? { scale: 0.97 } : {}}
        disabled={!canConfirm}
        onClick={() => canConfirm && onConfirm(handleTrim, avatar)}
        className="fg-btn fg-btn-grad"
      >
        Enter Lobby →
      </motion.button>
    </div>
  )
}
