import type { Card, HandResult } from './types'
import { getRankValue } from './deck'

function getCombinations(cards: Card[], size: number): Card[][] {
  const results: Card[][] = []
  function combine(start: number, combo: Card[]) {
    if (combo.length === size) {
      results.push([...combo])
      return
    }
    for (let i = start; i < cards.length; i++) {
      combo.push(cards[i])
      combine(i + 1, combo)
      combo.pop()
    }
  }
  combine(0, [])
  return results
}

function evaluateFiveCards(cards: Card[]): HandResult {
  const values = cards.map((c) => getRankValue(c.rank)).sort((a, b) => b - a)
  const suits = cards.map((c) => c.suit)

  const isFlush = suits.every((s) => s === suits[0])

  // Check straight
  let isStraight = false
  let straightHigh = values[0]
  const unique = [...new Set(values)]
  if (unique.length === 5) {
    if (unique[0] - unique[4] === 4) {
      isStraight = true
      straightHigh = unique[0]
    }
    // Ace-low straight (A-2-3-4-5)
    if (unique[0] === 14 && unique[1] === 5 && unique[2] === 4 && unique[3] === 3 && unique[4] === 2) {
      isStraight = true
      straightHigh = 5
    }
  }

  // Count occurrences
  const counts: Record<number, number> = {}
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1
  }
  const groups = Object.entries(counts)
    .map(([val, count]) => ({ val: Number(val), count }))
    .sort((a, b) => b.count - a.count || b.val - a.val)

  // Royal Flush
  if (isFlush && isStraight && straightHigh === 14) {
    return { rank: 'Royal Flush', rankValue: 9, tiebreakers: [14], description: 'Royal Flush' }
  }

  // Straight Flush
  if (isFlush && isStraight) {
    return { rank: 'Straight Flush', rankValue: 8, tiebreakers: [straightHigh], description: `Straight Flush, ${straightHigh} high` }
  }

  // Four of a Kind
  if (groups[0].count === 4) {
    return { rank: 'Four of a Kind', rankValue: 7, tiebreakers: [groups[0].val, groups[1].val], description: `Four of a Kind, ${groups[0].val}s` }
  }

  // Full House
  if (groups[0].count === 3 && groups[1].count === 2) {
    return { rank: 'Full House', rankValue: 6, tiebreakers: [groups[0].val, groups[1].val], description: `Full House, ${groups[0].val}s full of ${groups[1].val}s` }
  }

  // Flush
  if (isFlush) {
    return { rank: 'Flush', rankValue: 5, tiebreakers: values, description: `Flush, ${values[0]} high` }
  }

  // Straight
  if (isStraight) {
    return { rank: 'Straight', rankValue: 4, tiebreakers: [straightHigh], description: `Straight, ${straightHigh} high` }
  }

  // Three of a Kind
  if (groups[0].count === 3) {
    const kickers = groups.filter((g) => g.count === 1).map((g) => g.val)
    return { rank: 'Three of a Kind', rankValue: 3, tiebreakers: [groups[0].val, ...kickers], description: `Three of a Kind, ${groups[0].val}s` }
  }

  // Two Pair
  if (groups[0].count === 2 && groups[1].count === 2) {
    const pairs = [groups[0].val, groups[1].val].sort((a, b) => b - a)
    const kicker = groups[2].val
    return { rank: 'Two Pair', rankValue: 2, tiebreakers: [...pairs, kicker], description: `Two Pair, ${pairs[0]}s and ${pairs[1]}s` }
  }

  // One Pair
  if (groups[0].count === 2) {
    const kickers = groups.filter((g) => g.count === 1).map((g) => g.val)
    return { rank: 'One Pair', rankValue: 1, tiebreakers: [groups[0].val, ...kickers], description: `Pair of ${groups[0].val}s` }
  }

  // High Card
  return { rank: 'High Card', rankValue: 0, tiebreakers: values, description: `High Card ${values[0]}` }
}

export function evaluateBestHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const allCards = [...holeCards, ...communityCards]
  const combos = getCombinations(allCards, 5)
  let best: HandResult | null = null

  for (const combo of combos) {
    const result = evaluateFiveCards(combo)
    if (!best || compareHands(result, best) > 0) {
      best = result
    }
  }

  return best!
}

export function compareHands(a: HandResult, b: HandResult): number {
  if (a.rankValue !== b.rankValue) return a.rankValue - b.rankValue
  for (let i = 0; i < Math.max(a.tiebreakers.length, b.tiebreakers.length); i++) {
    const av = a.tiebreakers[i] ?? 0
    const bv = b.tiebreakers[i] ?? 0
    if (av !== bv) return av - bv
  }
  return 0
}
