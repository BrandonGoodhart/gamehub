import type { RoomState, SharedGame } from './types'

const KEY = 'crackedHeist:shared'

function load(): Record<string, SharedGame> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function save(map: Record<string, SharedGame>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

function genCode(): string {
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += alpha[Math.floor(Math.random() * alpha.length)]
  return s
}

export function persistGame(state: RoomState): string {
  const map = load()
  let code = genCode()
  while (map[code]) code = genCode()
  const summary: SharedGame = {
    code,
    finishedAt: Date.now(),
    category: state.category,
    rounds: state.round,
    players: state.players.map((p) => ({
      handle: p.handle,
      color: p.avatar.color,
      coins: p.coins,
      hacks: p.hacksDone,
      caught: p.caughtCount,
    })),
  }
  map[code] = summary
  save(map)
  return code
}

export function getShared(code: string): SharedGame | null {
  const map = load()
  return map[code.toUpperCase()] ?? null
}
