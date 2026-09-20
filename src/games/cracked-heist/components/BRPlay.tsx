import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RoomState, Player } from '../types'
import AvatarSvg from './AvatarSvg'

interface Props {
  state: RoomState
  me: Player | undefined
  onAnswer: (choice: number) => void
  onAdvance: () => void
  isHost: boolean
}

const COLORS = ['fg-answer-orange', 'fg-answer-blue', 'fg-answer-green', 'fg-answer-red']

export default function BRPlay({ state, me, onAnswer, onAdvance, isHost }: Props) {
  const br = state.br
  const [picked, setPicked] = useState<number | null>(null)
  const [tick, setTick] = useState(0)

  // Tick every 100ms so the timer bar updates smoothly
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 100)
    return () => clearInterval(id)
  }, [])

  // Reset local picked state when the question changes
  useEffect(() => {
    setPicked(null)
  }, [br?.questionIndex])

  // Host auto-advances after everyone alive has answered or the deadline hits
  useEffect(() => {
    if (!isHost || !br || !br.currentQuestion) return
    const alive = state.players.filter((p) => !p.brEliminated)
    const answered = alive.filter((p) => br.answers[p.id] !== undefined)
    if (alive.length > 0 && answered.length >= alive.length) {
      // Everyone alive answered — advance after a brief reveal (2s)
      const t = setTimeout(() => onAdvance(), 2000)
      return () => clearTimeout(t)
    }
    const now = Date.now()
    if (now >= br.deadline) {
      // Timer ran out
      const t = setTimeout(() => onAdvance(), 400)
      return () => clearTimeout(t)
    }
    const remaining = br.deadline - now
    const t = setTimeout(() => setTick((n) => n + 1), remaining + 50)
    return () => clearTimeout(t)
  }, [isHost, br, state.players, tick, onAdvance])

  const alivePlayers = state.players.filter((p) => !p.brEliminated)
  const eliminatedPlayers = state.players.filter((p) => p.brEliminated)
  const secondsLeft = useMemo(() => {
    if (!br) return 0
    return Math.max(0, Math.ceil((br.deadline - Date.now()) / 1000))
  }, [br, tick])
  const barPct = useMemo(() => {
    if (!br) return 0
    const total = br.secondsPerQuestion * 1000
    const elapsed = Date.now() - br.questionStartedAt
    return Math.max(0, Math.min(100, 100 - (elapsed / total) * 100))
  }, [br, tick])

  if (!br || !br.currentQuestion) {
    return (
      <div className="fg-panel fg-panel-lg text-center max-w-lg mx-auto">
        <div className="fg-lbl mb-2">battle royale</div>
        <h2 className="fg-display text-3xl">Loading…</h2>
      </div>
    )
  }

  const q = br.currentQuestion
  const iAmAlive = me && !me.brEliminated
  const iAnswered = me ? br.answers[me.id] !== undefined : false
  const answerCount = Object.keys(br.answers).length

  function handle(i: number) {
    if (picked !== null || !iAmAlive) return
    setPicked(i)
    onAnswer(i)
  }

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4 pb-6">
      {/* Header: round + alive count + timer */}
      <div className="fg-panel px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="fg-lbl">round</div>
          <div className="font-extrabold tabular-nums text-white text-lg">
            {br.questionIndex + 1}
          </div>
        </div>
        <div className="text-center">
          <div className="fg-lbl">still in</div>
          <div
            className="font-extrabold tabular-nums text-lg"
            style={{ color: '#fbbf24' }}
          >
            {alivePlayers.length}
          </div>
        </div>
        <div className="text-right">
          <div className="fg-lbl">answers</div>
          <div className="font-extrabold tabular-nums text-white text-lg">
            {answerCount} / {alivePlayers.length}
          </div>
        </div>
      </div>

      {/* Timer bar */}
      <div
        className="relative h-3 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          style={{
            width: `${barPct}%`,
            height: '100%',
            background:
              secondsLeft <= 3
                ? 'linear-gradient(90deg, #dc2626, #f43f5e)'
                : secondsLeft <= 6
                  ? 'linear-gradient(90deg, #f97316, #fbbf24)'
                  : 'linear-gradient(90deg, #fbbf24, #f97316)',
            transition: 'width 0.1s linear',
          }}
        />
        <div
          className="absolute inset-0 flex items-center justify-center font-extrabold tabular-nums text-[11px]"
          style={{
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          }}
        >
          {secondsLeft}s
        </div>
      </div>

      {/* Question */}
      <div className="fg-gcard relative">
        <div className="fg-codebg" />
        <div className="relative z-[1] space-y-5">
          <div
            className="text-center font-extrabold tracking-tight text-white"
            style={{ fontSize: 'clamp(1.3rem, 3vw, 2rem)', lineHeight: 1.2 }}
          >
            {iAmAlive ? q.q : "You've been eliminated"}
          </div>
          {iAmAlive ? (
            <div className="fg-answer-grid">
              {q.choices.map((c, i) => {
                const isPicked = picked === i
                const showAnswers = picked !== null || iAnswered
                const isReveal = showAnswers && i === q.answer
                const isWrong = showAnswers && isPicked && i !== q.answer
                const slotClass: string[] = ['fg-answer', COLORS[i]]
                if (isPicked && !showAnswers) slotClass.push('fg-answer-others-orange')
                if (isReveal) slotClass.push('fg-answer-correct')
                if (isWrong) slotClass.push('fg-answer-wrong-pick')
                return (
                  <button
                    key={i}
                    onClick={() => handle(i)}
                    disabled={picked !== null}
                    className={slotClass.join(' ')}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="fg-sub text-center text-sm">
              Watching until a champion is crowned.
            </p>
          )}
        </div>
      </div>

      {/* Alive & eliminated grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="fg-panel p-4">
          <div className="fg-lbl mb-2">alive ({alivePlayers.length})</div>
          <div className="grid grid-cols-4 gap-2">
            <AnimatePresence>
              {alivePlayers.map((p) => {
                const answered = br.answers[p.id] !== undefined
                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="rounded-xl p-2 text-center relative"
                    style={{
                      background: answered
                        ? 'rgba(251,191,36,0.10)'
                        : 'rgba(255,255,255,0.04)',
                      border: answered
                        ? '1.5px solid rgba(251,191,36,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <AvatarSvg avatar={p.avatar} size={32} initial={p.handle} />
                    <div
                      className="mt-1 truncate text-[10px] font-extrabold"
                      style={{ color: '#fff' }}
                    >
                      {p.handle}
                    </div>
                    {answered && (
                      <div
                        className="absolute -top-1 -right-1 rounded-full text-[10px] px-1.5 py-0.5"
                        style={{
                          background: 'linear-gradient(135deg, #fbbf24, #f97316)',
                          color: '#1a0a0a',
                          fontWeight: 900,
                        }}
                      >
                        ✓
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
        {eliminatedPlayers.length > 0 && (
          <div className="fg-panel p-4">
            <div className="fg-lbl mb-2">out ({eliminatedPlayers.length})</div>
            <div className="grid grid-cols-4 gap-2">
              {eliminatedPlayers.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl p-2 text-center opacity-40"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    filter: 'grayscale(0.5)',
                  }}
                >
                  <AvatarSvg avatar={p.avatar} size={28} initial={p.handle} />
                  <div
                    className="mt-1 truncate text-[10px] font-extrabold line-through"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                  >
                    {p.handle}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
