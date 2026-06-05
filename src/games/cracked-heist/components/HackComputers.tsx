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

interface Tile {
  targetId: string
  password: string
  isReal: boolean
}

function buildBoard(targets: Player[]): Tile[][] {
  return targets.map((t) => {
    // Use that player's actual 3 options. One is real (their picked password),
    // the other two are decoys allocated for them at join time.
    const options = (t.passwordOptions && t.passwordOptions.length === 3)
      ? [...t.passwordOptions]
      : [t.password, t.password + '_a', t.password + '_b']
    // Shuffle so the real one isn't always in the same slot
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }
    return options.map((pw) => ({
      targetId: t.id,
      password: pw,
      isReal: pw === t.password,
    }))
  })
}

export default function HackComputers({ hackCost, tokens, targets, onResult, onClose }: Props) {
  const board = useMemo(() => buildBoard(targets), [targets])
  const [pickedTile, setPickedTile] = useState<{ col: number; row: number } | null>(null)
  const [outcome, setOutcome] = useState<'right' | 'wrong' | null>(null)
  const canHack = tokens >= hackCost && targets.length >= 3

  function pick(col: number, row: number) {
    if (pickedTile !== null) return
    const tile = board[col][row]
    setPickedTile({ col, row })
    const correct = tile.isReal
    setOutcome(correct ? 'right' : 'wrong')
    setTimeout(() => onResult(tile.targetId, correct), 1300)
  }

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

  return (
    <div className="space-y-4">
      <p className="fg-sub text-sm">
        Three computers. Each one shows three passwords — one is real. Tap the
        password you think actually belongs to that player. Costs{' '}
        <b className="text-[#5eead4]">{hackCost} tokens</b>.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {board.map((tiles, col) => {
          const player = targets[col]
          return (
            <div key={player.id} className="flex flex-col gap-2">
              <div
                className="rounded-xl px-1 py-1.5 text-center font-extrabold text-xs truncate"
                style={{
                  background: player.avatar.color,
                  color: '#0a0a0a',
                  boxShadow: `0 4px 12px ${player.avatar.color}66`,
                }}
              >
                {player.handle}
              </div>
              {tiles.map((tile, row) => {
                const isPicked = pickedTile?.col === col && pickedTile?.row === row
                const revealed = pickedTile !== null
                const showReal = revealed && isPicked && outcome === 'right'
                const showWrong = revealed && isPicked && outcome === 'wrong'
                return (
                  <motion.button
                    key={row}
                    whileHover={pickedTile === null ? { y: -2 } : {}}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => pick(col, row)}
                    disabled={pickedTile !== null}
                    className="rounded-xl px-1 py-2 text-center font-extrabold text-[10px] sm:text-xs transition-all break-all leading-tight"
                    style={{
                      background: showReal
                        ? 'linear-gradient(135deg,#22c55e,#4ade80)'
                        : showWrong
                          ? 'linear-gradient(135deg,#fb7185,#e11d48)'
                          : 'rgba(255,255,255,0.04)',
                      border: showReal
                        ? '2px solid #86efac'
                        : showWrong
                          ? '2px solid #fda4af'
                          : '2px solid rgba(74,222,128,0.2)',
                      color: showReal ? '#052e16' : '#fff',
                      cursor: pickedTile !== null ? 'default' : 'pointer',
                      fontFamily:
                        'JetBrains Mono, SF Mono, ui-monospace, monospace',
                      letterSpacing: '0.01em',
                      opacity: revealed && !isPicked ? 0.4 : 1,
                    }}
                  >
                    {tile.password}
                  </motion.button>
                )
              })}
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {outcome && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl p-4 text-center font-extrabold"
            style={{
              background:
                outcome === 'right'
                  ? 'rgba(74,222,128,0.15)'
                  : 'rgba(251,113,133,0.15)',
              border:
                outcome === 'right'
                  ? '2px solid rgba(74,222,128,0.5)'
                  : '2px solid rgba(251,113,133,0.5)',
              color: outcome === 'right' ? '#86efac' : '#fda4af',
              fontSize: '1.05rem',
            }}
          >
            {outcome === 'right' ? 'HACK SUCCESS' : 'WRONG PASSWORD'}
          </motion.div>
        )}
      </AnimatePresence>

      {pickedTile === null && (
        <button onClick={onClose} className="fg-back w-full justify-center">
          Cancel
        </button>
      )}
    </div>
  )
}
