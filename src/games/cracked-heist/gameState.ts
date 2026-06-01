import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { ActionKind, Avatar, EventLog, Phase, Player, Question, RoomState, Settings } from './types'
import { generatePassword, generateRoomCode, pickN, uid, PASSWORD_POOL } from './utils'
import { BOT_NAMES } from './words'
import { CATEGORIES, QUESTION_BANK } from './questions'
import { botAnswer, botSkill } from './bots'
import { defaultAvatar, randomAvatar } from './avatar'

const DEFAULT_SETTINGS: Settings = {
  roundSeconds: 60,
  costs: { spy: 10, hack: 15, password: 15 },
  rewards: {
    spyCatch: 10,
    passwordCatch: 15,
    correctAnswerCoins: 0,
    correctAnswerTokens: 2,
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
    hackedRecently: false,
    caughtCount: 0,
    hacksDone: 0,
    spiesDone: 0,
    passwordsGuessed: 0,
    password: generatePassword(),
    passwordLocked: true,
    alive: true,
  }
}

function initialState(): RoomState {
  const meId = uid()
  return {
    code: generateRoomCode(),
    phase: 'loading',
    timeLeft: DEFAULT_SETTINGS.roundSeconds,
    players: [],
    meId,
    hostId: '',
    category: null,
    customQuestions: null,
    questionQueue: [],
    currentQuestion: null,
    questionTick: 0,
    events: [],
    fullLog: [],
    settings: { ...DEFAULT_SETTINGS },
    pendingAction: null,
    countdownValue: 3,
    shareCode: null,
    isJoiner: false,
  }
}

type Action =
  | { type: 'setPhase'; phase: Phase }
  | { type: 'setSettings'; patch: Partial<Settings> }
  | { type: 'setRoomCode'; code: string }
  | { type: 'createAsHost'; handle: string; avatar: Avatar }
  | { type: 'joinAsPlayer'; handle: string; avatar: Avatar }
  | { type: 'addBotsForDemo'; count: number }
  | { type: 'kickPlayer'; id: string }
  | { type: 'pickCategory'; category: string }
  | { type: 'pickCustomQuestions'; questions: Question[]; label?: string }
  | { type: 'lockPassword'; playerId: string; password: string }
  | { type: 'beginCountdown' }
  | { type: 'tickCountdown' }
  | { type: 'tickTimer' }
  | { type: 'nextQuestion' }
  | { type: 'answerQuestion'; playerId: string; choice: number }
  | { type: 'event'; event: EventLog }
  | { type: 'doSpy'; spyId: string; targetId: string; correct: boolean }
  | { type: 'doHack'; playerId: string; targetId: string; correctPassword: boolean }
  | { type: 'doPassword'; guesserId: string; targetId: string; correctPassword: boolean }
  | { type: 'startRound' }
  | { type: 'endGame' }
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
    case 'setRoomCode':
      return { ...state, code: action.code, isJoiner: true }
    case 'createAsHost': {
      const me: Player = {
        id: state.meId,
        handle: action.handle,
        isHuman: true,
        isHost: true,
        avatar: action.avatar,
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
        hackedRecently: false,
        caughtCount: 0,
        hacksDone: 0,
        spiesDone: 0,
        passwordsGuessed: 0,
        password: '',
        passwordLocked: false,
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
        category: action.label ?? 'Custom',
        customQuestions: action.questions,
        questionQueue: shuffled,
      }
    }
    case 'lockPassword': {
      return updatePlayer(state, action.playerId, {
        password: action.password,
        passwordLocked: true,
      })
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
      return {
        ...state,
        currentQuestion: next,
        questionQueue: rest,
        questionTick: state.questionTick + 1,
      }
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
        if (me.id === state.meId) {
          const msg = coins > 0
            ? `Correct! +${tokens} tokens, +${coins} coins.`
            : `Correct! +${tokens} tokens.`
          return addEvent(next, msg, 'good')
        }
        return {
          ...next,
          fullLog: [
            ...next.fullLog,
            makeEvent(`${me.handle} answered correctly.`, 'neutral'),
          ],
        }
      }
      if (me.id === state.meId) return addEvent(state, `Wrong answer. No tokens.`, 'bad')
      return {
        ...state,
        fullLog: [...state.fullLog, makeEvent(`${me.handle} answered wrong.`, 'neutral')],
      }
    }
    case 'event':
      return { ...state, events: [action.event, ...state.events].slice(0, 60), fullLog: [...state.fullLog, action.event] }
    case 'doHack': {
      const p = state.players.find((x) => x.id === action.playerId)
      const target = state.players.find((x) => x.id === action.targetId)
      if (!p || !target) return state
      const cost = state.settings.costs.hack
      if (p.tokens < cost) {
        return p.id === state.meId ? addEvent(state, 'Not enough tokens to hack.', 'bad') : state
      }
      let s1 = updatePlayer(state, action.playerId, {
        tokens: p.tokens - cost,
        hacksDone: p.hacksDone + 1,
      })
      const isMe = p.id === state.meId
      if (action.correctPassword) {
        const reward = state.settings.rewards.passwordCatch
        const stealAmount = Math.min(target.coins, reward)
        const pNow = s1.players.find((x) => x.id === p.id)!
        s1 = updatePlayer(s1, p.id, { coins: pNow.coins + stealAmount, hackedRecently: true })
        s1 = updatePlayer(s1, target.id, { coins: target.coins - stealAmount })
        const msg = isMe
          ? `Hack succeeded on ${target.handle}! +${stealAmount} coins.`
          : `${p.handle} hacked ${target.handle}.`
        return addEvent(s1, msg, isMe ? 'good' : 'neutral')
      }
      const msg = isMe
        ? `Wrong password. Hack failed. -${cost} tokens.`
        : `${p.handle} tried to hack and failed.`
      // Failed hack still marks them as recently active (left a trace)
      const pNow = s1.players.find((x) => x.id === p.id)!
      s1 = updatePlayer(s1, p.id, { hackedRecently: true })
      void pNow
      return addEvent(s1, msg, isMe ? 'bad' : 'neutral')
    }
    case 'doSpy': {
      const spy = state.players.find((x) => x.id === action.spyId)
      const target = state.players.find((x) => x.id === action.targetId)
      if (!spy || !target) return state
      const cost = state.settings.costs.spy
      if (spy.coins < cost) {
        return spy.id === state.meId ? addEvent(state, 'Not enough coins to spy.', 'bad') : state
      }
      let s1 = updatePlayer(state, spy.id, {
        coins: spy.coins - cost,
        spiesDone: spy.spiesDone + 1,
      })
      const spyIsMe = spy.id === state.meId
      if (action.correct) {
        const reward = state.settings.rewards.spyCatch
        const spyNow = s1.players.find((p) => p.id === spy.id)!
        s1 = updatePlayer(s1, spy.id, { coins: spyNow.coins + reward })
        s1 = updatePlayer(s1, target.id, {
          caughtCount: target.caughtCount + 1,
          hackedRecently: false,
        })
        const msg = spyIsMe
          ? `Right! You caught ${target.handle}. +${reward} coins.`
          : `${spy.handle} caught a hacker.`
        return addEvent(s1, msg, spyIsMe ? 'good' : 'neutral')
      }
      const msg = spyIsMe
        ? `Wrong. Nothing happens. -${cost} coins wasted.`
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
      let s1 = updatePlayer(state, g.id, {
        coins: g.coins - cost,
        passwordsGuessed: g.passwordsGuessed + 1,
      })
      const gIsMe = g.id === state.meId
      if (action.correctPassword) {
        const reward = state.settings.rewards.passwordCatch
        const stealAmount = Math.min(t.coins, reward)
        const gNow = s1.players.find((p) => p.id === g.id)!
        s1 = updatePlayer(s1, g.id, { coins: gNow.coins + stealAmount })
        s1 = updatePlayer(s1, t.id, { coins: t.coins - stealAmount })
        const msg = gIsMe
          ? `Right! Cracked ${t.handle}'s password. +${stealAmount} coins.`
          : `${g.handle} cracked ${t.handle}'s password.`
        return addEvent(s1, msg, gIsMe ? 'good' : 'neutral')
      }
      const msg = gIsMe
        ? `Wrong password. Nothing happens. -${cost} coins wasted.`
        : `${g.handle} tried a password and failed.`
      return addEvent(s1, msg, gIsMe ? 'bad' : 'neutral')
    }
    case 'startRound': {
      const ev = makeEvent(`Game started.`, 'system')
      return {
        ...state,
        timeLeft: state.settings.roundSeconds,
        phase: 'playing',
        events: [ev, ...state.events],
        fullLog: [...state.fullLog, ev],
      }
    }
    case 'endGame': {
      const ev = makeEvent(`Time's up. Game over.`, 'system')
      return {
        ...state,
        phase: 'gameOver',
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
      dispatch({ type: 'endGame' })
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
      const t = setTimeout(() => dispatch({ type: 'nextQuestion' }), 400)
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

  // Bots randomly hack each other (so the spy mechanic has live targets)
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
        // Bots randomly succeed (40% of the time) — they have no real info either
        const correct = Math.random() < 0.4
        dispatch({
          type: 'doHack',
          playerId: bot.id,
          targetId: target.id,
          correctPassword: correct,
        })
      })
    }, 5500)
    return () => clearInterval(id)
  }, [state.phase])

  // Auto-assign bot passwords once everyone hits the password-pick phase
  useEffect(() => {
    if (state.phase !== 'pickPassword') return
    const bots = state.players.filter((p) => !p.isHuman && !p.passwordLocked)
    bots.forEach((bot) => {
      const pw = PASSWORD_POOL[Math.floor(Math.random() * PASSWORD_POOL.length)]
      dispatch({ type: 'lockPassword', playerId: bot.id, password: pw })
    })
  }, [state.phase, state.players])

  const answer = useCallback((choice: number) => {
    const cur = stateRef.current
    dispatch({ type: 'answerQuestion', playerId: cur.meId, choice })
    setTimeout(() => dispatch({ type: 'nextQuestion' }), 700)
  }, [])

  const doHack = useCallback((targetId: string, correctPassword: boolean) => {
    dispatch({
      type: 'doHack',
      playerId: stateRef.current.meId,
      targetId,
      correctPassword,
    })
  }, [])

  const doSpy = useCallback((targetId: string, correct: boolean) => {
    dispatch({ type: 'doSpy', spyId: stateRef.current.meId, targetId, correct })
  }, [])

  const doPassword = useCallback((targetId: string, correctPassword: boolean) => {
    dispatch({
      type: 'doPassword',
      guesserId: stateRef.current.meId,
      targetId,
      correctPassword,
    })
  }, [])

  return { state, dispatch, answer, doHack, doSpy, doPassword, defaultAvatarFor: defaultAvatar }
}
