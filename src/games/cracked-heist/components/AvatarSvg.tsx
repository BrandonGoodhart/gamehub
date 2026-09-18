import type { Avatar } from '../types'

interface Props {
  avatar: Avatar
  size?: number
  className?: string
  initial?: string
}

function relativeLuminance(hex: string): number {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16) / 255
  const g = parseInt(m.slice(2, 4), 16) / 255
  const b = parseInt(m.slice(4, 6), 16) / 255
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export default function AvatarSvg({ avatar, size = 64, className = '', initial = '' }: Props) {
  const lum = relativeLuminance(avatar.color)
  const textColor = lum > 0.5 ? '#0a0a0a' : '#ffffff'
  const fontSize = size * 0.4
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: avatar.color,
        boxShadow: `0 4px 16px ${avatar.color}55, inset 0 -3px 0 rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,0.15)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: textColor,
        fontWeight: 800,
        fontSize,
        letterSpacing: '-0.02em',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {initial.charAt(0).toUpperCase()}
    </div>
  )
}
