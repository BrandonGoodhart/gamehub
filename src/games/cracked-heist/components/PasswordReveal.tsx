import { useEffect, useState } from 'react'

interface Props {
  password: string
  size?: 'sm' | 'md'
}

export default function PasswordReveal({ password, size = 'sm' }: Props) {
  const [shown, setShown] = useState(false)

  // Auto-hide after 4 seconds so it doesn't stay exposed if someone walks up
  useEffect(() => {
    if (!shown) return
    const t = setTimeout(() => setShown(false), 4000)
    return () => clearTimeout(t)
  }, [shown])

  const masked = '•'.repeat(Math.max(8, password.length || 0))
  const padding = size === 'md' ? '6px 12px' : '4px 10px'
  const fontSize = size === 'md' ? '0.95rem' : '0.78rem'

  return (
    <button
      onClick={() => setShown((s) => !s)}
      className="font-extrabold rounded-full transition-all"
      style={{
        background: shown ? 'rgba(74,222,128,0.18)' : 'rgba(255,255,255,0.06)',
        color: shown ? '#86efac' : 'rgba(255,255,255,0.55)',
        fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '0.06em',
        padding,
        fontSize,
        border: shown ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(255,255,255,0.12)',
        cursor: 'pointer',
        userSelect: shown ? 'text' : 'none',
      }}
      title={shown ? 'Tap to hide' : 'Tap to reveal'}
    >
      {shown ? password || '—' : masked}
    </button>
  )
}
