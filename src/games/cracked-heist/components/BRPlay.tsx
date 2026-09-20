import { useEffect, useState } from 'react'
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

  useEffect(() => {
    setPicked(null)
  }, [br?.questionIndex])

  // Host auto-advances once both matched players have answered.
  useEffect(() => {
    if (!isHost || !br || !br.matchAId || !br.matchBId || !br.currentQuestion) return
    const aAnswered = br.answers[br.matchAId] !== undefined
    const bAnswered = br.answers[br.matchBId] !== undefined
    if (aAnswered && bAnswered) {
      // Brief reveal, then advance
      const t = setTimeout(() => onAdvance(), 2200)
      return () => clearTimeout(t)
    }
  }, [isHost, br, onAdvance])

  const playerA = state.players.find((p) => p.id === br?.matchAId)
  const playerB = state.players.find((p) => p.id === br?.matchBId)
  const spectators = state.players.filter(
    (p) => !p.brEliminated && p.id !== br?.matchAId && p.id !== br?.matchBId,
  )
  const eliminated = state.players.filter((p) => p.brEliminated)

  if (!br || !br.currentQuestion || !playerA || !playerB) {
    return (
      <div className="fg-panel fg-panel-lg text-center max-w-lg mx-auto">
        <div className="fg-lbl mb-2">the last one standing</div>
        <h2 className="fg-display text-3xl">Loading…</h2>
      </div>
    )
  }

  const q = br.currentQuestion
  const iAmInMatch = me?.id === br.matchAId || me?.id === br.matchBId
  const iAnswered = me ? br.answers[me.id] !== undefined : false
  const bothAnswered =
    br.answers[br.matchAId!] !== undefined && br.answers[br.matchBId!] !== undefined
  const aAnswered = br.answers[br.matchAId!] !== undefined
  const bAnswered = br.answers[br.matchBId!] !== undefined
  const aCorrect = br.answers[br.matchAId!] === q.answer
  const bCorrect = br.answers[br.matchBId!] === q.answer

  function handle(i: number) {
    if (picked !== null || !iAmInMatch) return
    setPicked(i)
    onAnswer(i)
  }

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4 pb-6">
      {/* Header */}
      <div className="text-center">
        <div
          className="fg-lbl inline-block"
          style={{ color: '#fbbf24', letterSpacing: '0.3em' }}
        >
          the last one standing · round {br.questionIndex + 1}
        </div>
      </div>

      {/* Head-to-head banner */}
      <div className="fg-panel px-3 py-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <FighterCard
            player={playerA}
            score={br.scoreA}
            scoreToWin={br.scoreToWin}
            answered={aAnswered}
            revealed={bothAnswered}
            correct={aCorrect}
            isMe={me?.id === playerA.id}
            side="left"
          />
          <div
            className="text-center font-extrabold"
            style={{
              color: '#fbbf24',
              fontSize: '1.6rem',
              lineHeight: 1,
              textShadow: '0 0 12px rgba(251,191,36,0.4)',
            }}
          >
            VS
          </div>
          <FighterCard
            player={playerB}
            score={br.scoreB}
            scoreToWin={br.scoreToWin}
            answered={bAnswered}
            revealed={bothAnswered}
            correct={bCorrect}
            isMe={me?.id === playerB.id}
            side="right"
          />
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
            {q.q}
          </div>
          {iAmInMatch ? (
            <div className="fg-answer-grid">
              {q.choices.map((c, i) => {
                const isPicked = picked === i
                const showReveal = iAnswered
                const isReveal = showReveal && i === q.answer
                const isWrong = showReveal && isPicked && i !== q.answer
                const slotClass: string[] = ['fg-answer', COLORS[i]]
                if (isPicked && !showReveal)
                  slotClass.push('fg-answer-others-orange')
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
            <div className="fg-answer-grid">
              {q.choices.map((c, i) => {
                const slotClass: string[] = ['fg-answer', COLORS[i]]
                if (bothAnswered && i === q.answer)
                  slotClass.push('fg-answer-correct')
                return (
                  <div key={i} className={slotClass.join(' ')} style={{ opacity: 0.75, pointerEvents: 'none' }}>
                    {c}
                  </div>
                )
              })}
            </div>
          )}
          {!iAmInMatch && (
            <p className="fg-sub text-center text-xs">
              {me?.brEliminated
                ? "You're out — watching until the champion is crowned."
                : 'Waiting for your turn in the ring.'}
            </p>
          )}
        </div>
      </div>

      {/* Waiting-in-line + eliminated */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="fg-panel p-4">
          <div className="fg-lbl mb-2">on deck ({spectators.length})</div>
          <div className="grid grid-cols-5 gap-2">
            <AnimatePresence>
              {spectators.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="rounded-xl p-1.5 text-center"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <AvatarSvg avatar={p.avatar} size={24} initial={p.handle} />
                  <div
                    className="mt-1 truncate text-[9px] font-extrabold"
                    style={{ color: '#fff' }}
                  >
                    {p.handle}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {spectators.length === 0 && (
              <div
                className="col-span-5 text-center py-2 fg-sub text-[11px]"
                style={{ fontStyle: 'italic' }}
              >
                nobody left in line
              </div>
            )}
          </div>
        </div>
        {eliminated.length > 0 && (
          <div className="fg-panel p-4">
            <div className="fg-lbl mb-2">out ({eliminated.length})</div>
            <div className="grid grid-cols-5 gap-2">
              {eliminated.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl p-1.5 text-center opacity-40"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    filter: 'grayscale(0.5)',
                  }}
                >
                  <AvatarSvg avatar={p.avatar} size={22} initial={p.handle} />
                  <div
                    className="mt-1 truncate text-[9px] font-extrabold line-through"
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

function FighterCard({
  player,
  score,
  scoreToWin,
  answered,
  revealed,
  correct,
  isMe,
  side,
}: {
  player: Player
  score: number
  scoreToWin: number
  answered: boolean
  revealed: boolean
  correct: boolean
  isMe: boolean
  side: 'left' | 'right'
}) {
  const showResult = revealed
  const bgTint = showResult
    ? correct
      ? 'rgba(74,222,128,0.16)'
      : 'rgba(244,63,94,0.16)'
    : answered
      ? 'rgba(251,191,36,0.14)'
      : 'rgba(255,255,255,0.04)'
  const borderTint = showResult
    ? correct
      ? 'rgba(74,222,128,0.55)'
      : 'rgba(244,63,94,0.55)'
    : answered
      ? 'rgba(251,191,36,0.5)'
      : 'rgba(255,255,255,0.1)'
  return (
    <div
      className="rounded-2xl p-3 flex items-center gap-2"
      style={{
        background: bgTint,
        border: `1.5px solid ${borderTint}`,
        justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
        textAlign: side === 'left' ? 'left' : 'right',
        flexDirection: side === 'right' ? 'row-reverse' : 'row',
      }}
    >
      <AvatarSvg avatar={player.avatar} size={44} initial={player.handle} />
      <div>
        <div className="text-white font-extrabold text-sm truncate" style={{ maxWidth: 120 }}>
          {player.handle}
          {isMe && (
            <span className="ml-1 text-[9px]" style={{ color: '#fbbf24' }}>
              (you)
            </span>
          )}
        </div>
        {scoreToWin > 1 && (
          <div className="flex gap-1 mt-1" style={{ justifyContent: side === 'left' ? 'flex-start' : 'flex-end' }}>
            {Array.from({ length: scoreToWin }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background:
                    i < score ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>
        )}
        <div className="fg-lbl text-[9px] mt-0.5">
          {showResult ? (correct ? 'right' : 'wrong') : answered ? 'locked in' : 'thinking…'}
        </div>
      </div>
    </div>
  )
}
