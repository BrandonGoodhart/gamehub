import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { ActionKind, Avatar, EventLog, Phase, Player, Question, RoomState, Settings } from './types'
import { generatePassword, generateRoomCode, pickN, uid } from './utils'
import { BOT_NAMES } from './words'
import { CATEGORIES, QUESTION_BANK } from './questions'
import { botAnswer, botSkill } from './bots'
import { defaultAvatar, randomAvatar } from './avatar'

const DEFAULT_SETTINGS: Settings = {
  roundSeconds: 60,
  totalRounds: 5,
  costs: { spy: 10, hack: 15, password: 15 },
  rewards: {
    spyCatch: 10,
    passwordCatch: 15,
    correctAnswerCoins: 5,
    correctAnswerTokens: 3,
  },
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
    coins: 0,
    tokens: 0,
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
    phase: 'loading',
    round: 0,
    timeLeft: DEFAULT_SETTINGS.roundSeconds,
    players: [],
    meId,
    hostId: '',
    category: null,
    customQuestions: null,
    questionQueue: [],
    currentQuestion: null,
    questionStartTs: 0,
    events: [],
    fullLog: [],
    settings: { ...DEFAULT_SETTINGS },
    pendingAction: null,
    countdownValue: 3,
    shareCode: null,
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
  | { type: 'pickCustomQuestions'; questions: Question[] }
  | { type: 'beginCountdown' }
  | { type: 'tickCountdown' }
  | { type: 'tickTimer' }
  | { type: 'nextQuestion' }
  | { type: 'answerQuestion'; playerId: string; choice: number }
  | { type: 'event'; event: EventLog }
  | { type: 'doSpy'; spyId: string; targetId: string }
  | { type: 'doHack'; playerId: string; gainedCoins: number }
  | { type: 'doPassword'; guesserId: string; targetId: string; guess: string }
  | { type: 'startRound' }
  | { type: 'endRound' }
  | { type: 'setShareCode'; code: string }
  | { type: 'reset' }
  | { type: 'setPending'; kind: ActionKind | null }

function updatePlayer(state: RoomState, id: string, patch: Partial<Player>): RoomState {
  return { ...state, players: state.players.map((p) => (p.id === id ? { ...p, ...patch } : p)) }
}

function addEvent(state: RoomState, text: string, tone: EventLog['tone']): RoomState {
  const ev = makeEvent(text, tone)
  return {
    ...state,
    events: [ev, ...state.events].slice(0, 60),
    fullLog: [...state.fullLog, ev],
  }
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
        coins: 0,
        tokens: 0,
        hackedInRounds: [],
        caughtCount: 0,
        hacksDone: 0,
        spiesDone: 0,
        passwordsGuessed: 0,
        password: generatePassword(),
        alive: true,
      }
      const ev = makeEvent(`Room ${state.code} opened by ${action.handle}.`, 'system')
      return {
        ...state,
        players: [me],
        hostId: state.meId,
        phase: 'hostLobby',
        events: [ev],
        fullLog: [ev],
      }
    }
    case 'joinAsPlayer': {
      const me: Player = {
        id: state.meId,
        handle: action.handle,
        isHuman: true,
        isHost: false,
        avatar: action.avatar,
        coins: 0,
        tokens: 0,
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
      const name = state.players.find((p) => p.id === action.id)?.handle ?? '?'
      const ev = makeEvent(`${name} was kicked.`, 'system')
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.id),
        events: [ev, ...state.events],
        fullLog: [...state.fullLog, ev],
      }
    }
    case 'pickCategory':
      return {
        ...state,
        category: action.category,
        customQuestions: null,
        questionQueue: shuffledQs(action.category),
      }
    case 'pickCustomQuestions': {
      const shuffled = [...action.questions].sort(() => Math.random() - 0.5)
      return {
        ...state,
        category: 'Custom',
        customQuestions: action.questions,
        questionQueue: shuffled,
      }
    }
    case 'beginCountdown':
      return { ...state, phase: 'countdown', countdownValue: 3 }
    case 'tickCountdown':
      return { ...state, countdownValue: state.countdownValue - 1 }
    case 'tickTimer':
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) }
    case 'nextQuestion': {
      const refill = state.customQuestions
        ? [...state.customQuestions].sort(() => Math.random() - 0.5)
        : shuffledQs(state.category ?? CATEGORIES[0])
      const queueSrc = state.questionQueue.length > 0 ? state.questionQueue : refill
      const [next, ...rest] = queueSrc
      return { ...state, currentQuestion: next, questionStartTs: Date.now(), questionQueue: rest }
    }
    case 'answerQuestion': {
      const q = state.currentQuestion
      if (!q) return state
      const me = state.players.find((p) => p.id === action.playerId)
      if (!me) return state
      const correct = action.choice === q.answer
      const coins = state.settings.rewards.correctAnswerCoins
      const tokens = state.settings.rewards.correctAnswerTokens
      if (correct) {
        const next = updatePlayer(state, action.playerId, {
          coins: me.coins + coins,
          tokens: me.tokens + tokens,
        })
        if (me.id === state.meId)
          return addEvent(next, `${me.handle} answered correctly. +${coins} coins, +${tokens} tokens.`, 'good')
        return {
          ...next,
          fullLog: [
            ...next.fullLog,
            makeEvent(`${me.handle} answered correctly. +${coins} coins, +${tokens} tokens.`, 'neutral'),
          ],
        }
      }
      if (me.id === state.meId) return addEvent(state, `${me.handle} answered wrong.`, 'bad')
      return {
        ...state,
        fullLog: [...state.fullLog, makeEvent(`${me.handle} answered wrong.`, 'neutral')],
      }
    }
    case 'event':
      return { ...state, events: [action.event, ...state.events].slice(0, 60), fullLog: [...state.fullLog, action.event] }
    case 'doHack': {
      // Hack now: tokens are spent up front, coins are added by the mini-game.
      const p = state.players.find((x) => x.id === action.playerId)
      if (!p) return state
      const cost = state.settings.costs.hack
      if (p.tokens < cost) {
        return p.id === state.meId ? addEvent(state, 'Not enough tokens to hack.', 'bad') : state
      }
      const next = updatePlayer(state, action.playerId, {
        tokens: p.tokens - cost,
        coins: p.coins + action.gainedCoins,
        hackedInRounds: [...p.hackedInRounds, state.round],
        hacksDone: p.hacksDone + 1,
      })
      const isMe = p.id === state.meId
      const msg = isMe
        ? `${p.handle} hacked the panel. Won ${action.gainedCoins} coins (-${cost} tokens).`
        : `${p.handle} cracked open a computer panel (+${action.gainedCoins}c).`
      return addEvent(next, msg, isMe ? 'good' : 'neutral')
    }
    case 'doSpy': {
      const spy = state.players.find((x) => x.id === action.spyId)
      const target = state.players.find((x) => x.id === action.targetId)
      if (!spy || !target) return state
      const cost = state.settings.costs.spy
      if (spy.coins < cost) {
        return spy.id === state.meId ? addEvent(state, 'Not enough coins to spy.', 'bad') : state
      }
      const recentlyHacked = target.hackedInRounds.some((r) => r >= state.round - 2)
      let s1 = updatePlayer(state, spy.id, { coins: spy.coins - cost, spiesDone: spy.spiesDone + 1 })
      const spyIsMe = spy.id === state.meId
      if (recentlyHacked) {
        const reward = state.settings.rewards.spyCatch
        const spyNow = s1.players.find((p) => p.id === spy.id)!
        s1 = updatePlayer(s1, spy.id, { coins: spyNow.coins + reward })
        s1 = updatePlayer(s1, target.id, { caughtCount: target.caughtCount + 1 })
        const msg = spyIsMe
          ? `${spy.handle} caught ${target.handle} hacking. +${reward} coins.`
          : `${spy.handle} caught ${target.handle} hacking.`
        return addEvent(s1, msg, spyIsMe ? 'good' : 'neutral')
      }
      const msg = spyIsMe
        ? `${spy.handle} spied ${target.handle}. They're clean. -${cost} coins.`
        : `${spy.handle} spied around quietly.`
      return addEvent(s1, msg, spyIsMe ? 'bad' : 'neutral')
    }
    case 'doPassword': {
      const g = state.players.find((x) => x.id === action.guesserId)
      const t = state.players.find((x) => x.id === action.targetId)
      if (!g || !t) return state
      const cost = state.settings.costs.password
      if (g.coins < cost) {
        return g.id === state.meId ? addEvent(state, 'Not enough coins to crack password.', 'bad') : state
      }
      let s1 = updatePlayer(state, g.id, { coins: g.coins - cost, passwordsGuessed: g.passwordsGuessed + 1 })
      const gIsMe = g.id === state.meId
      if (action.guess === t.password) {
        const reward = state.settings.rewards.passwordCatch
        const gNow = s1.players.find((p) => p.id === g.id)!
        s1 = updatePlayer(s1, g.id, { coins: gNow.coins + reward })
        s1 = updatePlayer(s1, t.id, { password: generatePassword() })
        const msg = gIsMe
          ? `${g.handle} cracked ${t.handle}'s password. +${reward} coins.`
          : `${g.handle} cracked ${t.handle}'s password.`
        return addEvent(s1, msg, gIsMe ? 'good' : 'neutral')
      }
      const msg = gIsMe
        ? `${g.handle} guessed wrong on ${t.handle}'s password. -${cost} coins.`
        : `${g.handle} tried a password and failed.`
      return addEvent(s1, msg, gIsMe ? 'bad' : 'neutral')
    }
    case 'startRound': {
      const ev = makeEvent(`Round ${state.round + 1} begins.`, 'system')
      return {
        ...state,
        round: state.round + 1,
        timeLeft: state.settings.roundSeconds,
        phase: 'playing',
        events: [ev, ...state.events],
        fullLog: [...state.fullLog, ev],
      }
    }
    case 'endRound': {
      const phase: Phase = state.round >= state.settings.totalRounds ? 'gameOver' : 'roundEnd'
      const ev = makeEvent(`Round ${state.round} ends.`, 'system')
      return {
        ...state,
        phase,
        currentQuestion: null,
        events: [ev, ...state.events],
        fullLog: [...state.fullLog, ev],
      }
    }
    case 'setPending':
      return { ...state, pendingAction: action.kind }
    case 'setShareCode':
      return { ...state, shareCode: action.code }
    case 'reset':
      return { ...initialState(), phase: 'start' }
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
      const delay = 1800 + Math.random() * 7000
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

  // Bots auto-hack (random gain) so the spy mechanic stays alive
  useEffect(() => {
    if (state.phase !== 'playing') return
    const id = setInterval(() => {
      const cur = stateRef.current
      const bots = cur.players.filter((p) => !p.isHuman && p.alive)
      bots.forEach((bot) => {
        if (Math.random() > 0.4) return
        if (bot.tokens >= cur.settings.costs.hack) {
          const gain = pickN([5, 10, 15], 1)[0]
          dispatch({ type: 'doHack', playerId: bot.id, gainedCoins: gain })
        }
      })
    }, 5500)
    return () => clearInterval(id)
  }, [state.phase])

  const answer = useCallback((choice: number) => {
    const cur = stateRef.current
    dispatch({ type: 'answerQuestion', playerId: cur.meId, choice })
    setTimeout(() => dispatch({ type: 'nextQuestion' }), 700)
  }, [])

  const doHack = useCallback((gainedCoins: number) => {
    dispatch({ type: 'doHack', playerId: stateRef.current.meId, gainedCoins })
  }, [])

  const doSpy = useCallback((targetId: string) => {
    dispatch({ type: 'doSpy', spyId: stateRef.current.meId, targetId })
  }, [])

  const doPassword = useCallback((targetId: string, guess: string) => {
    dispatch({ type: 'doPassword', guesserId: stateRef.current.meId, targetId, guess })
  }, [])

  return { state, dispatch, answer, doHack, doSpy, doPassword, defaultAvatarFor: defaultAvatar }
}
