import { useEffect, useState } from 'react'
import { MUSIC_STYLES, getStyle, setStyle, subscribe, type MusicStyle } from '../audio'

export default function MusicPicker() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<MusicStyle>(getStyle())

  useEffect(() => subscribe(() => setCurrent(getStyle())), [])

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Pick a music style"
        aria-label="Music style"
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.06)',
          color: '#86efac',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 900,
          fontFamily: 'inherit',
          backdropFilter: 'blur(10px)',
        }}
      >
        ♬
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 0,
            width: 240,
            borderRadius: 16,
            background: 'rgba(15,30,20,0.95)',
            border: '1.5px solid rgba(74,222,128,0.4)',
            backdropFilter: 'blur(12px)',
            padding: 8,
            zIndex: 400,
            boxShadow: '0 8px 28px rgba(0,0,0,0.5)',
          }}
        >
          <div
            className="fg-lbl"
            style={{ padding: '6px 8px 4px', fontSize: '0.6rem' }}
          >
            music style
          </div>
          {MUSIC_STYLES.map((s) => {
            const active = current === s.key
            return (
              <button
                key={s.key}
                onClick={() => {
                  setStyle(s.key)
                  setOpen(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 10px',
                  marginBottom: 2,
                  borderRadius: 10,
                  border: active
                    ? '1.5px solid rgba(74,222,128,0.6)'
                    : '1.5px solid transparent',
                  background: active
                    ? 'rgba(74,222,128,0.15)'
                    : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 0.12s',
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    color: active ? '#86efac' : '#fff',
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255,255,255,0.55)',
                    fontWeight: 500,
                    marginTop: 2,
                    lineHeight: 1.3,
                  }}
                >
                  {s.desc}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
