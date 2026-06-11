import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Player } from '../types'
import AvatarSvg from './AvatarSvg'

interface Props {
  options: string[]
  lockedPassword: string | null
  players?: Player[]
  isHost?: boolean
  showStart?: boolean // host sees a Start Game button in pre-game; not in late-join
  onLock: (password: string) => void
  onStart?: () => void
}

export default function PasswordPickPhase({
  options,
  lockedPassword,
  players,
  isHost = false,
  showStart = false,
  onLock,
  onStart,
}: Props) {
  const [picked, setPicked] = useState<string | null>(null)
  const isLocked = !!lockedPassword

  const humans = players?.filter((p) => p.isHuman) ?? []
  const unlockedHumans = humans.filter((p) => !p.passwordLocked)
  const allHumansLocked = humans.length > 0 && unlockedHumans.length === 0

  return (
    <div className="max-w-[440px] mx-auto w-full space-y-5 pb-5">
      <div className="text-center">
        <div className="fg-lbl mb-2">/ choose your password</div>
        <h1
          className="fg-display"
          style={{ fontSize: 'clamp(2rem, 7vw, 3rem)', padding: '0 8px' }}
        >
          {isLocked ? 'Locked In' : 'Pick Your Password'}
        </h1>
        <p className="fg-sub text-xs mt-1">
          {isLocked
            ? 'You picked one. Wait for the others.'
            : "These three options are yours alone — nobody else can have them. Don't show your screen to anyone."}
        </p>
      </div>

      <div className="fg-panel p-5">
        <div className="grid grid-cols-1 gap-3">
          {options.map((pw) => {
            const active = !isLocked && picked === pw
            const isThisLocked = isLocked && lockedPassword === pw
            return (
              <motion.button
                key={pw}
                whileHover={!isLocked ? { y: -2 } : {}}
                whileTap={!isLocked ? { scale: 0.96 } : {}}
                onClick={() => !isLocked && setPicked(pw)}
                disabled={isLocked}
                className="rounded-2xl p-4 font-extrabold text-center transition-all"
                style={{
                  background: isThisLocked
                    ? 'rgba(120,120,120,0.25)'
                    : active
                      ? 'linear-gradient(135deg, #22c55e, #4ade80, #a3e635)'
                      : isLocked
                        ? 'rgba(120,120,120,0.10)'
                        : 'rgba(255,255,255,0.04)',
                  border: isThisLocked
                    ? '2px solid rgba(200,200,200,0.55)'
                    : active
                      ? '2px solid rgba(74,222,128,0.7)'
                      : isLocked
                        ? '2px solid rgba(120,120,120,0.25)'
                        : '2px solid rgba(74,222,128,0.18)',
                  color: isThisLocked
                    ? '#9ca3af'
                    : active
                      ? '#052e16'
                      : isLocked
                        ? '#6b7280'
                        : '#fff',
                  boxShadow: active
                    ? '0 0 22px rgba(74,222,128,0.5)'
                    : '0 4px 14px rgba(0,0,0,0.3)',
                  fontSize: '1.15rem',
                  letterSpacing: '0.04em',
                  fontFamily: 'JetBrains Mono, SF Mono, ui-monospace, monospace',
                  cursor: isLocked ? 'default' : 'pointer',
                }}
              >
                {pw}
                {isThisLocked && (
                  <span className="ml-3 text-xs font-bold" style={{ opacity: 0.85 }}>
                    ✓ locked
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {!isLocked && (
        <motion.button
          whileHover={picked ? { y: -2 } : {}}
          whileTap={picked ? { scale: 0.97 } : {}}
          disabled={!picked}
          onClick={() => picked && onLock(picked)}
          className="fg-btn fg-btn-grad"
        >
          {picked ? `Lock In  ${picked}  →` : 'Pick One Above'}
        </motion.button>
      )}

      {/* Locked status for joiners or host while waiting */}
      {isLocked && players && (
        <div className="fg-panel p-4 space-y-2">
          <div className="fg-lbl mb-1 text-center">
            {allHumansLocked ? 'all players locked in' : 'waiting for players'}
          </div>
          <div className="space-y-1.5">
            {humans.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg px-3 py-1.5"
                style={{
                  background: p.passwordLocked
                    ? 'rgba(74,222,128,0.08)'
                    : 'rgba(255,255,255,0.03)',
                  border: p.passwordLocked
                    ? '1px solid rgba(74,222,128,0.22)'
                    : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center gap-2">
                  <AvatarSvg avatar={p.avatar} size={22} initial={p.handle} />
                  <span className="font-bold text-sm text-white">{p.handle}</span>
                </div>
                <span
                  className="text-[11px] font-extrabold uppercase tracking-wider"
                  style={{
                    color: p.passwordLocked ? '#86efac' : '#fbbf24',
                  }}
                >
                  {p.passwordLocked ? 'locked' : 'picking…'}
                </span>
              </div>
            ))}
          </div>

          {isHost && showStart && (
            <motion.button
              whileHover={allHumansLocked ? { y: -2 } : {}}
              whileTap={allHumansLocked ? { scale: 0.97 } : {}}
              disabled={!allHumansLocked}
              onClick={onStart}
              className="fg-btn fg-btn-grad mt-3"
              style={{
                opacity: allHumansLocked ? 1 : 0.45,
                cursor: allHumansLocked ? 'pointer' : 'not-allowed',
              }}
            >
              {allHumansLocked
                ? 'Start Game →'
                : `Waiting for ${unlockedHumans.length} player${unlockedHumans.length === 1 ? '' : 's'}…`}
            </motion.button>
          )}

          {!isHost && (
            <p className="fg-sub text-[11px] text-center mt-2">
              {allHumansLocked
                ? 'Everyone locked in. Waiting for the host to start.'
                : 'Once everyone locks in, the host can start the game.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
