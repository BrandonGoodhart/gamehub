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

interface Computer {
  label: string
  realPassword: string
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function ComputerTile({
  label,
  glowColor,
  state,
  onClick,
  disabled,
}: {
  label: string
  glowColor: string
  state: 'idle' | 'correct' | 'wrong' | 'dim'
  onClick?: () => void
  disabled?: boolean
}) {
  const effectiveGlow =
    state === 'correct' ? '#22c55e' : state === 'wrong' ? '#ef4444' : glowColor
  const dim = state === 'dim'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        opacity: dim ? 0.45 : 1,
        transition: 'opacity 0.2s, transform 0.15s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {/* Monitor / screen */}
      <div
        style={{
          width: '100%',
          minHeight: 70,
          background: '#08110b',
          borderRadius: 10,
          border: `2px solid ${effectiveGlow}`,
          boxShadow:
            state === 'correct'
              ? `0 0 28px ${effectiveGlow}cc, 0 0 14px ${effectiveGlow}aa, inset 0 0 16px ${effectiveGlow}44`
              : state === 'wrong'
                ? `0 0 28px ${effectiveGlow}cc, 0 0 14px ${effectiveGlow}aa, inset 0 0 16px ${effectiveGlow}44`
                : `0 0 18px ${effectiveGlow}aa, 0 0 8px ${effectiveGlow}66, inset 0 0 12px ${effectiveGlow}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px 6px',
          textAlign: 'center',
          color: '#fff',
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          fontWeight: 800,
          fontSize: '0.78rem',
          letterSpacing: '0.02em',
          wordBreak: 'break-all',
          lineHeight: 1.15,
        }}
      >
        {label}
      </div>
      {/* "Neck" — short connector between monitor and base */}
      <div
        style={{
          width: '30%',
          height: 4,
          background: effectiveGlow,
          opacity: 0.55,
          borderRadius: 1,
          boxShadow: `0 0 6px ${effectiveGlow}aa`,
        }}
      />
      {/* Keyboard base */}
      <div
        style={{
          width: '110%',
          height: 14,
          background: '#0a0a0a',
          borderRadius: 4,
          border: `1.5px solid ${effectiveGlow}`,
          boxShadow: `0 0 12px ${effectiveGlow}80, inset 0 1px 0 ${effectiveGlow}44`,
          marginTop: 1,
          position: 'relative',
        }}
      >
        {/* Tiny "keys" */}
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: '12%',
            right: '12%',
            height: 2,
            borderTop: `1px dashed ${effectiveGlow}`,
            opacity: 0.6,
          }}
        />
      </div>
      {/* Status badge */}
      <AnimatePresence>
        {(state === 'correct' || state === 'wrong') && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: -4 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: 6,
              padding: '3px 10px',
              borderRadius: 999,
              fontFamily: 'inherit',
              fontWeight: 800,
              fontSize: '0.68rem',
              letterSpacing: '0.06em',
              background: state === 'correct' ? '#22c55e' : '#ef4444',
              color: state === 'correct' ? '#052e16' : '#450a0a',
              boxShadow: `0 0 14px ${state === 'correct' ? '#22c55e' : '#ef4444'}88`,
            }}
          >
            {state === 'correct' ? '✓ Correct!' : '✗ Wrong!'}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}

export default function HackComputers({ hackCost, tokens, targets, onResult, onClose }: Props) {
  const canHack = tokens >= hackCost && targets.length >= 3

  // Step 1: pick a target. Step 2: pick a password. Step 3: result shown.
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [pickedTarget, setPickedTarget] = useState<Player | null>(null)
  const [pickedPwIdx, setPickedPwIdx] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<'correct' | 'wrong' | null>(null)

  // Per-step content: 3 targets in step 1, 3 password options of the picked target in step 2
  const passwordTiles: Computer[] = useMemo(() => {
    if (!pickedTarget) return []
    const opts =
      pickedTarget.passwordOptions && pickedTarget.passwordOptions.length === 3
        ? [...pickedTarget.passwordOptions]
        : [pickedTarget.password, pickedTarget.password + '_a', pickedTarget.password + '_b']
    const shuffled = shuffle(opts)
    return shuffled.map((pw) => ({ label: pw, realPassword: pickedTarget.password }))
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
    const correct = tile.label === pickedTarget.password
    setPickedPwIdx(i)
    setOutcome(correct ? 'correct' : 'wrong')
    setStep(3)
    setTimeout(() => onResult(pickedTarget.id, correct), 1700)
  }

  function back() {
    if (step === 2) {
      setStep(1)
      setPickedTarget(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header: step indicator + back arrow (step 2 only) */}
      <div className="flex items-start gap-3">
        {step === 2 && (
          <button
            onClick={back}
            aria-label="back"
            className="rounded-full flex-shrink-0 flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
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
              <b className="text-white">Step 1:</b> Pick the player you want to hack.
              You'll get to guess their password next. Costs{' '}
              <b className="text-[#5eead4]">{hackCost} tokens</b>.
            </>
          )}
          {step === 2 && (
            <>
              <b className="text-white">Step 2:</b> Three possible passwords for{' '}
              <span className="font-bold text-[var(--green-l)]">{pickedTarget?.handle}</span>.
              Tap the one you think is real. Right = steal coins.
            </>
          )}
          {step === 3 && (
            <>
              {outcome === 'correct'
                ? `Nice — that was ${pickedTarget?.handle}'s real password.`
                : `Wrong password for ${pickedTarget?.handle}. They keep their coins.`}
            </>
          )}
        </p>
      </div>

      {/* Step 2/3: show selected player as a green pill above the computer row */}
      {(step === 2 || step === 3) && pickedTarget && (
        <div className="flex justify-center">
          <div
            style={{
              padding: '5px 16px',
              borderRadius: 999,
              background: 'linear-gradient(135deg,#22c55e,#4ade80)',
              color: '#052e16',
              fontWeight: 800,
              fontSize: '0.85rem',
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              letterSpacing: '0.04em',
              boxShadow: '0 0 18px rgba(74,222,128,0.45)',
            }}
          >
            {pickedTarget.handle}
          </div>
        </div>
      )}

      {/* Computer row */}
      <div className="grid grid-cols-3 gap-3">
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
            let state: 'idle' | 'correct' | 'wrong' | 'dim' = 'idle'
            if (step === 3) {
              if (i === pickedPwIdx) state = outcome === 'correct' ? 'correct' : 'wrong'
              else if (outcome === 'wrong' && c.label === c.realPassword) state = 'correct'
              else state = 'dim'
            }
            return (
              <ComputerTile
                key={i}
                label={c.label}
                glowColor="#f97316"
                state={state}
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
