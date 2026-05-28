import type { Player, Question, RoomState } from './types'
import { pick } from './utils'

export function botAnswer(q: Question, skill: number): number {
  if (Math.random() < skill) return q.answer
  const wrong = q.choices.map((_, i) => i).filter((i) => i !== q.answer)
  return pick(wrong)
}

export function botSkill(p: Player): number {
  const base = 0.55
  const hash = [...p.id].reduce((a, c) => a + c.charCodeAt(0), 0)
  return Math.min(0.92, base + (hash % 30) / 100)
}

export interface BotDecision {
  kind: 'spy' | 'hack' | 'password' | 'idle'
  targetId?: string
  passwordGuess?: string
}

export function botDecideAction(state: RoomState, bot: Player): BotDecision {
  const me = bot
  const others = state.players.filter((p) => p.id !== me.id && p.alive)
  if (others.length === 0) return { kind: 'idle' }

  const c = state.settings.costs
  const recentlyHacked = (p: Player) =>
    p.hackedInRounds.some((r) => r >= state.round - 2)

  const targets = others.filter(recentlyHacked)
  if (targets.length > 0 && me.coins >= c.spy && Math.random() < 0.55) {
    return { kind: 'spy', targetId: pick(targets).id }
  }

  if (me.coins >= c.password && Math.random() < 0.18) {
    const t = pick(others)
    const guess = pick(['hunter2', 'qwerty', 'iloveu', 'abc123', 'letmein', 'p@ss', 'dragon', 'matrix', 'admin', 'root', 'snake', 'ghost'])
    return { kind: 'password', targetId: t.id, passwordGuess: guess }
  }

  if (me.coins >= c.hack && Math.random() < 0.35) {
    return { kind: 'hack' }
  }

  return { kind: 'idle' }
}
