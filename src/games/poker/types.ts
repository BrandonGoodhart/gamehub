export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  suit: Suit
  rank: Rank
}

export type ChipColor = 'white' | 'red' | 'blue' | 'green' | 'black'

export interface ChipDenomination {
  color: ChipColor
  value: number
  hex: string
}

export const CHIP_DENOMINATIONS: ChipDenomination[] = [
  { color: 'white', value: 1, hex: '#e5e7eb' },
  { color: 'red', value: 5, hex: '#ef4444' },
  { color: 'blue', value: 10, hex: '#3b82f6' },
  { color: 'green', value: 25, hex: '#22c55e' },
  { color: 'black', value: 100, hex: '#1f2937' },
]

export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in'

export interface Player {
  id: number
  name: string
  chips: number
  hand: Card[]
  currentBet: number
  folded: boolean
  isAllIn: boolean
  isDealer: boolean
}

export type GamePhase = 'setup' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'

export type HandRank =
  | 'Royal Flush'
  | 'Straight Flush'
  | 'Four of a Kind'
  | 'Full House'
  | 'Flush'
  | 'Straight'
  | 'Three of a Kind'
  | 'Two Pair'
  | 'One Pair'
  | 'High Card'

export interface HandResult {
  rank: HandRank
  rankValue: number
  tiebreakers: number[]
  description: string
}
