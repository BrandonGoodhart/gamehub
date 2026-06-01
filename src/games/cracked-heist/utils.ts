const CODE_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode(): string {
  let s = ''
  for (let i = 0; i < 6; i++) {
    s += CODE_ALPHA[Math.floor(Math.random() * CODE_ALPHA.length)]
  }
  return s
}

export const PASSWORD_POOL = [
  'GHOST',
  'DRAGON',
  'NINJA',
  'WIZARD',
  'EAGLE',
  'TIGER',
  'SHARK',
  'ROBOT',
]

export function generatePassword(): string {
  return PASSWORD_POOL[Math.floor(Math.random() * PASSWORD_POOL.length)]
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
