import type { RoomState, SharedGame } from './types'

// Cross-device share codes: the code IS a URL-safe base64 encoding of the
// leaderboard data. Anyone with the code (on any device) can decode it.
// No backend or shared storage required.

function toBase64Url(input: string): string {
  // btoa needs ASCII; encodeURIComponent first to handle UTF-8
  const b64 = btoa(unescape(encodeURIComponent(input)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (padded.length % 4)) % 4)
  return decodeURIComponent(escape(atob(padded + padding)))
}

// Compact JSON shape — short keys keep the code shorter.
interface CompactGame {
  v: 1
  c: string | null
  s: number
  p: { h: string; c: string; n: number; t: number; k: number; g: number }[]
}

export function encodeGame(state: RoomState): string {
  const compact: CompactGame = {
    v: 1,
    c: state.category,
    s: state.settings.roundSeconds,
    p: state.players.map((p) => ({
      h: p.handle,
      c: p.avatar.color,
      n: p.coins,
      t: p.tokens,
      k: p.hacksDone,
      g: p.caughtCount,
    })),
  }
  return toBase64Url(JSON.stringify(compact))
}

export function decodeGame(code: string): SharedGame | null {
  const trimmed = code.trim()
  if (!trimmed) return null
  try {
    const json = fromBase64Url(trimmed)
    const data = JSON.parse(json) as CompactGame
    if (!data || data.v !== 1 || !Array.isArray(data.p)) return null
    return {
      code: trimmed,
      finishedAt: 0,
      category: data.c,
      seconds: data.s,
      players: data.p.map((x) => ({
        handle: x.h,
        color: x.c,
        coins: x.n,
        tokens: x.t,
        hacks: x.k,
        caught: x.g,
      })),
      log: [],
    }
  } catch {
    return null
  }
}

// Persist + return a portable code that decodes on any device.
export function persistGame(state: RoomState): string {
  return encodeGame(state)
}

// Lookup: just decode the code. Cross-device works because the data is in the code.
export function getShared(code: string): SharedGame | null {
  return decodeGame(code)
}
