import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Player } from '../types'

interface Props {
  hackCost: number
  tokens: number
  targets: Player[]
  onResult: (targetId: string, correct: boolean) => void
  onClose: () => void
}

const STEP1_COLORS = ['#f97316', '#3b82f6', '#22c55e']

interface PwTile {
  label: string
  isReal: boolean
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

type TileState = 'idle' | 'pickedCorrect' | 'pickedWrong' | 'revealed'

function ComputerTile({
  label,
  glowColor,
  state,
  onClick,
  disabled,
}: {
  label: string
  glowColor: string
  state: TileState
  onClick?: () => void
  disabled?: boolean
}) {
  const effectiveGlow =
    state === 'pickedCorrect' || state === 'revealed'
      ? '#22c55e'
      : state === 'pickedWrong'
        ? '#ef4444'
        : glowColor
  const isPicked = state === 'pickedCorrect' || state === 'pickedWrong'
  const isResult = state !== 'idle'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        opacity: 1,
        transition: 'opacity 0.25s, transform 0.18s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}
    >
      {/* Monitor */}
      <div
        style={{
          width: '100%',
          aspectRatio: '4 / 3',
          background:
            'radial-gradient(ellipse at center, #0e1f12 0%, #050a06 70%, #03070a 100%)',
          borderRadius: 12,
          border: `3px solid ${effectiveGlow}`,
          boxShadow: isResult
            ? `0 0 38px ${effectiveGlow}dd, 0 0 18px ${effectiveGlow}cc, inset 0 0 24px ${effectiveGlow}55`
            : `0 0 26px ${effectiveGlow}cc, 0 0 12px ${effectiveGlow}aa, inset 0 0 18px ${effectiveGlow}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 4px',
          position: 'relative',
        }}
      >
        {/* Scanline overlay for that CRT feel */}
        <div
          style={{
            position: 'absolute',
            inset: 6,
            borderRadius: 8,
            background:
              'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 4px)',
            pointerEvents: 'none',
          }}
        />
        <span
          style={{
            color: '#fff',
            fontFamily: 'JetBrains Mono, ui-monospace, monospace',
            fontWeight: 800,
            fontSize: 'clamp(0.7rem, 1.6vw, 1rem)',
            letterSpacing: '0.04em',
            wordBreak: 'break-all',
            lineHeight: 1.1,
            textShadow: `0 0 8px ${effectiveGlow}aa`,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {label}
        </span>
      </div>

      {/* Stand / neck */}
      <div
        style={{
          width: '24%',
          height: 8,
          background: `linear-gradient(180deg, ${effectiveGlow}66, ${effectiveGlow}22)`,
          borderLeft: `1.5px solid ${effectiveGlow}`,
          borderRight: `1.5px solid ${effectiveGlow}`,
          boxShadow: `0 0 8px ${effectiveGlow}aa`,
        }}
      />

      {/* Base / stand foot */}
      <div
        style={{
          width: '50%',
          height: 5,
          background: '#0a0a0a',
          border: `1.5px solid ${effectiveGlow}`,
          borderRadius: '4px 4px 1px 1px',
          boxShadow: `0 0 12px ${effectiveGlow}88`,
        }}
      />

      {/* Keyboard */}
      <div
        style={{
          width: '108%',
          marginTop: 8,
          height: 26,
          background: 'linear-gradient(180deg, #0e0e0e, #060606)',
          borderRadius: 6,
          border: `2px solid ${effectiveGlow}`,
          boxShadow: isResult
            ? `0 0 24px ${effectiveGlow}bb, inset 0 1px 0 ${effectiveGlow}55`
            : `0 0 16px ${effectiveGlow}aa, inset 0 1px 0 ${effectiveGlow}33`,
          position: 'relative',
          padding: '4px 6px',
        }}
      >
        {/* Key rows */}
        {[0, 1].map((row) => (
          <div
            key={row}
            style={{
              display: 'flex',
              gap: 2,
              marginBottom: row === 0 ? 2 : 0,
              opacity: 0.7,
            }}
          >
            {Array.from({ length: 9 }).map((_, k) => (
              <div
                key={k}
                style={{
                  flex: 1,
                  height: 7,
                  background: `${effectiveGlow}33`,
                  borderRadius: 1,
                  border: `0.5px solid ${effectiveGlow}66`,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Status badge — only on the tile the user actually picked */}
      <AnimatePresence>
        {isPicked && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: -4 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: 10,
              padding: '5px 14px',
              borderRadius: 999,
              fontFamily: 'inherit',
              fontWeight: 900,
              fontSize: '0.75rem',
              letterSpacing: '0.07em',
              background: state === 'pickedCorrect' ? '#22c55e' : '#ef4444',
              color: state === 'pickedCorrect' ? '#052e16' : '#450a0a',
              boxShadow: `0 0 18px ${state === 'pickedCorrect' ? '#22c55e' : '#ef4444'}aa`,
            }}
          >
            {state === 'pickedCorrect' ? '✓ Correct!' : '✗ Wrong!'}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}

export default function HackComputers({ hackCost, tokens, targets, onResult, onClose }: Props) {
  const canHack = tokens >= hackCost && targets.length >= 3

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [pickedTarget, setPickedTarget] = useState<Player | null>(null)
  const [pickedPwIdx, setPickedPwIdx] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<'correct' | 'wrong' | null>(null)

  const passwordTiles: PwTile[] = useMemo(() => {
    if (!pickedTarget) return []
    const opts =
      pickedTarget.passwordOptions && pickedTarget.passwordOptions.length === 3
        ? [...pickedTarget.passwordOptions]
        : [pickedTarget.password, pickedTarget.password + '_a', pickedTarget.password + '_b']
    return shuffle(opts).map((pw) => ({ label: pw, isReal: pw === pickedTarget.password }))
  }, [pickedTarget])

  if (!canHack) {
    return (
      <div className="space-y-4">
        <p className="fg-sub text-sm">
          {tokens < hackCost
            ? `You need ${hackCost} tokens to hack (you have ${tokens}). Answer more questions to earn tokens.`
            : `Not enough players to hack right now.`}
        </p>
        <button onClick={onClose} className="fg-back w-full justify-center">
          Close
        </button>
      </div>
    )
  }

  function pickTarget(p: Player) {
    setPickedTarget(p)
    setStep(2)
  }

  function pickPassword(i: number) {
    if (!pickedTarget) return
    const tile = passwordTiles[i]
    const correct = tile.isReal
    setPickedPwIdx(i)
    setOutcome(correct ? 'correct' : 'wrong')
    setStep(3)
    setTimeout(() => onResult(pickedTarget.id, correct), 2200)
  }

  function back() {
    if (step === 2) {
      setStep(1)
      setPickedTarget(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        {step === 2 && (
          <button
            onClick={back}
            aria-label="back"
            className="rounded-full flex-shrink-0 flex items-center justify-center"
            style={{
              width: 30,
              height: 30,
              background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              color: '#fff',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ‹
          </button>
        )}
        <p className="fg-sub text-sm leading-snug" style={{ flex: 1 }}>
          {step === 1 && (
            <>
              <b className="text-white">Step 1:</b> Choose a player (username) to hack.
              Costs <b className="text-[#5eead4]">{hackCost} tokens</b>.
            </>
          )}
          {step === 2 && (
            <>
              <b className="text-white">Step 2:</b> Three possible passwords for{' '}
              <span className="font-bold text-[var(--green-l)]">{pickedTarget?.handle}</span>.
              Tap the one you think is real.
            </>
          )}
          {step === 3 && outcome === 'correct' && (
            <span className="text-[#86efac] font-bold">You picked the right password.</span>
          )}
          {step === 3 && outcome === 'wrong' && (
            <span className="text-[#fda4af] font-bold">
              The password you picked is not correct.
            </span>
          )}
        </p>
      </div>

      {(step === 2 || step === 3) && pickedTarget && (
        <div className="flex justify-center">
          <div
            style={{
              padding: '5px 18px',
              borderRadius: 999,
              background: 'linear-gradient(135deg,#22c55e,#4ade80)',
              color: '#052e16',
              fontWeight: 800,
              fontSize: '0.85rem',
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              letterSpacing: '0.04em',
              boxShadow: '0 0 18px rgba(74,222,128,0.5)',
            }}
          >
            {pickedTarget.handle}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 px-1">
        {step === 1 &&
          targets.map((p, i) => (
            <ComputerTile
              key={p.id}
              label={p.handle}
              glowColor={STEP1_COLORS[i % STEP1_COLORS.length]}
              state="idle"
              onClick={() => pickTarget(p)}
            />
          ))}
        {(step === 2 || step === 3) &&
          passwordTiles.map((c, i) => {
            let tileState: TileState = 'idle'
            if (step === 3) {
              if (i === pickedPwIdx) {
                tileState = outcome === 'correct' ? 'pickedCorrect' : 'pickedWrong'
              } else if (outcome === 'wrong' && c.isReal) {
                tileState = 'revealed'
              }
            }
            return (
              <ComputerTile
                key={i}
                label={c.label}
                glowColor="#f97316"
                state={tileState}
                onClick={step === 2 ? () => pickPassword(i) : undefined}
                disabled={step === 3}
              />
            )
          })}
      </div>

      {step !== 3 && (
        <button onClick={onClose} className="fg-back w-full justify-center">
          Cancel
        </button>
      )}
    </div>
  )
}
