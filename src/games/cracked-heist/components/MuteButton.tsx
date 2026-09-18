import { useEffect, useState } from 'react'
import { isMuted, subscribe, toggleMute } from '../audio'

interface Props {
  size?: 'sm' | 'md'
}

export default function MuteButton({ size = 'sm' }: Props) {
  const [muted, setMutedLocal] = useState(isMuted())

  useEffect(() => {
    return subscribe(() => setMutedLocal(isMuted()))
  }, [])

  const px = size === 'md' ? 40 : 32
  const fs = size === 'md' ? '1rem' : '0.85rem'

  return (
    <button
      onClick={toggleMute}
      title={muted ? 'Unmute' : 'Mute'}
      aria-label={muted ? 'Unmute' : 'Mute'}
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        border: '1.5px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.06)',
        color: muted ? 'rgba(255,255,255,0.4)' : '#86efac',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fs,
        fontWeight: 900,
        fontFamily: 'inherit',
        transition: 'all 0.18s ease',
        backdropFilter: 'blur(10px)',
      }}
    >
      {muted ? '✕' : '♪'}
    </button>
  )
}
