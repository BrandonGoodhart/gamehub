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
  // Host-only: when true, the host doesn't join as a player. They get a
  // controller-style view (leaderboard + event feed) instead.
  isObserver?: boolean
  // Joiner-only: when true, subscribe to the channel but don't broadcast a
  // JOIN yet. Instead, send a PEEK so the picker can see who's already there,
  // and wait for the client to call sendJoin() with a confirmed avatar.
  peekOnly?: boolean
  // Host-only: seed the room with pre-configured settings and questions so
  // joiners arrive after the host has already chosen the round length and
  // written the trivia.
  initialSettings?: Partial<import('./types').Settings>
  initialCategory?: string | null
  initialCustomQuestions?: Question[] | null
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
// Peek: a client that hasn't picked their avatar yet asks the host for the
// current roster (names + colors that are already taken) so its picker UI
// can gray out the ones that would collide.
interface WirePeek {
  type: 'PEEK'
  clientId: string
}
interface WireRoster {
  type: 'ROSTER'
  toClientId: string
  handles: string[]
  colors: string[]
}
type Wire = WireJoin | WireAction | WireState | WireWelcome | WireError | WirePeek | WireRoster

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

  const connect = useCallback((args: ConnectArgs) => {
    const { code, handle, avatar, isHost, isObserver, initialSettings, initialCategory, initialCustomQuestions } = args
    const id = uid()
    dispatchLocal({ type: '__SET_ME_ID', id })
    dispatchLocal({ type: '__SET_CODE', code })
    if (initialSettings) {
      dispatchLocal({ type: 'setSettings', patch: initialSettings })
    }
    if (initialCustomQuestions && initialCustomQuestions.length > 0) {
      dispatchLocal({
        type: 'pickCustomQuestions',
        questions: initialCustomQuestions,
        label: initialCategory ?? 'Custom',
      })
    } else if (initialCategory) {
      dispatchLocal({ type: 'pickCategory', category: initialCategory })
    }
    setTimeout(() => {
      // Observer host: don't create a player entry for them.
      if (isHost && isObserver) {
        // Track host id by adding a phantom player? No — just leave players
        // empty for local mode. (Local mode is mostly used for offline solo;
        // observer mode is meaningful only with real joiners.)
        setConnected(true)
        return
      }
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

  const sendJoin = useCallback(() => {
    // Local mode has no separate join — connect() already added the player.
  }, [])
  const roster = { handles: [] as string[], colors: [] as string[] }

  return { state, meId, connected, error: null as string | null, roster, connect, sendJoin, disconnect, dispatch }
}

// ---------------- Multiplayer (Supabase Realtime) hook ----------------
// Host runs the reducer locally and broadcasts state. Joiners send actions
// to the host over the same channel and render the broadcasted state.

function useSupabaseGame() {
  const [state, setState] = useState<RoomState | null>(null)
  const [meId, setMeId] = useState<string>('')
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Populated by ROSTER responses (joiner side) so the avatar picker can
  // gray out already-taken names and colors.
  const [roster, setRoster] = useState<{ handles: string[]; colors: string[] }>({
    handles: [],
    colors: [],
  })

  const channelRef = useRef<RealtimeChannel | null>(null)
  const myClientIdRef = useRef<string>('')
  const myHandleRef = useRef<string>('')
  const myAvatarRef = useRef<Avatar | null>(null)
  const isHostRef = useRef(false)
  const codeRef = useRef<string>('')
  // Joiner-only: fires if we don't get a WELCOME back within a few seconds,
  // meaning the room code doesn't correspond to a live host.
  const welcomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    // Reject duplicate colors
    const wantedColor = msg.avatar.color.toLowerCase()
    const colorDup = hostStateRef.current.players.some(
      (p) => p.avatar.color.toLowerCase() === wantedColor,
    )
    if (colorDup) {
      broadcast({
        type: 'ERROR',
        toClientId: msg.clientId,
        message: `Someone already picked that color. Pick a different one.`,
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

  const connect = useCallback((args: ConnectArgs) => {
    const { code, handle, avatar, isHost, isObserver, peekOnly, initialSettings, initialCategory, initialCustomQuestions } = args
    setError(null)
    setRoster({ handles: [], colors: [] })
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
      // Seed authoritative state with any pre-set settings/questions from the
      // host's offline setup, plus the host's own player entry unless they're
      // observing.
      const initial = makeInitialState(codeRef.current)
      const taken = new Set<string>()
      const seededSettings = { ...initial.settings, ...(initialSettings ?? {}) }
      const seededCategory = initialCategory ?? null
      const seededCustomQuestions =
        initialCustomQuestions && initialCustomQuestions.length > 0
          ? initialCustomQuestions
          : null
      const hostPlayer = isObserver
        ? null
        : {
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
          }
      const seeded: RoomState = {
        ...initial,
        hostId: myClientId,
        settings: seededSettings,
        category: seededCategory,
        customQuestions: seededCustomQuestions,
        players: hostPlayer ? [hostPlayer] : [],
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
        case 'PEEK':
          // Host responds with the current roster so the peeking client can
          // gray out already-taken names/colors in their avatar picker.
          if (isHostRef.current && hostStateRef.current) {
            broadcast({
              type: 'ROSTER',
              toClientId: msg.clientId,
              handles: hostStateRef.current.players.map((p) => p.handle),
              colors: hostStateRef.current.players.map((p) => p.avatar.color),
            })
          }
          break
        case 'ROSTER':
          if (!isHostRef.current && msg.toClientId === myClientIdRef.current) {
            setRoster({ handles: msg.handles, colors: msg.colors })
          }
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
            if (welcomeTimerRef.current) {
              clearTimeout(welcomeTimerRef.current)
              welcomeTimerRef.current = null
            }
          }
          break
        case 'ERROR':
          if (msg.toClientId === myClientIdRef.current) {
            setError(msg.message)
            if (welcomeTimerRef.current) {
              clearTimeout(welcomeTimerRef.current)
              welcomeTimerRef.current = null
            }
          }
          break
      }
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setConnected(true)
        if (!isHost) {
          if (peekOnly) {
            // Just ask the host for the current roster so the picker can
            // gray out taken names/colors. Don't commit to joining yet.
            broadcast({ type: 'PEEK', clientId: myClientId })
            if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current)
            welcomeTimerRef.current = setTimeout(() => {
              setError(
                `No game found with code "${codeRef.current}". Check the code with the host — the room may not exist or the game may already be over.`,
              )
            }, 4000)
          } else {
            // Send a JOIN so the host can welcome us
            broadcast({
              type: 'JOIN',
              clientId: myClientId,
              handle,
              avatar,
              isHost: false,
            })
            // If no host is subscribed to this channel, our JOIN goes nowhere.
            // Start a timer — if no WELCOME comes back, the code is dead.
            if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current)
            welcomeTimerRef.current = setTimeout(() => {
              setError(
                `No game found with code "${codeRef.current}". Check the code with the host — the room may not exist or the game may already be over.`,
              )
            }, 4000)
          }
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setConnected(false)
      }
    })

    channelRef.current = channel
  }, [])

  // Send the JOIN broadcast on an already-subscribed peek channel. Called by
  // the joiner after they've picked a name + color they see is available.
  const sendJoin = useCallback((handle: string, avatar: Avatar) => {
    if (!channelRef.current || !myClientIdRef.current) return
    setError(null)
    setRoster({ handles: [], colors: [] })
    myHandleRef.current = handle
    myAvatarRef.current = avatar
    broadcast({
      type: 'JOIN',
      clientId: myClientIdRef.current,
      handle,
      avatar,
      isHost: false,
    })
    if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current)
    welcomeTimerRef.current = setTimeout(() => {
      setError(
        `No game found with code "${codeRef.current}". Check the code with the host — the room may not exist or the game may already be over.`,
      )
    }, 4000)
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
    if (welcomeTimerRef.current) {
      clearTimeout(welcomeTimerRef.current)
      welcomeTimerRef.current = null
    }
    setState(null)
    setMeId('')
    setConnected(false)
    setError(null)
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

  return { state, meId, connected, error, roster, connect, sendJoin, disconnect, dispatch }
}

// ---------------- Public hook ----------------
// Same name kept for drop-in compatibility with the previous PartyKit hook.

export const usePartyGame: () => ReturnType<typeof useSupabaseGame> = multiplayerConfigured()
  ? useSupabaseGame
  : (useLocalGame as unknown as typeof useSupabaseGame)
