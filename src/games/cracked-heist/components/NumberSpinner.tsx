interface Props {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}

export default function NumberSpinner({ value, min, max, step = 1, onChange }: Props) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n))
  return (
    <div className="fg-spin">
      <button
        type="button"
        className="fg-spin-btn"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        aria-label="decrease"
      >
        −
      </button>
      <input
        type="number"
        className="fg-spin-val"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(clamp(+e.target.value || min))}
      />
      <button
        type="button"
        className="fg-spin-btn"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        aria-label="increase"
      >
        +
      </button>
    </div>
  )
}
