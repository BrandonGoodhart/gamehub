import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { ActionKind, Avatar, EventLog, Phase, Player, Question, RoomState, Settings } from './types'
import { generatePassword, generateRoomCode, pickN, uid } from './utils'
import { BOT_NAMES } from './words'
import { CATEGORIES, QUESTION_BANK } from './questions'
import { botAnswer, botDecideAction, botSkill } from './bots'
import { defaultAvatar, randomAvatar } from './avatar'

const DEFAULT_SETTINGS: Settings = {
  roundSeconds: 60,
  totalRounds: 5,
  startingCoins: 100,
  costs: { spy: 30, hack: 20, password: 40 },
  rewards: { hack: 100, spyCatch: 80, passwordCatch: 120, correctAnswer: 25 },
}

let eventCounter = 0
function makeEvent(text: string, tone: EventLog['tone']): EventLog {
  return { id: ++eventCounter, text, tone, ts: Date.now() }
}

function makeBotPlayer(handle: string): Player {
  return {
    id: uid(),
    handle,
    isHuman: false,
    isHost: false,
    avatar: randomAvatar(),
    coins: DEFAULT_SETTINGS.startingCoins,
    hackedInRounds: [],
    caughtCount: 0,
    hacksDone: 0,
    spiesDone: 0,
    passwordsGuessed: 0,
    password: generatePassword(),
    alive: true,
  }
}

function initialState(): RoomState {
  const meId = uid()
  return {
    code: generateRoomCode(),
    phase: 'start',
    round: 0,
    timeLeft: DEFAULT_SETTINGS.roundSeconds,
    players: [],
    meId,
    hostId: '',
    category: null,
    questionQueue: [],
    currentQuestion: null,
    questionStartTs: 0,
    events: [],
    settings: { ...DEFAULT_SETTINGS },
    pendingAction: null,
    countdownValue: 3,
  }
}

type Action =
  | { type: 'setPhase'; phase: Phase }
  | { type: 'setSettings'; patch: Partial<Settings> }
  | { type: 'createAsHost'; handle: string; avatar: Avatar }
  | { type: 'joinAsPlayer'; handle: string; avatar: Avatar }
  | { type: 'addBotsForDemo'; count: number }
  | { type: 'kickPlayer'; id: string }
  | { type: 'pickCategory'; category: string }
  | { type: 'beginCountdown' }
  | { type: 'tickCountdown' }
  | { type: 'tickTimer' }
  | { type: 'nextQuestion' }
  | { type: 'answerQuestion'; playerId: string; choice: number }
  | { type: 'event'; event: EventLog }
  | { type: 'doSpy'; spyId: string; targetId: string }
  | { type: 'doHack'; playerId: string }
  | { type: 'doPassword'; guesserId: string; targetId: string; guess: string }
  | { type: 'startRound' }
  | { type: 'endRound' }
  | { type: 'reset' }
  | { type: 'setPending'; kind: ActionKind | null }

function updatePlayer(state: RoomState, id: string, patch: Partial<Player>): RoomState {
  return { ...state, players: state.players.map((p) => (p.id === id ? { ...p, ...patch } : p)) }
}

function addEvent(state: RoomState, text: string, tone: EventLog['tone']): RoomState {
  const ev = makeEvent(text, tone)
  return { ...state, events: [ev, ...state.events].slice(0, 40) }
}

function shuffledQs(category: string): Question[] {
  const base = QUESTION_BANK[category] ?? QUESTION_BANK[CATEGORIES[0]]
  return [...base].sort(() => Math.random() - 0.5)
}

function reducer(state: RoomState, action: Action): RoomState {
  switch (action.type) {
    case 'setPhase':
      return { ...state, phase: action.phase }
    case 'setSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'createAsHost': {
      const me: Player = {
        id: state.meId,
        handle: action.handle,
        isHuman: true,
        isHost: true,
        avatar: action.avatar,
        coins: state.settings.startingCoins,
        hackedInRounds: [],
        caughtCount: 0,
        hacksDone: 0,
        spiesDone: 0,
        passwordsGuessed: 0,
        password: generatePassword(),
        alive: true,
      }
      return {
        ...state,
        players: [me],
        hostId: state.meId,
        phase: 'hostLobby',
        events: [makeEvent(`>> room ${state.code} opened by ${action.handle}`, 'system')],
      }
    }
    case 'joinAsPlayer': {
      const me: Player = {
        id: state.meId,
        handle: action.handle,
        isHuman: true,
        isHost: false,
        avatar: action.avatar,
        coins: state.settings.startingCoins,
        hackedInRounds: [],
        caughtCount: 0,
        hacksDone: 0,
        spiesDone: 0,
        passwordsGuessed: 0,
        password: generatePassword(),
        alive: true,
      }
      const exists = state.players.some((p) => p.id === state.meId)
      return {
        ...state,
        players: exists ? state.players : [...state.players, me],
        phase: 'hostLobby',
      }
    }
    case 'addBotsForDemo': {
      const used = new Set(state.players.map((p) => p.handle.toLowerCase()))
      const fresh = BOT_NAMES.filter((b) => !used.has(b.toLowerCase()))
      const newBots = pickN(fresh, action.count).map(makeBotPlayer)
      return { ...state, players: [...state.players, ...newBots] }
    }
    case 'kickPlayer': {
      if (action.id === state.hostId) return state
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.id),
        events: [
          makeEvent(`>> ${state.players.find((p) => p.id === action.id)?.handle ?? '?'} was kicked`, 'system'),
          ...state.events,
        ],
      }
    }
    case 'pickCategory':
      return { ...state, category: action.category, questionQueue: shuffledQs(action.category) }
    case 'beginCountdown':
      return { ...state, phase: 'countdown', countdownValue: 3 }
    case 'tickCountdown':
      return { ...state, countdownValue: state.countdownValue - 1 }
    case 'tickTimer':
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) }
    case 'nextQuestion': {
      const queueSrc = state.questionQueue.length > 0 ? state.questionQueue : shuffledQs(state.category ?? CATEGORIES[0])
      const [next, ...rest] = queueSrc
      return { ...state, currentQuestion: next, questionStartTs: Date.now(), questionQueue: rest }
    }
    case 'answerQuestion': {
      const q = state.currentQuestion
      if (!q) return state
      const me = state.players.find((p) => p.id === action.playerId)
      if (!me) return state
      const correct = action.choice === q.answer
      const reward = state.settings.rewards.correctAnswer
      if (correct) {
        const next = updatePlayer(state, action.playerId, { coins: me.coins + reward })
        if (me.id === state.meId) return addEvent(next, `+${reward}c // signal decoded`, 'good')
        return next
      }
      if (me.id === state.meId) return addEvent(state, `Wrong key. Signal lost.`, 'bad')
      return state
    }
    case 'event':
      return { ...state, events: [action.event, ...state.events].slice(0, 40) }
    case 'doHack': {
      const p = state.players.find((x) => x.id === action.playerId)
      if (!p) return state
      const c = state.settings.costs.hack
      const r = state.settings.rewards.hack
      if (p.coins < c) {
        return p.id === state.meId ? addEvent(state, 'Not enough coins to hack.', 'bad') : state
      }
      const next = updatePlayer(state, action.playerId, {
        coins: p.coins - c + r,
        hackedInRounds: [...p.hackedInRounds, state.round],
        hacksDone: p.hacksDone + 1,
      })
      const isMe = p.id === state.meId
      const tone: EventLog['tone'] = isMe ? 'good' : 'neutral'
      const msg = isMe
        ? `>> HACK successful. +${r - c}c net. You left fingerprints (3 rounds).`
        : `${p.handle} ran a hack in the shadows.`
      return addEvent(next, msg, tone)
    }
    case 'doSpy': {
      const spy = state.players.find((x) => x.id === action.spyId)
      const target = state.players.find((x) => x.id === action.targetId)
      if (!spy || !target) return state
      const c = state.settings.costs.spy
      if (spy.coins < c) {
        return spy.id === state.meId ? addEvent(state, 'Not enough coins to spy.', 'bad') : state
      }
      const recentlyHacked = target.hackedInRounds.some((r) => r >= state.round - 2)
      let s1 = updatePlayer(state, spy.id, { coins: spy.coins - c, spiesDone: spy.spiesDone + 1 })
      const spyIsMe = spy.id === state.meId
      const targetIsMe = target.id === state.meId
      if (recentlyHacked) {
        const steal = Math.min(target.coins, state.settings.rewards.spyCatch)
        s1 = updatePlayer(s1, target.id, { coins: target.coins - steal, caughtCount: target.caughtCount + 1 })
        const spyNow = s1.players.find((p) => p.id === spy.id)!
        s1 = updatePlayer(s1, spy.id, { coins: spyNow.coins + steal })
        const tone: EventLog['tone'] = spyIsMe ? 'good' : 'bad'
        const msg = spyIsMe
          ? `>> CAUGHT ${target.handle} red-handed. +${steal}c stolen!`
          : targetIsMe
            ? `${spy.handle} caught YOU hacking. -${steal}c.`
            : `${spy.handle} caught ${target.handle} hacking.`
        return addEvent(s1, msg, tone)
      }
      const tone: EventLog['tone'] = spyIsMe ? 'bad' : 'neutral'
      const msg = spyIsMe
        ? `Spied ${target.handle}. They're clean. -${c}c wasted.`
        : `${spy.handle} sniffed around ${target.handle}'s traffic.`
      return addEvent(s1, msg, tone)
    }
    case 'doPassword': {
      const g = state.players.find((x) => x.id === action.guesserId)
      const t = state.players.find((x) => x.id === action.targetId)
      if (!g || !t) return state
      const c = state.settings.costs.password
      if (g.coins < c) {
        return g.id === state.meId ? addEvent(state, 'Not enough coins to crack password.', 'bad') : state
      }
      let s1 = updatePlayer(state, g.id, { coins: g.coins - c, passwordsGuessed: g.passwordsGuessed + 1 })
      const gIsMe = g.id === state.meId
      const tIsMe = t.id === state.meId
      if (action.guess === t.password) {
        const steal = Math.min(t.coins, state.settings.rewards.passwordCatch)
        s1 = updatePlayer(s1, t.id, { coins: t.coins - steal, password: generatePassword() })
        const gNow = s1.players.find((p) => p.id === g.id)!
        s1 = updatePlayer(s1, g.id, { coins: gNow.coins + steal })
        const tone: EventLog['tone'] = gIsMe ? 'good' : 'bad'
        const msg = gIsMe
          ? `>> CRACKED ${t.handle}'s password! +${steal}c.`
          : tIsMe
            ? `${g.handle} cracked YOUR password. -${steal}c.`
            : `${g.handle} cracked ${t.handle}'s password.`
        return addEvent(s1, msg, tone)
      }
      const tone: EventLog['tone'] = gIsMe ? 'bad' : 'neutral'
      const msg = gIsMe
        ? `Wrong password for ${t.handle}. -${c}c.`
        : `${g.handle} tried to crack a password and failed.`
      return addEvent(s1, msg, tone)
    }
    case 'startRound':
      return {
        ...state,
        round: state.round + 1,
        timeLeft: state.settings.roundSeconds,
        phase: 'playing',
        events: [makeEvent(`>> ROUND ${state.round + 1} BEGINS`, 'system'), ...state.events],
      }
    case 'endRound': {
      const phase: Phase = state.round >= state.settings.totalRounds ? 'gameOver' : 'roundEnd'
      return {
        ...state,
        phase,
        currentQuestion: null,
        events: [makeEvent(`>> ROUND ${state.round} ENDS`, 'system'), ...state.events],
      }
    }
    case 'setPending':
      return { ...state, pendingAction: action.kind }
    case 'reset':
      return initialState()
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    if (state.phase !== 'playing') return
    const id = setInterval(() => dispatch({ type: 'tickTimer' }), 1000)
    return () => clearInterval(id)
  }, [state.phase])

  useEffect(() => {
    if (state.phase === 'playing' && state.timeLeft <= 0) {
      dispatch({ type: 'endRound' })
    }
  }, [state.timeLeft, state.phase])

  useEffect(() => {
    if (state.phase !== 'countdown') return
    if (state.countdownValue < 0) {
      dispatch({ type: 'startRound' })
      return
    }
    const id = setTimeout(() => dispatch({ type: 'tickCountdown' }), 1000)
    return () => clearTimeout(id)
  }, [state.phase, state.countdownValue])

  useEffect(() => {
    if (state.phase !== 'playing') return
    if (!state.currentQuestion) {
      const t = setTimeout(() => dispatch({ type: 'nextQuestion' }), 600)
      return () => clearTimeout(t)
    }
  }, [state.phase, state.currentQuestion])

  useEffect(() => {
    if (state.phase !== 'playing' || !state.currentQuestion) return
    const q = state.currentQuestion
    const bots = state.players.filter((p) => !p.isHuman && p.alive)
    const timers: number[] = []
    bots.forEach((bot) => {
      const skill = botSkill(bot)
      const delay = 1500 + Math.random() * 6000
      const id = window.setTimeout(() => {
        const cur = stateRef.current
        if (cur.currentQuestion !== q || cur.phase !== 'playing') return
        const choice = botAnswer(q, skill)
        dispatch({ type: 'answerQuestion', playerId: bot.id, choice })
      }, delay)
      timers.push(id)
    })
    return () => timers.forEach((t) => clearTimeout(t))
  }, [state.currentQuestion, state.phase, state.players])

  useEffect(() => {
    if (state.phase !== 'playing') return
    const id = setInterval(() => {
      const cur = stateRef.current
      const bots = cur.players.filter((p) => !p.isHuman && p.alive)
      bots.forEach((bot) => {
        if (Math.random() > 0.35) return
        const decision = botDecideAction(cur, bot)
        if (decision.kind === 'hack') dispatch({ type: 'doHack', playerId: bot.id })
        else if (decision.kind === 'spy' && decision.targetId)
          dispatch({ type: 'doSpy', spyId: bot.id, targetId: decision.targetId })
        else if (decision.kind === 'password' && decision.targetId && decision.passwordGuess)
          dispatch({
            type: 'doPassword',
            guesserId: bot.id,
            targetId: decision.targetId,
            guess: decision.passwordGuess,
          })
      })
    }, 4500)
    return () => clearInterval(id)
  }, [state.phase])

  const answer = useCallback((choice: number) => {
    const cur = stateRef.current
    dispatch({ type: 'answerQuestion', playerId: cur.meId, choice })
    setTimeout(() => dispatch({ type: 'nextQuestion' }), 700)
  }, [])

  const doHack = useCallback(() => {
    dispatch({ type: 'doHack', playerId: stateRef.current.meId })
  }, [])

  const doSpy = useCallback((targetId: string) => {
    dispatch({ type: 'doSpy', spyId: stateRef.current.meId, targetId })
  }, [])

  const doPassword = useCallback((targetId: string, guess: string) => {
    dispatch({ type: 'doPassword', guesserId: stateRef.current.meId, targetId, guess })
  }, [])

  return { state, dispatch, answer, doHack, doSpy, doPassword, defaultAvatarFor: defaultAvatar }
}
