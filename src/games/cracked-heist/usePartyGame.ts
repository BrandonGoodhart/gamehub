// Supabase Realtime-backed multiplayer.
// Replaces the PartyKit server-authoritative model with a host-authoritative
// client-side one. Whoever joins the room first as the host runs the reducer
// locally, applies actions from joiners, and broadcasts the resulting state
// over a Supabase Realtime channel. Joiners just send actions and render the
// state the host broadcasts.

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js'
import type { Avatar, Question, RoomState } from './types'
import { makeInitialState, reducer, type GameAction } from './reducer'
import { botAnswer, botSkill } from './bots'
import { generateRoomCode, makePasswordOptions, uid } from './utils'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let supabase: SupabaseClient | null = null
function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    })
  }
  return supabase
}

export function multiplayerConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

interface ConnectArgs {
  code: string
  handle: string
  avatar: Avatar
  isHost: boolean
}

interface WireJoin {
  type: 'JOIN'
  clientId: string
  handle: string
  avatar: Avatar
  isHost: boolean
}
interface WireAction {
  type: 'ACTION'
  clientId: string
  action: GameAction
}
interface WireState {
  type: 'STATE'
  state: RoomState
}
interface WireWelcome {
  type: 'WELCOME'
  meId: string
  state: RoomState
}
interface WireError {
  type: 'ERROR'
  toClientId: string
  message: string
}
type Wire = WireJoin | WireAction | WireState | WireWelcome | WireError

interface LocalState {
  state: RoomState
  meId: string
}

function localReducerWrapper(
  s: LocalState,
  a:
    | GameAction
    | { type: '__SET_ME_ID'; id: string }
    | { type: '__SET_CODE'; code: string }
    | { type: '__SET_STATE'; state: RoomState },
): LocalState {
  if (a.type === '__SET_ME_ID') return { ...s, meId: a.id }
  if (a.type === '__SET_CODE') return { ...s, state: { ...s.state, code: a.code } }
  if (a.type === '__SET_STATE') return { ...s, state: a.state }
  return { ...s, state: reducer(s.state, a as GameAction) }
}

// ---------------- Local fallback hook (no env vars set) ----------------
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
    dispatchLocal({ type: '__SET_CODE', code })
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
          passwordOptions: makePasswordOptions(3, new Set()),
          alive: true,
          currentQuestion: null,
          questionQueue: [],
          questionTick: 0,
        },
      })
      dispatchLocal({ type: 'addBots', count: 3 })
    }, 0)
    setConnected(true)
  }, [])

  const disconnect = useCallback(() => {
    setConnected(false)
    dispatchLocal({ type: 'reset' } as GameAction)
  }, [])

  const dispatch = useCallback((action: GameAction) => {
    if (action.type === 'beginCountdown') {
      const unlocked = stateRef.current.players.filter((p) => !p.passwordLocked)
      unlocked.forEach((u) => {
        const pw = u.passwordOptions[Math.floor(Math.random() * u.passwordOptions.length)] ?? ''
        if (pw) dispatchLocal({ type: 'lockPassword', playerId: u.id, password: pw })
      })
    }
    dispatchLocal(action)
    if (action.type === 'setPhase' && action.phase === 'pickPassword') {
      const bots = stateRef.current.players.filter((p) => !p.isHuman && !p.passwordLocked)
      bots.forEach((b) => {
        const pw = b.passwordOptions[Math.floor(Math.random() * b.passwordOptions.length)] ?? ''
        if (pw) dispatchLocal({ type: 'lockPassword', playerId: b.id, password: pw })
      })
    }
  }, [])

  useEffect(() => {
    if (state.phase !== 'countdown') return
    if (state.countdownValue < 0) {
      dispatchLocal({ type: 'startRound' } as GameAction)
      return
    }
    const t = setTimeout(() => dispatchLocal({ type: 'tickCountdown' } as GameAction), 1000)
    return () => clearTimeout(t)
  }, [state.phase, state.countdownValue])

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

  // Load each player's first question when 'playing' starts
  useEffect(() => {
    if (state.phase !== 'playing') return
    const needsQuestion = state.players.filter((p) => p.alive && !p.currentQuestion)
    if (needsQuestion.length === 0) return
    const t = setTimeout(() => {
      needsQuestion.forEach((p) =>
        dispatchLocal({ type: 'nextQuestion', playerId: p.id } as GameAction),
      )
    }, 400)
    return () => clearTimeout(t)
  }, [state.phase, state.players])

  // Bots answer their own current question, then advance
  useEffect(() => {
    if (state.phase !== 'playing') return
    const bots = state.players.filter((p) => !p.isHuman && p.alive && p.currentQuestion)
    const timers: number[] = []
    bots.forEach((bot) => {
      const q: Question | null = bot.currentQuestion
      if (!q) return
      const skill = botSkill(bot)
      const delay = 1800 + Math.random() * 7000
      const t = window.setTimeout(() => {
        const botNow = stateRef.current.players.find((p) => p.id === bot.id)
        if (!botNow || botNow.currentQuestion !== q || stateRef.current.phase !== 'playing') return
        const choice = botAnswer(q, skill)
        dispatchLocal({ type: 'answerQuestion', playerId: bot.id, choice })
        dispatchLocal({ type: 'nextQuestion', playerId: bot.id })
      }, delay)
      timers.push(t)
    })
    return () => timers.forEach((t) => clearTimeout(t))
  }, [state.phase, state.players])

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

// ---------------- Multiplayer (Supabase Realtime) hook ----------------
// Host runs the reducer locally and broadcasts state. Joiners send actions
// to the host over the same channel and render the broadcasted state.

function useSupabaseGame() {
  const [state, setState] = useState<RoomState | null>(null)
  const [meId, setMeId] = useState<string>('')
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const myClientIdRef = useRef<string>('')
  const myHandleRef = useRef<string>('')
  const myAvatarRef = useRef<Avatar | null>(null)
  const isHostRef = useRef(false)
  const codeRef = useRef<string>('')

  // Host-only state (kept in refs so timers see the latest)
  const hostStateRef = useRef<RoomState | null>(null)
  const joinedClientIdsRef = useRef<Set<string>>(new Set())

  function broadcast(msg: Wire) {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'msg',
      payload: msg,
    })
  }

  function hostApply(action: GameAction) {
    if (!isHostRef.current || !hostStateRef.current) return
    hostStateRef.current = reducer(hostStateRef.current, action)
    setState(hostStateRef.current)
    broadcast({ type: 'STATE', state: hostStateRef.current })
  }

  // Host-side: receive a JOIN from a fresh client and welcome them
  function handleJoin(msg: WireJoin) {
    if (!isHostRef.current || !hostStateRef.current) return
    if (joinedClientIdsRef.current.has(msg.clientId)) {
      // Already known — just resend state in case they reconnected
      broadcast({ type: 'WELCOME', meId: msg.clientId, state: hostStateRef.current })
      return
    }
    const phase = hostStateRef.current.phase
    const isPreGame = phase === 'hostLobby' || phase === 'pickCategory' || phase === 'customQuestions' || phase === 'pregame' || phase === 'pickPassword'
    const allowLateJoin = hostStateRef.current.settings.allowLateJoin
    // Block late-joiners once the game is past setup unless the host allowed it
    if (!isPreGame && !allowLateJoin) {
      broadcast({
        type: 'ERROR',
        toClientId: msg.clientId,
        message: 'The host already started this game and late joining is turned off.',
      })
      return
    }
    if (phase === 'gameOver') {
      broadcast({
        type: 'ERROR',
        toClientId: msg.clientId,
        message: 'This game is over. Ask the host to start a new one.',
      })
      return
    }
    // Reject duplicate handles
    const wantedLower = msg.handle.trim().toLowerCase()
    const dup = hostStateRef.current.players.some(
      (p) => p.handle.trim().toLowerCase() === wantedLower,
    )
    if (dup) {
      broadcast({
        type: 'ERROR',
        toClientId: msg.clientId,
        message: `Someone in this room is already using the name "${msg.handle.trim()}". Pick a different name.`,
      })
      return
    }
    joinedClientIdsRef.current.add(msg.clientId)
    const taken = new Set<string>()
    for (const p of hostStateRef.current.players) {
      if (p.password) taken.add(p.password)
      for (const opt of p.passwordOptions) taken.add(opt)
    }
    const options = makePasswordOptions(3, taken)
    hostApply({
      type: 'addPlayer',
      player: {
        id: msg.clientId,
        handle: msg.handle.trim(),
        isHuman: true,
        isHost: false,
        avatar: msg.avatar,
        coins: 0,
        tokens: 0,
        hackedRecently: false,
        caughtCount: 0,
        hacksDone: 0,
        spiesDone: 0,
        passwordsGuessed: 0,
        password: '',
        passwordLocked: false,
        passwordOptions: options,
        alive: true,
        currentQuestion: null,
        questionQueue: [],
        questionTick: 0,
      },
    })
    broadcast({ type: 'WELCOME', meId: msg.clientId, state: hostStateRef.current! })
  }

  // Host-side: receive an ACTION from a joiner
  function handleAction(msg: WireAction) {
    if (!isHostRef.current || !hostStateRef.current) return
    const a = msg.action
    // Guard against impersonation
    if (
      ('playerId' in a && a.playerId && a.playerId !== msg.clientId) ||
      ('spyId' in a && a.spyId && a.spyId !== msg.clientId) ||
      ('guesserId' in a && a.guesserId && a.guesserId !== msg.clientId)
    ) {
      return
    }
    // Only host can run these
    const hostOnly: GameAction['type'][] = [
      'setSettings',
      'pickCategory',
      'pickCustomQuestions',
      'kickPlayer',
      'beginCountdown',
      'setPhase',
      'addBots',
      'reset',
    ]
    if (hostOnly.includes(a.type)) return
    hostApply(a)
  }

  const connect = useCallback(({ code, handle, avatar, isHost }: ConnectArgs) => {
    setError(null)
    const sb = getSupabase()
    if (!sb) {
      setError('Multiplayer is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify.')
      return
    }

    const myClientId = uid()
    myClientIdRef.current = myClientId
    myHandleRef.current = handle
    myAvatarRef.current = avatar
    isHostRef.current = isHost
    codeRef.current = code.toUpperCase()

    if (isHost) {
      // Seed authoritative state
      const initial = makeInitialState(codeRef.current)
      const taken = new Set<string>()
      const seeded: RoomState = {
        ...initial,
        hostId: myClientId,
        players: [
          {
            id: myClientId,
            handle: handle.trim(),
            isHuman: true,
            isHost: true,
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
            passwordOptions: makePasswordOptions(3, taken),
            alive: true,
            currentQuestion: null,
            questionQueue: [],
            questionTick: 0,
          },
        ],
      }
      hostStateRef.current = seeded
      joinedClientIdsRef.current = new Set([myClientId])
      setState(seeded)
      setMeId(myClientId)
    } else {
      setMeId(myClientId)
    }

    const channel = sb.channel(`cracked-heist:${codeRef.current}`, {
      config: { broadcast: { self: false, ack: false } },
    })

    channel.on('broadcast', { event: 'msg' }, ({ payload }: { payload: Wire }) => {
      const msg = payload
      switch (msg.type) {
        case 'JOIN':
          handleJoin(msg)
          break
        case 'ACTION':
          handleAction(msg)
          break
        case 'STATE':
          if (!isHostRef.current) setState(msg.state)
          break
        case 'WELCOME':
          if (!isHostRef.current && msg.meId === myClientIdRef.current) {
            setState(msg.state)
          }
          break
        case 'ERROR':
          if (msg.toClientId === myClientIdRef.current) {
            setError(msg.message)
          }
          break
      }
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setConnected(true)
        if (!isHost) {
          // Send a JOIN so the host can welcome us
          broadcast({
            type: 'JOIN',
            clientId: myClientId,
            handle,
            avatar,
            isHost: false,
          })
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setConnected(false)
      }
    })

    channelRef.current = channel
  }, [])

  const disconnect = useCallback(() => {
    const sb = getSupabase()
    if (channelRef.current && sb) {
      sb.removeChannel(channelRef.current)
    }
    channelRef.current = null
    isHostRef.current = false
    hostStateRef.current = null
    joinedClientIdsRef.current = new Set()
    setState(null)
    setMeId('')
    setConnected(false)
  }, [])

  const dispatch = useCallback((action: GameAction) => {
    if (isHostRef.current) {
      // Pre-countdown: auto-lock anyone who hasn't picked a password
      if (action.type === 'beginCountdown' && hostStateRef.current) {
        const unlocked = hostStateRef.current.players.filter((p) => !p.passwordLocked)
        for (const u of unlocked) {
          const pw =
            u.passwordOptions[Math.floor(Math.random() * u.passwordOptions.length)] ?? ''
          if (pw) hostApply({ type: 'lockPassword', playerId: u.id, password: pw })
        }
      }
      hostApply(action)
      // Auto-fill bot passwords once we hit pickPassword
      if (action.type === 'setPhase' && action.phase === 'pickPassword' && hostStateRef.current) {
        const bots = hostStateRef.current.players.filter((p) => !p.isHuman && !p.passwordLocked)
        for (const b of bots) {
          const pw =
            b.passwordOptions[Math.floor(Math.random() * b.passwordOptions.length)] ?? ''
          if (pw) hostApply({ type: 'lockPassword', playerId: b.id, password: pw })
        }
      }
    } else {
      // Joiner: send action to host
      broadcast({ type: 'ACTION', clientId: myClientIdRef.current, action })
    }
  }, [])

  // -------- Host-only timers / lifecycle --------

  useEffect(() => {
    if (!isHostRef.current || !state) return
    if (state.phase !== 'countdown') return
    if (state.countdownValue < 0) {
      hostApply({ type: 'startRound' } as GameAction)
      return
    }
    const t = setTimeout(() => hostApply({ type: 'tickCountdown' } as GameAction), 1000)
    return () => clearTimeout(t)
  }, [state?.phase, state?.countdownValue])

  useEffect(() => {
    if (!isHostRef.current || !state) return
    if (state.phase !== 'playing') return
    const id = setInterval(() => hostApply({ type: 'tickTimer' } as GameAction), 1000)
    return () => clearInterval(id)
  }, [state?.phase])

  useEffect(() => {
    if (!isHostRef.current || !state) return
    if (state.phase === 'playing' && state.timeLeft <= 0) {
      hostApply({ type: 'endGame' } as GameAction)
    }
  }, [state?.timeLeft, state?.phase])

  // Load every player's first question once 'playing' starts
  useEffect(() => {
    if (!isHostRef.current || !state) return
    if (state.phase !== 'playing') return
    const needs = state.players.filter((p) => p.alive && !p.currentQuestion)
    if (needs.length === 0) return
    const t = setTimeout(() => {
      needs.forEach((p) => hostApply({ type: 'nextQuestion', playerId: p.id } as GameAction))
    }, 400)
    return () => clearTimeout(t)
  }, [state?.phase, state?.players])

  // Bots answer their own current question, then advance (host only)
  useEffect(() => {
    if (!isHostRef.current || !state) return
    if (state.phase !== 'playing') return
    const bots = state.players.filter((p) => !p.isHuman && p.alive && p.currentQuestion)
    const timers: number[] = []
    bots.forEach((bot) => {
      const q: Question | null = bot.currentQuestion
      if (!q) return
      const skill = botSkill(bot)
      const delay = 1800 + Math.random() * 7000
      const t = window.setTimeout(() => {
        const cur = hostStateRef.current
        if (!cur || cur.phase !== 'playing') return
        const botNow = cur.players.find((p) => p.id === bot.id)
        if (!botNow || botNow.currentQuestion !== q) return
        const choice = botAnswer(q, skill)
        hostApply({ type: 'answerQuestion', playerId: bot.id, choice })
        hostApply({ type: 'nextQuestion', playerId: bot.id })
      }, delay)
      timers.push(t)
    })
    return () => timers.forEach((t) => clearTimeout(t))
  }, [state?.phase, state?.players])

  // Bot side-actions (host only)
  useEffect(() => {
    if (!isHostRef.current || !state) return
    if (state.phase !== 'playing') return
    const id = setInterval(() => {
      const cur = hostStateRef.current
      if (!cur) return
      const bots = cur.players.filter((p) => !p.isHuman && p.alive)
      bots.forEach((bot) => {
        if (Math.random() > 0.4) return
        if (bot.tokens < cur.settings.costs.hack) return
        const targets = cur.players.filter((p) => p.id !== bot.id && p.alive)
        if (targets.length === 0) return
        const target = targets[Math.floor(Math.random() * targets.length)]
        const correct = Math.random() < 0.4
        hostApply({
          type: 'doHack',
          playerId: bot.id,
          targetId: target.id,
          correctPassword: correct,
        })
      })
    }, 5500)
    return () => clearInterval(id)
  }, [state?.phase])

  useEffect(() => {
    return () => {
      const sb = getSupabase()
      if (channelRef.current && sb) sb.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])

  return { state, meId, connected, error, connect, disconnect, dispatch }
}

// ---------------- Public hook ----------------
// Same name kept for drop-in compatibility with the previous PartyKit hook.

export const usePartyGame: () => ReturnType<typeof useLocalGame> = multiplayerConfigured()
  ? (useSupabaseGame as unknown as typeof useLocalGame)
  : useLocalGame
