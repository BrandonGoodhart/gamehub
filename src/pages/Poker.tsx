import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router'
import type { Player, Card, GamePhase } from '../games/poker/types'
import { CHIP_DENOMINATIONS } from '../games/poker/types'
import { createDeck, shuffleDeck } from '../games/poker/deck'
import { evaluateBestHand, compareHands } from '../games/poker/evaluate'
import PlayingCard from '../games/poker/components/PlayingCard'
import PlayerSeat from '../games/poker/components/PlayerSeat'
import PokerChip from '../games/poker/components/PokerChip'

const SMALL_BLIND = 5
const BIG_BLIND = 10
const STARTING_CHIPS = 500

interface GameState {
  players: Player[]
  deck: Card[]
  communityCards: Card[]
  pot: number
  phase: GamePhase
  currentPlayerIndex: number
  highestBet: number
  deckIndex: number
  dealerIndex: number
  lastRaiseIndex: number
  winners: number[] | null
  winningHand: string | null
  playerCount: number
}

function createInitialState(playerCount: number): GameState {
  const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
    id: i,
    name: `Player ${i + 1}`,
    chips: STARTING_CHIPS,
    hand: [],
    currentBet: 0,
    folded: false,
    isAllIn: false,
    isDealer: i === 0,
  }))
  return {
    players,
    deck: [],
    communityCards: [],
    pot: 0,
    phase: 'setup',
    currentPlayerIndex: 0,
    highestBet: 0,
    deckIndex: 0,
    dealerIndex: 0,
    lastRaiseIndex: -1,
    winners: null,
    winningHand: null,
    playerCount,
  }
}

function nextActivePlayer(players: Player[], fromIndex: number): number {
  let idx = (fromIndex + 1) % players.length
  while (players[idx].folded || players[idx].isAllIn) {
    idx = (idx + 1) % players.length
    if (idx === fromIndex) return fromIndex
  }
  return idx
}

function activePlayers(players: Player[]): Player[] {
  return players.filter((p) => !p.folded)
}

function playersWhoCanAct(players: Player[]): Player[] {
  return players.filter((p) => !p.folded && !p.isAllIn)
}

export default function Poker() {
  const [game, setGame] = useState<GameState>(createInitialState(2))
  const [raiseAmount, setRaiseAmount] = useState(BIG_BLIND)
  const [message, setMessage] = useState('')

  const currentPlayer = game.players[game.currentPlayerIndex]

  const startNewHand = useCallback(() => {
    setGame((prev) => {
      const playerCount = prev.playerCount
      const dealerIndex = prev.phase === 'setup' ? 0 : (prev.dealerIndex + 1) % playerCount
      const deck = shuffleDeck(createDeck())
      let deckIdx = 0

      const players: Player[] = prev.players.map((p, i) => ({
        ...p,
        hand: [deck[deckIdx + i * 2], deck[deckIdx + i * 2 + 1]],
        currentBet: 0,
        folded: false,
        isAllIn: false,
        isDealer: i === dealerIndex,
        chips: prev.phase === 'setup' ? STARTING_CHIPS : p.chips,
      }))
      deckIdx += playerCount * 2

      // Post blinds
      const sbIndex = (dealerIndex + 1) % playerCount
      const bbIndex = (dealerIndex + 2) % playerCount

      const sbAmount = Math.min(SMALL_BLIND, players[sbIndex].chips)
      players[sbIndex].chips -= sbAmount
      players[sbIndex].currentBet = sbAmount
      if (players[sbIndex].chips === 0) players[sbIndex].isAllIn = true

      const bbAmount = Math.min(BIG_BLIND, players[bbIndex].chips)
      players[bbIndex].chips -= bbAmount
      players[bbIndex].currentBet = bbAmount
      if (players[bbIndex].chips === 0) players[bbIndex].isAllIn = true

      const pot = sbAmount + bbAmount

      // Action starts after big blind
      const firstToAct = nextActivePlayer(players, bbIndex)

      setMessage(`Blinds posted. ${players[firstToAct].name}'s turn.`)
      setRaiseAmount(BIG_BLIND)

      return {
        ...prev,
        players,
        deck,
        communityCards: [],
        pot,
        phase: 'preflop',
        currentPlayerIndex: firstToAct,
        highestBet: BIG_BLIND,
        deckIndex: deckIdx,
        dealerIndex,
        lastRaiseIndex: bbIndex,
        winners: null,
        winningHand: null,
      }
    })
  }, [])

  const advancePhase = useCallback((state: GameState): GameState => {
    const active = activePlayers(state.players)
    if (active.length === 1) {
      // Everyone else folded
      const winner = active[0]
      const players = state.players.map((p) =>
        p.id === winner.id ? { ...p, chips: p.chips + state.pot, currentBet: 0 } : { ...p, currentBet: 0 },
      )
      setMessage(`${winner.name} wins $${state.pot}!`)
      return { ...state, players, pot: 0, phase: 'showdown', winners: [winner.id], winningHand: 'Last player standing' }
    }

    const phaseOrder: GamePhase[] = ['preflop', 'flop', 'turn', 'river', 'showdown']
    const nextPhaseIndex = phaseOrder.indexOf(state.phase) + 1
    const nextPhase = phaseOrder[nextPhaseIndex]

    // Reset bets for new round
    const players = state.players.map((p) => ({ ...p, currentBet: 0 }))
    let { deckIndex, communityCards, deck } = state

    if (nextPhase === 'flop') {
      communityCards = [deck[deckIndex], deck[deckIndex + 1], deck[deckIndex + 2]]
      deckIndex += 3
    } else if (nextPhase === 'turn' || nextPhase === 'river') {
      communityCards = [...communityCards, deck[deckIndex]]
      deckIndex += 1
    }

    if (nextPhase === 'showdown') {
      // Evaluate hands
      const results = active.map((p) => ({
        player: p,
        result: evaluateBestHand(p.hand, communityCards),
      }))
      results.sort((a, b) => compareHands(b.result, a.result))

      const bestResult = results[0].result
      const winners = results.filter((r) => compareHands(r.result, bestResult) === 0)
      const splitPot = Math.floor(state.pot / winners.length)

      const finalPlayers = players.map((p) => {
        const isWinner = winners.some((w) => w.player.id === p.id)
        return isWinner ? { ...p, chips: p.chips + splitPot } : p
      })

      const winnerNames = winners.map((w) => w.player.name).join(' & ')
      setMessage(`${winnerNames} wins with ${bestResult.description}! ($${state.pot})`)

      return {
        ...state,
        players: finalPlayers,
        communityCards,
        deckIndex,
        phase: 'showdown',
        highestBet: 0,
        winners: winners.map((w) => w.player.id),
        winningHand: bestResult.description,
      }
    }

    // Find first active player after dealer
    const firstToAct = nextActivePlayer(players, state.dealerIndex)
    setMessage(`${players[firstToAct].name}'s turn.`)

    return {
      ...state,
      players,
      communityCards,
      deckIndex,
      phase: nextPhase,
      currentPlayerIndex: firstToAct,
      highestBet: 0,
      lastRaiseIndex: -1,
    }
  }, [])

  const checkRoundComplete = useCallback(
    (state: GameState): GameState => {
      const canAct = playersWhoCanAct(state.players)

      if (canAct.length === 0) {
        return advancePhase(state)
      }

      // Check if all active players have matched the highest bet
      const allMatched = canAct.every((p) => p.currentBet === state.highestBet)
      const nextIdx = nextActivePlayer(state.players, state.currentPlayerIndex)

      if (allMatched && (state.lastRaiseIndex === -1 || nextIdx === state.lastRaiseIndex)) {
        return advancePhase(state)
      }

      // Check if only one non-folded player remains
      if (activePlayers(state.players).length === 1) {
        return advancePhase(state)
      }

      setMessage(`${state.players[nextIdx].name}'s turn.`)
      return { ...state, currentPlayerIndex: nextIdx }
    },
    [advancePhase],
  )

  const handleAction = useCallback(
    (action: 'fold' | 'check' | 'call' | 'raise' | 'all-in') => {
      setGame((prev) => {
        const idx = prev.currentPlayerIndex
        const player = { ...prev.players[idx] }
        const players = prev.players.map((p) => ({ ...p }))
        let { pot, highestBet, lastRaiseIndex } = prev

        switch (action) {
          case 'fold':
            player.folded = true
            break

          case 'check':
            if (player.currentBet < highestBet) return prev
            break

          case 'call': {
            const callAmount = Math.min(highestBet - player.currentBet, player.chips)
            player.chips -= callAmount
            player.currentBet += callAmount
            pot += callAmount
            if (player.chips === 0) player.isAllIn = true
            break
          }

          case 'raise': {
            const totalBet = Math.min(raiseAmount, player.chips + player.currentBet)
            const raiseBy = totalBet - player.currentBet
            player.chips -= raiseBy
            player.currentBet = totalBet
            pot += raiseBy
            highestBet = totalBet
            lastRaiseIndex = idx
            if (player.chips === 0) player.isAllIn = true
            break
          }

          case 'all-in': {
            const allInAmount = player.chips
            player.currentBet += allInAmount
            pot += allInAmount
            player.chips = 0
            player.isAllIn = true
            if (player.currentBet > highestBet) {
              highestBet = player.currentBet
              lastRaiseIndex = idx
            }
            break
          }
        }

        players[idx] = player

        const newState = { ...prev, players, pot, highestBet, lastRaiseIndex }
        return checkRoundComplete(newState)
      })
    },
    [raiseAmount, checkRoundComplete],
  )

  const canCheck = currentPlayer && currentPlayer.currentBet >= game.highestBet
  const callAmount = currentPlayer ? game.highestBet - currentPlayer.currentBet : 0

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-8 gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/" className="text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <motion.h1
          className="text-3xl font-bold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Texas Hold'em
        </motion.h1>
      </div>

      {/* Setup */}
      {game.phase === 'setup' && (
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-gray-400">Number of players</span>
            <div className="flex gap-2">
              {[2, 3].map((n) => (
                <button
                  key={n}
                  className={`px-6 py-2 rounded-lg font-bold cursor-pointer transition-colors ${
                    game.playerCount === n
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setGame(createInitialState(n))}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            {CHIP_DENOMINATIONS.map((chip) => (
              <div key={chip.color} className="flex flex-col items-center gap-1">
                <PokerChip chip={chip} size="lg" />
                <span className="text-xs text-gray-500">${chip.value}</span>
              </div>
            ))}
          </div>

          <p className="text-gray-500 text-sm">
            Starting chips: ${STARTING_CHIPS} | Blinds: ${SMALL_BLIND}/${BIG_BLIND}
          </p>

          <motion.button
            className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg cursor-pointer transition-colors"
            onClick={startNewHand}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Deal
          </motion.button>
        </motion.div>
      )}

      {/* Game Table */}
      {game.phase !== 'setup' && (
        <>
          {/* Message */}
          <AnimatePresence mode="wait">
            <motion.div
              key={message}
              className="text-lg text-gray-300 font-semibold text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              {message}
            </motion.div>
          </AnimatePresence>

          {/* Pot */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              <div className="w-5 h-5 rounded-full bg-red-500 border border-red-400" />
              <div className="w-5 h-5 rounded-full bg-blue-500 border border-blue-400" />
              <div className="w-5 h-5 rounded-full bg-green-500 border border-green-400" />
            </div>
            <span className="text-xl font-mono font-bold text-yellow-400">Pot: ${game.pot}</span>
          </div>

          {/* Community Cards */}
          <div className="flex gap-2 min-h-[7rem] items-center">
            {game.communityCards.length === 0 && game.phase === 'preflop' && (
              <span className="text-gray-600 italic">Community cards dealt after preflop</span>
            )}
            {game.communityCards.map((card, i) => (
              <PlayingCard key={`${card.rank}-${card.suit}`} card={card} delay={i * 0.15} />
            ))}
          </div>

          {/* Players */}
          <div className={`grid gap-4 w-full max-w-3xl ${game.playerCount === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {game.players.map((player) => (
              <PlayerSeat
                key={player.id}
                player={player}
                isActive={game.currentPlayerIndex === player.id && game.phase !== 'showdown'}
                phase={game.phase}
                revealCards={game.phase === 'showdown' || game.currentPlayerIndex === player.id}
              />
            ))}
          </div>

          {/* Actions */}
          {game.phase !== 'showdown' && (
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-sm text-gray-400 font-semibold">
                {currentPlayer?.name}'s actions
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  className="px-4 py-2 rounded-lg bg-red-900/50 border border-red-700 hover:bg-red-800 text-red-300 font-semibold cursor-pointer transition-colors"
                  onClick={() => handleAction('fold')}
                >
                  Fold
                </button>

                {canCheck && (
                  <button
                    className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 hover:bg-gray-700 text-gray-300 font-semibold cursor-pointer transition-colors"
                    onClick={() => handleAction('check')}
                  >
                    Check
                  </button>
                )}

                {!canCheck && callAmount > 0 && (
                  <button
                    className="px-4 py-2 rounded-lg bg-blue-900/50 border border-blue-700 hover:bg-blue-800 text-blue-300 font-semibold cursor-pointer transition-colors"
                    onClick={() => handleAction('call')}
                  >
                    Call ${callAmount}
                  </button>
                )}

                <div className="flex items-center gap-1">
                  <button
                    className="px-4 py-2 rounded-lg bg-green-900/50 border border-green-700 hover:bg-green-800 text-green-300 font-semibold cursor-pointer transition-colors"
                    onClick={() => handleAction('raise')}
                  >
                    Raise to ${raiseAmount}
                  </button>
                  <input
                    type="range"
                    min={game.highestBet + BIG_BLIND}
                    max={currentPlayer ? currentPlayer.chips + currentPlayer.currentBet : 0}
                    value={raiseAmount}
                    onChange={(e) => setRaiseAmount(Number(e.target.value))}
                    className="w-24 accent-green-500"
                  />
                </div>

                <button
                  className="px-4 py-2 rounded-lg bg-yellow-900/50 border border-yellow-700 hover:bg-yellow-800 text-yellow-300 font-semibold cursor-pointer transition-colors"
                  onClick={() => handleAction('all-in')}
                >
                  All In (${currentPlayer?.chips})
                </button>
              </div>

              {/* Chip buttons for quick raise amounts */}
              <div className="flex gap-2">
                {CHIP_DENOMINATIONS.map((chip) => (
                  <PokerChip
                    key={chip.color}
                    chip={chip}
                    size="sm"
                    onClick={() => {
                      const newAmount = Math.max(
                        game.highestBet + BIG_BLIND,
                        game.highestBet + chip.value,
                      )
                      const maxBet = currentPlayer ? currentPlayer.chips + currentPlayer.currentBet : 0
                      setRaiseAmount(Math.min(newAmount, maxBet))
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Showdown */}
          {game.phase === 'showdown' && (
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {game.winningHand && (
                <div className="text-purple-300 font-semibold">{game.winningHand}</div>
              )}

              <div className="flex gap-3">
                <motion.button
                  className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer transition-colors"
                  onClick={startNewHand}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Next Hand
                </motion.button>
                <motion.button
                  className="px-6 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold cursor-pointer transition-colors"
                  onClick={() => setGame(createInitialState(game.playerCount))}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  New Game
                </motion.button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
