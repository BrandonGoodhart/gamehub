import { useState } from 'react'
import type { SoundDef } from './sounds'
import { playSound } from './sounds'

// Lighten / darken a hex color by a percentage for building the 3D gradient.
function shade(hex: string, percent: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, Math.max(0, ((n >> 16) & 0xff) + Math.round(255 * percent)))
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + Math.round(255 * percent)))
  const b = Math.min(255, Math.max(0, (n & 0xff) + Math.round(255 * percent)))
  return `rgb(${r}, ${g}, ${b})`
}

export default function BuzzerButton({ sound }: { sound: SoundDef }) {
  const [pressed, setPressed] = useState(false)
  const base = sound.color

  const press = () => {
    setPressed(true)
    playSound(sound.id)
  }
  const release = () => setPressed(false)

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Housing base: the dark platform the dome sits on. */}
      <div
        className="relative rounded-full"
        style={{
          width: 132,
          height: 132,
          background: 'radial-gradient(circle at 50% 35%, #3a3a40 0%, #18181b 70%, #0a0a0b 100%)',
          boxShadow:
            'inset 0 4px 8px rgba(255,255,255,0.06), inset 0 -6px 12px rgba(0,0,0,0.7), 0 10px 20px rgba(0,0,0,0.55)',
          padding: 12,
        }}
      >
        <button
          type="button"
          aria-label={`Play ${sound.label} sound`}
          onPointerDown={press}
          onPointerUp={release}
          onPointerLeave={release}
          onPointerCancel={release}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (!pressed) press()
            }
          }}
          onKeyUp={(e) => {
            if (e.key === 'Enter' || e.key === ' ') release()
          }}
          className="relative w-full h-full rounded-full cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          style={{
            background: `radial-gradient(circle at 38% 28%, ${shade(base, 0.35)} 0%, ${base} 42%, ${shade(
              base,
              -0.28,
            )} 100%)`,
            boxShadow: pressed
              ? `inset 0 3px 10px rgba(0,0,0,0.5), 0 1px 0 ${shade(base, -0.4)}`
              : `inset 0 3px 6px ${shade(base, 0.45)}, inset 0 -8px 14px ${shade(
                  base,
                  -0.35,
                )}, 0 8px 0 ${shade(base, -0.42)}, 0 14px 18px rgba(0,0,0,0.5)`,
            transform: pressed ? 'translateY(6px)' : 'translateY(0)',
            transition: 'transform 80ms ease, box-shadow 80ms ease',
          }}
        >
          {/* Glossy top highlight for the plastic-dome sheen. */}
          <span
            className="pointer-events-none absolute rounded-full"
            style={{
              top: '12%',
              left: '20%',
              width: '52%',
              height: '34%',
              background:
                'radial-gradient(ellipse at center, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 70%)',
              filter: 'blur(1px)',
              opacity: pressed ? 0.4 : 0.85,
            }}
          />
          {sound.emoji && (
            <span
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              style={{ fontSize: 34, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))' }}
            >
              {sound.emoji}
            </span>
          )}
        </button>
      </div>
      <span className="text-sm font-semibold text-gray-200 tracking-wide text-center">
        {sound.label}
      </span>
    </div>
  )
}
