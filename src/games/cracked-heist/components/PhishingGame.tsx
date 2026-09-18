import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Player } from '../types'

interface Props {
  cost: number
  tokens: number
  targets: Player[]
  onResult: (targetId: string, correct: boolean) => void
  onClose: () => void
}

type Theme = 'greed' | 'authority' | 'urgency'
const THEMES: Theme[] = ['greed', 'authority', 'urgency']

interface Phish {
  theme: Theme
  from: string
  subject: string
  body: string
}

const PHISHES: Record<Theme, Phish[]> = {
  greed: [
    {
      theme: 'greed',
      from: 'rewards@coinz.gg',
      subject: 'You just won 5000 coins!',
      body: 'Claim your prize now — link expires in 5 minutes.',
    },
    {
      theme: 'greed',
      from: 'gift@cashapp.io',
      subject: 'Free $500 voucher inside',
      body: 'Tap here to redeem your gift card before someone else does.',
    },
  ],
  authority: [
    {
      theme: 'authority',
      from: 'admin@cracked-heist.net',
      subject: 'Account verification required',
      body: 'Confirm your password to avoid losing access to the game.',
    },
    {
      theme: 'authority',
      from: 'system@netfix.co',
      subject: 'Security alert: sign-in needed',
      body: 'We noticed unusual activity on your account. Verify now.',
    },
  ],
  urgency: [
    {
      theme: 'urgency',
      from: 'support@hackz.help',
      subject: 'URGENT — your password expires today',
      body: 'Reset within 1 hour or your account will be deleted.',
    },
    {
      theme: 'urgency',
      from: 'alert@bnk.com',
      subject: 'Suspicious charge — act fast',
      body: 'Cancel a $200 charge now or it will go through.',
    },
  ],
}

// Each player has a "phishing weakness" derived from their handle so it's
// stable across the round but hard to game-theory by sight alone.
function weaknessFor(p: Player): Theme {
  const hash = [...p.handle].reduce((a, c) => a + c.charCodeAt(0), 0)
  return THEMES[hash % THEMES.length]
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

type CardState = 'idle' | 'pickedCorrect' | 'pickedWrong' | 'revealed'

function PhishCard({
  phish,
  state,
  onClick,
  disabled,
}: {
  phish: Phish
  state: CardState
  onClick?: () => void
  disabled?: boolean
}) {
  const isResult = state !== 'idle'
  const isPicked = state === 'pickedCorrect' || state === 'pickedWrong'
  const accent =
    state === 'pickedCorrect' || state === 'revealed'
      ? '#22c55e'
      : state === 'pickedWrong'
        ? '#ef4444'
        : 'rgba(94,234,212,0.35)'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        textAlign: 'left',
        background:
          state === 'pickedCorrect' || state === 'revealed'
            ? 'linear-gradient(180deg, rgba(34,197,94,0.16), rgba(34,197,94,0.04))'
            : state === 'pickedWrong'
              ? 'linear-gradient(180deg, rgba(239,68,68,0.16), rgba(239,68,68,0.04))'
              : 'rgba(255,255,255,0.04)',
        border: `2px solid ${accent}`,
        borderRadius: 14,
        padding: '12px 14px',
        cursor: disabled ? 'default' : 'pointer',
        boxShadow: isResult
          ? `0 0 22px ${accent}88`
          : '0 4px 12px rgba(0,0,0,0.3)',
        color: '#fff',
        fontFamily: 'inherit',
        width: '100%',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.5)',
          fontWeight: 700,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        From: <span style={{ color: '#fff' }}>{phish.from}</span>
      </div>
      <div
        style={{
          fontSize: '0.92rem',
          fontWeight: 800,
          marginBottom: 4,
          lineHeight: 1.2,
        }}
      >
        {phish.subject}
      </div>
      <div
        style={{
          fontSize: '0.78rem',
          color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.35,
        }}
      >
        {phish.body}
      </div>
      <AnimatePresence>
        {isPicked && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: 8,
              padding: '3px 12px',
              borderRadius: 999,
              fontWeight: 900,
              fontSize: '0.7rem',
              letterSpacing: '0.06em',
              background: state === 'pickedCorrect' ? '#22c55e' : '#ef4444',
              color: state === 'pickedCorrect' ? '#052e16' : '#450a0a',
              display: 'inline-block',
            }}
          >
            {state === 'pickedCorrect' ? '✓ Hooked!' : '✗ Ignored'}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}

export default function PhishingGame({ cost, tokens, targets, onResult, onClose }: Props) {
  const canSend = tokens >= cost && targets.length >= 3

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [pickedTarget, setPickedTarget] = useState<Player | null>(null)
  const [pickedIdx, setPickedIdx] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<'correct' | 'wrong' | null>(null)

  // Three messages — one per theme — shuffled
  const phishes: Phish[] = useMemo(() => {
    if (!pickedTarget) return []
    // Pick one phish per theme
    const set = THEMES.map((t) => {
      const pool = PHISHES[t]
      return pool[Math.floor(Math.random() * pool.length)]
    })
    return shuffle(set)
  }, [pickedTarget])

  if (!canSend) {
    return (
      <div className="space-y-4">
        <p className="fg-sub text-sm">
          {tokens < cost
            ? `You need ${cost} tokens to send a phish (you have ${tokens}). Answer more questions to earn tokens.`
            : `Not enough players in the room.`}
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

  function send(i: number) {
    if (!pickedTarget) return
    const phish = phishes[i]
    const target = pickedTarget
    const targetWeakness = weaknessFor(target)
    const correct = phish.theme === targetWeakness
    setPickedIdx(i)
    setOutcome(correct ? 'correct' : 'wrong')
    setStep(3)
    setTimeout(() => onResult(target.id, correct), 2200)
  }

  function back() {
    if (step === 2) {
      setStep(1)
      setPickedTarget(null)
    }
  }

  return (
    <div className="space-y-4">
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
              Pick someone to send a phishing email to. Costs{' '}
              <b className="text-[#5eead4]">{cost} tokens</b>.
            </>
          )}
          {step === 2 && (
            <>
              Three fake messages. Pick the one that would actually trick{' '}
              <span className="font-bold text-[var(--green-l)]">
                {pickedTarget?.handle}
              </span>
              . People fall for greed, authority, or urgency — guess which one fits
              them.
            </>
          )}
          {step === 3 && outcome === 'correct' && (
            <span className="text-[#86efac] font-bold">
              They fell for it. +5 coins.
            </span>
          )}
          {step === 3 && outcome === 'wrong' && (
            <span className="text-[#fda4af] font-bold">
              They ignored the email. Nothing happened.
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
            sending to {pickedTarget.handle}
          </div>
        </div>
      )}

      {/* Step 1: targets shown as player chips */}
      {step === 1 && (
        <div className="space-y-2">
          {targets.map((p) => (
            <button
              key={p.id}
              onClick={() => pickTarget(p)}
              className="w-full text-left p-3 rounded-2xl border font-bold transition-all flex items-center gap-3"
              style={{
                borderColor: 'rgba(94,234,212,0.3)',
                background: 'rgba(94,234,212,0.05)',
                color: '#99f6e4',
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold flex-shrink-0"
                style={{ background: p.avatar.color, color: '#0a0a0a' }}
              >
                {p.handle.charAt(0).toUpperCase()}
              </div>
              <span>{p.handle}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2/3: message cards */}
      {(step === 2 || step === 3) && (
        <div className="space-y-2">
          {phishes.map((ph, i) => {
            let cardState: CardState = 'idle'
            if (step === 3 && i === pickedIdx) {
              cardState = outcome === 'correct' ? 'pickedCorrect' : 'pickedWrong'
            }
            return (
              <PhishCard
                key={i}
                phish={ph}
                state={cardState}
                onClick={step === 2 ? () => send(i) : undefined}
                disabled={step === 3}
              />
            )
          })}
        </div>
      )}

      {step !== 3 && (
        <button onClick={onClose} className="fg-back w-full justify-center">
          Cancel
        </button>
      )}
    </div>
  )
}
