import type { Player, Question } from './types'
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
