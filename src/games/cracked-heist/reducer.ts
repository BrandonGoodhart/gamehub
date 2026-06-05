import type { ActionKind, Avatar, EventLog, Phase, Player, Question, RoomState, Settings } from './types'
import { makePasswordOptions, pickN, uid } from './utils'
import { BOT_NAMES } from './words'
import { CATEGORIES, QUESTION_BANK } from './questions'
import { randomAvatar } from './avatar'

function allTakenPasswords(state: RoomState): Set<string> {
  const taken = new Set<string>()
  for (const p of state.players) {
    if (p.password) taken.add(p.password)
    for (const opt of p.passwordOptions) taken.add(opt)
  }
  return taken
}

export const DEFAULT_SETTINGS: Settings = {
  roundSeconds: 60,
  costs: { spy: 10, hack: 15, password: 15 },
  rewards: {
    spyCatch: 5,
    passwordCatch: 5,
    correctAnswerCoins: 0,
    correctAnswerTokens: 2,
  },
}

let eventCounter = 0
export function makeEvent(text: string, tone: EventLog['tone']): EventLog {
  return { id: ++eventCounter, text, tone, ts: Date.now() }
}

export function makeBotPlayer(handle: string, taken: Set<string> = new Set()): Player {
  const options = makePasswordOptions(3, taken)
  const password = options[Math.floor(Math.random() * options.length)]
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
    password,
    passwordLocked: true,
    passwordOptions: options,
    alive: true,
  }
}

export function makeInitialState(code: string): RoomState {
  return {
    code,
    phase: 'hostLobby',
    timeLeft: DEFAULT_SETTINGS.roundSeconds,
    players: [],
    meId: '',
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

export type GameAction =
  | { type: 'setPhase'; phase: Phase }
  | { type: 'setSettings'; patch: Partial<Settings> }
  | { type: 'addPlayer'; player: Player }
  | { type: 'removePlayer'; id: string }
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
  | { type: 'addBots'; count: number }

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

export function makePlayer(
  id: string,
  handle: string,
  avatar: Avatar,
  isHost: boolean,
  taken: Set<string> = new Set(),
): Player {
  return {
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
    passwordOptions: makePasswordOptions(3, taken),
    alive: true,
  }
}

export function reducer(state: RoomState, action: GameAction): RoomState {
  switch (action.type) {
    case 'setPhase':
      return { ...state, phase: action.phase }
    case 'setSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'addPlayer': {
      if (state.players.some((p) => p.id === action.player.id)) return state
      // Reject duplicate handles (case-insensitive) — host and joining player both keep theirs only if unique
      if (
        state.players.some(
          (p) => p.handle.trim().toLowerCase() === action.player.handle.trim().toLowerCase(),
        )
      )
        return state
      // If the incoming player doesn't have password options yet, allocate unique ones
      const taken = allTakenPasswords(state)
      const playerWithOptions =
        action.player.passwordOptions && action.player.passwordOptions.length > 0
          ? action.player
          : { ...action.player, passwordOptions: makePasswordOptions(3, taken) }
      const next = { ...state, players: [...state.players, playerWithOptions] }
      const ev = makeEvent(`${playerWithOptions.handle} joined.`, 'system')
      return {
        ...next,
        hostId: playerWithOptions.isHost ? playerWithOptions.id : next.hostId,
        events: [ev, ...next.events],
        fullLog: [...next.fullLog, ev],
      }
    }
    case 'removePlayer': {
      const player = state.players.find((p) => p.id === action.id)
      if (!player) return state
      const next = {
        ...state,
        players: state.players.filter((p) => p.id !== action.id),
      }
      const ev = makeEvent(`${player.handle} left.`, 'system')
      return { ...next, events: [ev, ...next.events], fullLog: [...next.fullLog, ev] }
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
    case 'addBots': {
      const used = new Set(state.players.map((p) => p.handle.toLowerCase()))
      const fresh = BOT_NAMES.filter((b) => !used.has(b.toLowerCase()))
      const taken = allTakenPasswords(state)
      const newBots = pickN(fresh, action.count).map((h) => makeBotPlayer(h, taken))
      return { ...state, players: [...state.players, ...newBots] }
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
        return {
          ...next,
          fullLog: [
            ...next.fullLog,
            makeEvent(`${me.handle} answered correctly. +${tokens} tokens.`, 'neutral'),
          ],
        }
      }
      return {
        ...state,
        fullLog: [...state.fullLog, makeEvent(`${me.handle} answered wrong.`, 'neutral')],
      }
    }
    case 'event':
      return {
        ...state,
        events: [action.event, ...state.events].slice(0, 60),
        fullLog: [...state.fullLog, action.event],
      }
    case 'doHack': {
      const p = state.players.find((x) => x.id === action.playerId)
      const target = state.players.find((x) => x.id === action.targetId)
      if (!p || !target) return state
      const cost = state.settings.costs.hack
      if (p.tokens < cost) return state
      let s1 = updatePlayer(state, action.playerId, {
        tokens: p.tokens - cost,
        hacksDone: p.hacksDone + 1,
      })
      if (action.correctPassword) {
        const reward = state.settings.rewards.passwordCatch
        const pNow = s1.players.find((x) => x.id === p.id)!
        // Winner always gets the full reward; target loses up to that many
        // (clamped at 0 so they don't go negative)
        s1 = updatePlayer(s1, p.id, { coins: pNow.coins + reward, hackedRecently: true })
        s1 = updatePlayer(s1, target.id, { coins: Math.max(0, target.coins - reward) })
        return addEvent(s1, `${p.handle} hacked ${target.handle} for ${reward} coins.`, 'neutral')
      }
      s1 = updatePlayer(s1, p.id, { hackedRecently: true })
      return addEvent(s1, `${p.handle} tried to hack and failed.`, 'neutral')
    }
    case 'doSpy': {
      const spy = state.players.find((x) => x.id === action.spyId)
      const target = state.players.find((x) => x.id === action.targetId)
      if (!spy || !target) return state
      const cost = state.settings.costs.spy
      if (spy.tokens < cost) return state
      let s1 = updatePlayer(state, spy.id, {
        tokens: spy.tokens - cost,
        spiesDone: spy.spiesDone + 1,
      })
      if (action.correct) {
        const reward = state.settings.rewards.spyCatch
        const spyNow = s1.players.find((p) => p.id === spy.id)!
        s1 = updatePlayer(s1, spy.id, { coins: spyNow.coins + reward })
        // Caught player loses up to `reward` coins (clamped at 0)
        s1 = updatePlayer(s1, target.id, {
          coins: Math.max(0, target.coins - reward),
          caughtCount: target.caughtCount + 1,
          hackedRecently: false,
        })
        return addEvent(s1, `${spy.handle} caught ${target.handle}.`, 'neutral')
      }
      return addEvent(s1, `${spy.handle} spied around quietly.`, 'neutral')
    }
    case 'doPassword': {
      const g = state.players.find((x) => x.id === action.guesserId)
      const t = state.players.find((x) => x.id === action.targetId)
      if (!g || !t) return state
      const cost = state.settings.costs.password
      if (g.tokens < cost) return state
      let s1 = updatePlayer(state, g.id, {
        tokens: g.tokens - cost,
        passwordsGuessed: g.passwordsGuessed + 1,
      })
      if (action.correctPassword) {
        const reward = state.settings.rewards.passwordCatch
        const gNow = s1.players.find((p) => p.id === g.id)!
        // Winner gets the reward; target loses up to that many (clamped at 0)
        s1 = updatePlayer(s1, g.id, { coins: gNow.coins + reward })
        s1 = updatePlayer(s1, t.id, { coins: Math.max(0, t.coins - reward) })
        return addEvent(s1, `${g.handle} tricked ${t.handle} for ${reward} coins.`, 'neutral')
      }
      return addEvent(s1, `${g.handle} tried a phish and failed.`, 'neutral')
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
      return makeInitialState(state.code)
  }
}
