interface Props {
  onClick: () => void
  size?: 'sm' | 'md'
}

export default function InfoButton({ onClick, size = 'sm' }: Props) {
  const px = size === 'md' ? 40 : 32
  return (
    <button
      onClick={onClick}
      title="What are coins and tokens?"
      aria-label="Help"
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        border: '1.5px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.06)',
        color: '#86efac',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 900,
        fontFamily: 'inherit',
        transition: 'all 0.18s ease',
        backdropFilter: 'blur(10px)',
      }}
    >
      ?
    </button>
  )
}
