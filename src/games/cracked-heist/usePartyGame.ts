import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import PartySocket from 'partysocket'
import type { Avatar, Question, RoomState } from './types'
import { makeInitialState, reducer, type GameAction } from './reducer'
import { botAnswer, botSkill } from './bots'
import { PASSWORD_POOL, generateRoomCode, uid } from './utils'

interface WireWelcome {
  type: 'WELCOME'
  meId: string
  state: RoomState
}
interface WireState {
  type: 'STATE'
  state: RoomState
}
interface WireError {
  type: 'ERROR'
  message: string
}
type WireMessage = WireWelcome | WireState | WireError

interface ConnectArgs {
  code: string
  handle: string
  avatar: Avatar
  isHost: boolean
}

const HOST: string =
  (import.meta.env.VITE_PARTYKIT_HOST as string | undefined)?.replace(/^https?:\/\//, '') ??
  ''

export function multiplayerConfigured(): boolean {
  return Boolean(HOST)
}

interface LocalState {
  state: RoomState
  meId: string
}

function localReducerWrapper(
  s: LocalState,
  a:
    | GameAction
    | { type: '__SET_ME_ID'; id: string }
    | { type: '__SET_CODE'; code: string },
): LocalState {
  if (a.type === '__SET_ME_ID') {
    return { ...s, meId: a.id }
  }
  if (a.type === '__SET_CODE') {
    return { ...s, state: { ...s.state, code: a.code } }
  }
  return { ...s, state: reducer(s.state, a as GameAction) }
}

// ---------------- Local fallback hook ----------------
// Used when VITE_PARTYKIT_HOST is missing. Runs everything client-side
// with the same reducer the server would.

function useLocalGame() {
  const [{ state, meId }, dispatchLocal] = useReducer(localReducerWrapper, undefined, () => ({
    state: makeInitialState(generateRoomCode()),
    meId: '',
  }))
  const [connected, setConnected] = useState(false)
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const connect = useCallback(({ code, handle, avatar, isHost }: ConnectArgs) => {
    const id = uid()
    dispatchLocal({ type: '__SET_ME_ID', id })
    // Seed the local "room" with the requested code; reset uses state.code, which
    // we've just initialized to a random one — so push the chosen code in explicitly.
    dispatchLocal({ type: '__SET_CODE' as never, code } as never)
    setTimeout(() => {
      dispatchLocal({
        type: 'addPlayer',
        player: {
          id,
          handle,
          isHuman: true,
          isHost,
          avatar,
          coins: 0,
          tokens: 0,
          hackedRecently: false,
          caughtCount: 0,
          hacksDone: 0,
          spiesDone: 0,
          passwordsGuessed: 0,
          password: '',
          passwordLocked: false,
          alive: true,
        },
      })
      // Add 3 bots automatically so there's someone to play with
      dispatchLocal({ type: 'addBots', count: 3 })
    }, 0)
    setConnected(true)
  }, [])

  const disconnect = useCallback(() => {
    setConnected(false)
    dispatchLocal({ type: 'reset' } as GameAction)
  }, [])

  const dispatch = useCallback((action: GameAction) => {
    dispatchLocal(action)
    // Side-effects normally done by the server: advance to next question after answer,
    // assign bot passwords at pickPassword, etc.
    if (action.type === 'answerQuestion' && action.playerId === stateRef.current.meId) {
      setTimeout(() => dispatchLocal({ type: 'nextQuestion' }), 700)
    }
    if (action.type === 'setPhase' && action.phase === 'pickPassword') {
      const bots = stateRef.current.players.filter((p) => !p.isHuman && !p.passwordLocked)
      bots.forEach((b) => {
        const pw = PASSWORD_POOL[Math.floor(Math.random() * PASSWORD_POOL.length)]
        dispatchLocal({ type: 'lockPassword', playerId: b.id, password: pw })
      })
    }
  }, [])

  // Countdown ticking
  useEffect(() => {
    if (state.phase !== 'countdown') return
    if (state.countdownValue < 0) {
      dispatchLocal({ type: 'startRound' } as GameAction)
      return
    }
    const t = setTimeout(() => dispatchLocal({ type: 'tickCountdown' } as GameAction), 1000)
    return () => clearTimeout(t)
  }, [state.phase, state.countdownValue])

  // Game timer
  useEffect(() => {
    if (state.phase !== 'playing') return
    const id = setInterval(() => dispatchLocal({ type: 'tickTimer' } as GameAction), 1000)
    return () => clearInterval(id)
  }, [state.phase])

  useEffect(() => {
    if (state.phase === 'playing' && state.timeLeft <= 0) {
      dispatchLocal({ type: 'endGame' } as GameAction)
    }
  }, [state.timeLeft, state.phase])

  // First question on entering playing
  useEffect(() => {
    if (state.phase !== 'playing') return
    if (!state.currentQuestion) {
      const t = setTimeout(() => dispatchLocal({ type: 'nextQuestion' } as GameAction), 400)
      return () => clearTimeout(t)
    }
  }, [state.phase, state.currentQuestion])

  // Bots answer
  useEffect(() => {
    if (state.phase !== 'playing' || !state.currentQuestion) return
    const q: Question = state.currentQuestion
    const bots = state.players.filter((p) => !p.isHuman && p.alive)
    const timers: number[] = []
    bots.forEach((bot) => {
      const skill = botSkill(bot)
      const delay = 1800 + Math.random() * 7000
      const t = window.setTimeout(() => {
        if (stateRef.current.currentQuestion !== q || stateRef.current.phase !== 'playing') return
        const choice = botAnswer(q, skill)
        dispatchLocal({ type: 'answerQuestion', playerId: bot.id, choice })
      }, delay)
      timers.push(t)
    })
    return () => timers.forEach((t) => clearTimeout(t))
  }, [state.currentQuestion, state.phase, state.players])

  // Bot side-actions
  useEffect(() => {
    if (state.phase !== 'playing') return
    const id = setInterval(() => {
      const cur = stateRef.current
      const bots = cur.players.filter((p) => !p.isHuman && p.alive)
      bots.forEach((bot) => {
        if (Math.random() > 0.4) return
        if (bot.tokens < cur.settings.costs.hack) return
        const targets = cur.players.filter((p) => p.id !== bot.id && p.alive)
        if (targets.length === 0) return
        const target = targets[Math.floor(Math.random() * targets.length)]
        const correct = Math.random() < 0.4
        dispatchLocal({
          type: 'doHack',
          playerId: bot.id,
          targetId: target.id,
          correctPassword: correct,
        })
      })
    }, 5500)
    return () => clearInterval(id)
  }, [state.phase])

  return { state, meId, connected, error: null as string | null, connect, disconnect, dispatch }
}

// ---------------- Multiplayer (server-backed) hook ----------------

function usePartyGameServer() {
  const [state, setState] = useState<RoomState | null>(null)
  const [meId, setMeId] = useState<string>('')
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<PartySocket | null>(null)

  const connect = useCallback(({ code, handle, avatar, isHost }: ConnectArgs) => {
    socketRef.current?.close()
    setError(null)

    const ws = new PartySocket({
      host: HOST,
      room: code.toUpperCase(),
    })
    socketRef.current = ws

    ws.addEventListener('open', () => {
      setConnected(true)
      ws.send(JSON.stringify({ type: 'JOIN', handle, avatar, isHost }))
    })
    ws.addEventListener('close', () => setConnected(false))
    ws.addEventListener('error', () => setError('Lost connection. Try refreshing.'))
    ws.addEventListener('message', (event: MessageEvent<string>) => {
      let msg: WireMessage
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }
      if (msg.type === 'WELCOME') {
        setMeId(msg.meId)
        setState(msg.state)
      } else if (msg.type === 'STATE') {
        setState(msg.state)
      } else if (msg.type === 'ERROR') {
        setError(msg.message)
      }
    })
  }, [])

  const disconnect = useCallback(() => {
    socketRef.current?.close()
    socketRef.current = null
    setConnected(false)
    setState(null)
    setMeId('')
  }, [])

  const dispatch = useCallback((action: GameAction) => {
    socketRef.current?.send(JSON.stringify({ type: 'ACTION', action }))
  }, [])

  useEffect(() => {
    return () => {
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [])

  return { state, meId, connected, error, connect, disconnect, dispatch }
}

// ---------------- Public hook ----------------
// HOST is a build-time constant, so we can bind once at module load.
// This avoids calling both hooks every render and the React-rules-of-hooks
// gymnastics that would otherwise come with a conditional.

export const usePartyGame: () => ReturnType<typeof useLocalGame> = multiplayerConfigured()
  ? (usePartyGameServer as unknown as typeof useLocalGame)
  : useLocalGame
