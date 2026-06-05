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

const STAGE1_COLORS = ['#f97316', '#3b82f6', '#22c55e']

// Glow color → derived shades for the keyboard gradient and key stripes
const SHADES: Record<string, { light: string; dark: string; keyDark: string }> = {
  '#f97316': { light: '#fb923c', dark: '#7c2d12', keyDark: '#3f1709' }, // orange
  '#3b82f6': { light: '#60a5fa', dark: '#1e3a8a', keyDark: '#0f1c47' }, // blue
  '#22c55e': { light: '#4ade80', dark: '#15803d', keyDark: '#062012' }, // green
  '#ef4444': { light: '#f87171', dark: '#7f1d1d', keyDark: '#3f0a0a' }, // red
  '#06b6d4': { light: '#22d3ee', dark: '#0e7490', keyDark: '#052f37' }, // cyan (fallback)
}

function shadesFor(color: string) {
  return SHADES[color] ?? SHADES['#06b6d4']
}

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

type TileState = 'idle' | 'pickedCorrect' | 'pickedWrong'

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
  const effective =
    state === 'pickedCorrect'
      ? '#22c55e'
      : state === 'pickedWrong'
        ? '#ef4444'
        : glowColor
  const isPicked = state === 'pickedCorrect' || state === 'pickedWrong'
  const sh = shadesFor(effective)

  return (
    <motion.button
      layout
      whileHover={!disabled ? { y: -3, scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      animate={
        isPicked
          ? {
              scale: [1, 1.07, 1],
              transition: { duration: 0.45, ease: 'easeOut' },
            }
          : { scale: 1 }
      }
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        filter: `drop-shadow(0 0 18px ${effective})`,
      }}
    >
      {/* SCREEN */}
      <div
        style={{
          width: '88%',
          aspectRatio: '105 / 80',
          background: 'linear-gradient(#15201d, #070b0a)',
          border: `4px solid ${effective}`,
          borderRadius: 10,
          boxShadow: `0 0 12px ${effective}, inset 0 0 18px #000`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          fontWeight: 800,
          fontSize: 'clamp(0.7rem, 1.6vw, 1rem)',
          letterSpacing: '0.04em',
          padding: '6px',
          wordBreak: 'break-all',
          lineHeight: 1.1,
        }}
      >
        {label}
      </div>

      {/* NECK — narrow connector between screen and keyboard */}
      <div
        style={{
          width: '24%',
          height: 10,
          background: '#15332f',
          borderLeft: `3px solid ${effective}`,
          borderRight: `3px solid ${effective}`,
        }}
      />

      {/* KEYBOARD — wider than the screen, gradient base with keys + power LED */}
      <div
        style={{
          width: '102%',
          aspectRatio: '125 / 38',
          background: `linear-gradient(${sh.light}, ${sh.dark})`,
          border: `3px solid ${effective}`,
          borderRadius: 8,
          boxShadow: `0 0 12px ${effective}`,
          position: 'relative',
        }}
      >
        {/* Keys: striped pattern of dark/light bars */}
        <div
          style={{
            position: 'absolute',
            left: '12%',
            top: '32%',
            width: '54%',
            height: '32%',
            background: `repeating-linear-gradient(90deg, ${sh.keyDark} 0px, ${sh.keyDark} 5px, ${effective} 6px)`,
            borderRadius: 3,
          }}
        />
        {/* Power LED */}
        <div
          style={{
            position: 'absolute',
            right: '8%',
            top: '32%',
            width: '11%',
            aspectRatio: '1',
            background: '#33ff55',
            borderRadius: '50%',
            boxShadow: '0 0 6px #33ff55',
          }}
        />
      </div>

      {/* Status badge — only on the picked tile */}
      <AnimatePresence>
        {isPicked && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: -6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
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
              boxShadow: `0 0 20px ${state === 'pickedCorrect' ? '#22c55e' : '#ef4444'}bb`,
            }}
          >
            {state === 'pickedCorrect' ? '✓ Correct!' : '✗ Wrong!'}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

const stageVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

export default function HackComputers({ hackCost, tokens, targets, onResult, onClose }: Props) {
  const canHack = tokens >= hackCost && targets.length >= 3

  const [stage, setStage] = useState<'usernames' | 'passwords' | 'result'>('usernames')
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
    setStage('passwords')
  }

  function pickPassword(i: number) {
    if (!pickedTarget) return
    const tile = passwordTiles[i]
    const correct = tile.isReal
    setPickedPwIdx(i)
    setOutcome(correct ? 'correct' : 'wrong')
    setStage('result')
    setTimeout(() => onResult(pickedTarget.id, correct), 2200)
  }

  function back() {
    if (stage === 'passwords') {
      setStage('usernames')
      setPickedTarget(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 min-h-[2.5rem]">
        <AnimatePresence mode="wait">
          {stage === 'passwords' && (
            <motion.button
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
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
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.p
            key={stage + (outcome ?? '')}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="fg-sub text-sm leading-snug"
            style={{ flex: 1 }}
          >
            {stage === 'usernames' && (
              <>
                Three computers. Choose a player to hack. Costs{' '}
                <b className="text-[#5eead4]">{hackCost} tokens</b>.
              </>
            )}
            {stage === 'passwords' && (
              <>
                Three possible passwords for{' '}
                <span className="font-bold text-[var(--green-l)]">
                  {pickedTarget?.handle}
                </span>
                . Tap the one you think is real.
              </>
            )}
            {stage === 'result' && outcome === 'correct' && (
              <span className="text-[#86efac] font-bold">
                You picked the right password.
              </span>
            )}
            {stage === 'result' && outcome === 'wrong' && (
              <span className="text-[#fda4af] font-bold">
                The password you picked is not correct.
              </span>
            )}
          </motion.p>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {(stage === 'passwords' || stage === 'result') && pickedTarget && (
          <motion.div
            key="pill"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="flex justify-center"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position: 'relative', minHeight: 220 }}>
        <AnimatePresence mode="wait">
          {stage === 'usernames' && (
            <motion.div
              key="usernames"
              variants={stageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-3 gap-4 px-1"
            >
              {targets.map((p, i) => (
                <ComputerTile
                  key={p.id}
                  label={p.handle}
                  glowColor={STAGE1_COLORS[i % STAGE1_COLORS.length]}
                  state="idle"
                  onClick={() => pickTarget(p)}
                />
              ))}
            </motion.div>
          )}
          {(stage === 'passwords' || stage === 'result') && (
            <motion.div
              key="passwords"
              variants={stageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-3 gap-4 px-1"
            >
              {passwordTiles.map((c, i) => {
                let tileState: TileState = 'idle'
                if (stage === 'result' && i === pickedPwIdx) {
                  tileState = outcome === 'correct' ? 'pickedCorrect' : 'pickedWrong'
                }
                return (
                  <ComputerTile
                    key={i}
                    label={c.label}
                    glowColor="#f97316"
                    state={tileState}
                    onClick={stage === 'passwords' ? () => pickPassword(i) : undefined}
                    disabled={stage === 'result'}
                  />
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {stage !== 'result' && (
        <button onClick={onClose} className="fg-back w-full justify-center">
          Cancel
        </button>
      )}
    </div>
  )
}
