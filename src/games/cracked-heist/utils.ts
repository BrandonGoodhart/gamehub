const CODE_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode(): string {
  let s = ''
  for (let i = 0; i < 6; i++) {
    s += CODE_ALPHA[Math.floor(Math.random() * CODE_ALPHA.length)]
  }
  return s
}

const PW_PREFIXES = [
  'play', 'fast', 'good', 'cool', 'bold', 'safe', 'lock', 'cast',
  'soft', 'jump', 'kick', 'wave', 'mute', 'echo', 'glow', 'mint',
  'rush', 'noon', 'star', 'leaf', 'wolf', 'drop', 'fizz', 'gear',
]
const PW_CHARS = 'abcdefghijklmnpqrstuvwxyz23456789'

export function generateUniquePassword(taken: Set<string>): string {
  for (let tries = 0; tries < 100; tries++) {
    const prefix = PW_PREFIXES[Math.floor(Math.random() * PW_PREFIXES.length)]
    let suffix = ''
    for (let i = 0; i < 4; i++) suffix += PW_CHARS[Math.floor(Math.random() * PW_CHARS.length)]
    const pw = `${prefix}-${suffix}`
    if (!taken.has(pw)) {
      taken.add(pw)
      return pw
    }
  }
  // Extremely unlikely fallback — millisecond timestamp tail
  const fallback = `pw-${Date.now().toString(36).slice(-6)}`
  taken.add(fallback)
  return fallback
}

export function makePasswordOptions(count: number, taken: Set<string>): string[] {
  const out: string[] = []
  for (let i = 0; i < count; i++) out.push(generateUniquePassword(taken))
  return out
}

// Legacy — still used in a couple places. Now generates a random unique-looking one.
export function generatePassword(): string {
  return generateUniquePassword(new Set())
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(idx, 1)[0])
  }
  return out
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}
