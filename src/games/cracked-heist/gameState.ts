import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { ActionKind, EventLog, Phase, Player, Question, RoomState, Settings } from './types'
import { generatePassword, generateRoomCode, pickN, uid } from './utils'
import { BOT_NAMES, HANDLES } from './words'
import { CATEGORIES, QUESTION_BANK } from './questions'
import { botAnswer, botDecideAction, botSkill } from './bots'

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

function makeHumanPlayer(handle: string): Player {
  return { ...makeBotPlayer(handle), isHuman: true }
}

function initialState(): RoomState {
  const meId = uid()
  const handle = 'YOU'
  const me: Player = { ...makeHumanPlayer(handle), id: meId }
  const bots = pickN(BOT_NAMES, 4).map(makeBotPlayer)
  return {
    code: generateRoomCode(),
    phase: 'lobby',
    round: 0,
    timeLeft: DEFAULT_SETTINGS.roundSeconds,
    players: [me, ...bots],
    meId,
    category: null,
    questionQueue: [],
    currentQuestion: null,
    questionStartTs: 0,
    events: [makeEvent('Room initialized. Awaiting hackers...', 'system')],
    settings: { ...DEFAULT_SETTINGS },
    pendingAction: null,
  }
}

type Action =
  | { type: 'setPhase'; phase: Phase }
  | { type: 'setSettings'; patch: Partial<Settings> }
  | { type: 'pickHandle'; handle: string }
  | { type: 'pickCategory'; category: string }
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
    case 'pickHandle': {
      const next = updatePlayer(state, state.meId, { handle: action.handle })
      const used = new Set(next.players.map((p) => p.handle))
      const fresh = HANDLES.filter((h) => !used.has(h))
      let i = 0
      const withBots = next.players.map((p) => {
        if (p.isHuman) return p
        if (p.handle === action.handle || HANDLES.includes(p.handle)) return p
        const newH = fresh[i++ % fresh.length] ?? p.handle
        return { ...p, handle: newH }
      })
      return { ...next, players: withBots }
    }
    case 'pickCategory':
      return { ...state, category: action.category, questionQueue: shuffledQs(action.category) }
    case 'tickTimer':
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) }
    case 'nextQuestion': {
      const [next, ...rest] = state.questionQueue.length > 0 ? state.questionQueue : shuffledQs(state.category ?? CATEGORIES[0])
      const queue = state.questionQueue.length > 0 ? rest : shuffledQs(state.category ?? CATEGORIES[0])
      return { ...state, currentQuestion: next, questionStartTs: Date.now(), questionQueue: queue }
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
        if (me.isHuman) {
          return addEvent(next, `+${reward}c // signal decoded`, 'good')
        }
        return next
      }
      if (me.isHuman) return addEvent(state, `Wrong key. Signal lost.`, 'bad')
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
        return p.isHuman ? addEvent(state, 'Not enough coins to hack.', 'bad') : state
      }
      const next = updatePlayer(state, action.playerId, {
        coins: p.coins - c + r,
        hackedInRounds: [...p.hackedInRounds, state.round],
        hacksDone: p.hacksDone + 1,
      })
      const tone: EventLog['tone'] = p.isHuman ? 'good' : 'neutral'
      const msg = p.isHuman
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
        return spy.isHuman ? addEvent(state, 'Not enough coins to spy.', 'bad') : state
      }
      const recentlyHacked = target.hackedInRounds.some((r) => r >= state.round - 2)
      let s1 = updatePlayer(state, spy.id, { coins: spy.coins - c, spiesDone: spy.spiesDone + 1 })
      if (recentlyHacked) {
        const steal = Math.min(target.coins, state.settings.rewards.spyCatch)
        s1 = updatePlayer(s1, target.id, { coins: target.coins - steal, caughtCount: target.caughtCount + 1 })
        const spyNow = s1.players.find((p) => p.id === spy.id)!
        s1 = updatePlayer(s1, spy.id, { coins: spyNow.coins + steal })
        const tone: EventLog['tone'] = spy.isHuman ? 'good' : 'bad'
        const msg = spy.isHuman
          ? `>> CAUGHT ${target.handle} red-handed. +${steal}c stolen!`
          : target.isHuman
            ? `${spy.handle} caught YOU hacking. -${steal}c.`
            : `${spy.handle} caught ${target.handle} hacking.`
        return addEvent(s1, msg, tone)
      }
      const tone: EventLog['tone'] = spy.isHuman ? 'bad' : 'neutral'
      const msg = spy.isHuman
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
        return g.isHuman ? addEvent(state, 'Not enough coins to crack password.', 'bad') : state
      }
      let s1 = updatePlayer(state, g.id, { coins: g.coins - c, passwordsGuessed: g.passwordsGuessed + 1 })
      if (action.guess === t.password) {
        const steal = Math.min(t.coins, state.settings.rewards.passwordCatch)
        s1 = updatePlayer(s1, t.id, { coins: t.coins - steal, password: generatePassword() })
        const gNow = s1.players.find((p) => p.id === g.id)!
        s1 = updatePlayer(s1, g.id, { coins: gNow.coins + steal })
        const tone: EventLog['tone'] = g.isHuman ? 'good' : 'bad'
        const msg = g.isHuman
          ? `>> CRACKED ${t.handle}'s password! +${steal}c.`
          : t.isHuman
            ? `${g.handle} cracked YOUR password. -${steal}c.`
            : `${g.handle} cracked ${t.handle}'s password.`
        return addEvent(s1, msg, tone)
      }
      const tone: EventLog['tone'] = g.isHuman ? 'bad' : 'neutral'
      const msg = g.isHuman
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

  const advanceQuestion = useCallback(() => {
    dispatch({ type: 'nextQuestion' })
  }, [])

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

  return { state, dispatch, advanceQuestion, answer, doHack, doSpy, doPassword }
}
