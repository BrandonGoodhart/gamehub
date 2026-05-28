import { useEffect, useRef } from 'react'

const CHARS = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプ0123456789ABCDEF*#%&'

export default function MatrixBg({ intensity = 0.7 }: { intensity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let cols: number[] = []
    let fontSize = 14

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      fontSize = Math.max(12, Math.floor(window.innerWidth / 110))
      const colCount = Math.floor(canvas.width / fontSize)
      cols = new Array(colCount).fill(0).map(() => Math.random() * canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    let last = 0
    function draw(t: number) {
      if (!canvas || !ctx) return
      if (t - last < 55) {
        raf = requestAnimationFrame(draw)
        return
      }
      last = t

      ctx.fillStyle = `rgba(2, 8, 4, ${0.18 + (1 - intensity) * 0.1})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`
      for (let i = 0; i < cols.length; i++) {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)]
        const x = i * fontSize
        const y = cols[i]
        ctx.fillStyle = `rgba(180, 255, 200, ${0.85 * intensity})`
        ctx.fillText(ch, x, y)
        ctx.fillStyle = `rgba(50, 220, 120, ${0.55 * intensity})`
        ctx.fillText(ch, x, y - fontSize)

        if (y > canvas.height && Math.random() > 0.975) cols[i] = 0
        else cols[i] = y + fontSize
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [intensity])

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'radial-gradient(ellipse at center, #021808 0%, #000300 70%, #000 100%)' }}
    />
  )
}
