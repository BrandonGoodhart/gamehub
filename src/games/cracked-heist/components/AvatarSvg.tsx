import type { Avatar, FaceExpression, HairStyle, HatKind } from '../types'

interface Props {
  avatar: Avatar
  size?: number
  className?: string
}

export default function AvatarSvg({ avatar, size = 96, className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="48" fill="#021808" stroke="#16a34a" strokeWidth="2" />
      <Head skin={avatar.skinColor} />
      <Hair style={avatar.hairStyle} color={avatar.hairColor} />
      <Face expr={avatar.expression} />
      <Hat kind={avatar.hat} color={avatar.hatColor} />
    </svg>
  )
}

function Head({ skin }: { skin: string }) {
  return (
    <>
      <ellipse cx="50" cy="58" rx="22" ry="24" fill={skin} />
      <ellipse cx="35" cy="65" rx="3" ry="4" fill={skin} stroke="#000" strokeOpacity="0.05" />
      <ellipse cx="65" cy="65" rx="3" ry="4" fill={skin} stroke="#000" strokeOpacity="0.05" />
    </>
  )
}

function Hair({ style, color }: { style: HairStyle; color: string }) {
  switch (style) {
    case 'bald':
      return null
    case 'short':
      return (
        <path
          d="M 30 45 Q 30 30 50 30 Q 70 30 70 45 L 68 50 Q 60 38 50 38 Q 40 38 32 50 Z"
          fill={color}
        />
      )
    case 'long':
      return (
        <>
          <path
            d="M 28 50 Q 26 30 50 28 Q 74 30 72 50 L 75 80 L 70 80 L 68 50 Q 60 40 50 40 Q 40 40 32 50 L 30 80 L 25 80 Z"
            fill={color}
          />
        </>
      )
    case 'mohawk':
      return (
        <>
          <rect x="46" y="20" width="8" height="22" fill={color} rx="2" />
          <path d="M 30 45 Q 32 38 38 38 L 46 38 L 46 50 Q 36 46 30 50 Z" fill={color} opacity="0.5" />
          <path d="M 70 45 Q 68 38 62 38 L 54 38 L 54 50 Q 64 46 70 50 Z" fill={color} opacity="0.5" />
        </>
      )
    case 'curly':
      return (
        <>
          <circle cx="32" cy="40" r="8" fill={color} />
          <circle cx="42" cy="32" r="9" fill={color} />
          <circle cx="55" cy="30" r="10" fill={color} />
          <circle cx="68" cy="36" r="9" fill={color} />
          <circle cx="72" cy="46" r="7" fill={color} />
        </>
      )
    case 'bun':
      return (
        <>
          <path d="M 30 45 Q 30 32 50 32 Q 70 32 70 45 L 68 50 Q 60 40 50 40 Q 40 40 32 50 Z" fill={color} />
          <circle cx="50" cy="22" r="10" fill={color} />
        </>
      )
    case 'spiky':
      return (
        <>
          <polygon points="30,46 36,22 40,42" fill={color} />
          <polygon points="40,42 46,18 50,40" fill={color} />
          <polygon points="50,40 56,18 60,42" fill={color} />
          <polygon points="60,42 64,22 70,46" fill={color} />
        </>
      )
  }
}

function Face({ expr }: { expr: FaceExpression }) {
  const eye = (x: number) => {
    switch (expr) {
      case 'wink':
        return x === 35 ? <line x1="32" y1="55" x2="38" y2="55" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
          : <circle cx={x} cy="55" r="2.4" fill="#000" />
      case 'angry':
        return (
          <>
            <line x1={x - 3} y1="50" x2={x + 3} y2="53" stroke="#000" strokeWidth="2" />
            <circle cx={x} cy="56" r="2" fill="#000" />
          </>
        )
      case 'cool':
        return <rect x={x - 5} y="52" width="10" height="5" rx="1" fill="#0f0f0f" />
      case 'goofy':
        return x === 35 ? <circle cx={x} cy="55" r="3" fill="#000" /> : <circle cx={x} cy="55" r="2" fill="#000" />
      default:
        return <circle cx={x} cy="55" r="2.4" fill="#000" />
    }
  }

  const mouth = () => {
    switch (expr) {
      case 'happy':
        return <path d="M 42 70 Q 50 78 58 70" stroke="#000" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      case 'cool':
        return <path d="M 42 72 L 58 72" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
      case 'wink':
        return <path d="M 42 70 Q 50 76 58 70" stroke="#000" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      case 'angry':
        return <path d="M 42 74 Q 50 68 58 74" stroke="#000" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      case 'goofy':
        return (
          <>
            <path d="M 40 70 Q 50 80 60 70" stroke="#000" strokeWidth="2" fill="#d24a4a" />
            <rect x="46" y="71" width="4" height="6" fill="#fff" />
          </>
        )
      case 'serious':
        return <line x1="44" y1="72" x2="56" y2="72" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
    }
  }

  return (
    <>
      {eye(35)}
      {eye(65)}
      {mouth()}
    </>
  )
}

function Hat({ kind, color }: { kind: HatKind; color: string }) {
  switch (kind) {
    case 'none':
      return null
    case 'cap':
      return (
        <>
          <path d="M 28 38 Q 28 22 50 22 Q 72 22 72 38 L 70 40 L 30 40 Z" fill={color} />
          <ellipse cx="78" cy="40" rx="14" ry="3" fill={color} />
        </>
      )
    case 'hoodie':
      return (
        <>
          <path d="M 22 60 Q 18 28 50 25 Q 82 28 78 60 L 78 50 Q 78 36 50 34 Q 22 36 22 50 Z" fill={color} />
        </>
      )
    case 'crown':
      return (
        <>
          <polygon points="28,30 35,18 42,28 50,16 58,28 65,18 72,30 72,38 28,38" fill={color} />
          <circle cx="35" cy="20" r="2" fill="#fde047" />
          <circle cx="50" cy="18" r="2.5" fill="#ef4444" />
          <circle cx="65" cy="20" r="2" fill="#fde047" />
        </>
      )
    case 'beanie':
      return (
        <>
          <path d="M 28 40 Q 28 22 50 22 Q 72 22 72 40 L 28 40 Z" fill={color} />
          <rect x="28" y="38" width="44" height="6" fill={color} stroke="#000" strokeOpacity="0.15" />
          <circle cx="50" cy="18" r="4" fill={color} />
        </>
      )
    case 'helmet':
      return (
        <>
          <path d="M 24 42 Q 24 20 50 20 Q 76 20 76 42 L 76 48 L 24 48 Z" fill={color} />
          <rect x="46" y="22" width="8" height="20" fill="#22c55e" opacity="0.7" />
        </>
      )
    case 'witch':
      return (
        <>
          <polygon points="50,8 35,42 65,42" fill={color} />
          <ellipse cx="50" cy="42" rx="22" ry="4" fill={color} />
          <circle cx="44" cy="20" r="2" fill="#fde047" />
        </>
      )
  }
}
