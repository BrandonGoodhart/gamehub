import type { ActionKind, Avatar, BRMatch, BRState, EventLog, Phase, Player, Question, RiskOutcome, RoomState, Settings } from './types'
import { RISK_COST } from './types'
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
  roundSeconds: 420,
  allowLateJoin: false,
  gameMode: 'heist',
  brQuestionsPerMatch: 3,
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
    currentQuestion: null,
    questionQueue: [],
    questionTick: 0,
    brEliminated: false,
    brMatchesWon: 0,
    brMatchesLost: 0,
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
    events: [],
    fullLog: [],
    settings: { ...DEFAULT_SETTINGS },
    pendingAction: null,
    countdownValue: 3,
    shareCode: null,
    isJoiner: false,
    br: null,
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
  | { type: 'nextQuestion'; playerId: string }
  | { type: 'answerQuestion'; playerId: string; choice: number }
  | { type: 'event'; event: EventLog }
  | { type: 'doSpy'; spyId: string; targetId: string; correct: boolean }
  | { type: 'doHack'; playerId: string; targetId: string; correctPassword: boolean }
  | { type: 'doPassword'; guesserId: string; targetId: string; correctPassword: boolean }
  | { type: 'doRisk'; playerId: string; outcome: RiskOutcome }
  | { type: 'startRound' }
  | { type: 'endGame' }
  | { type: 'setShareCode'; code: string }
  | { type: 'reset' }
  | { type: 'setPending'; kind: ActionKind | null }
  // Battle Royale actions
  | { type: 'brStart' }
  | { type: 'brNextRound' }
  | { type: 'brAnswer'; playerId: string; matchId: string; correct: boolean }
  | { type: 'brFinishMatch'; matchId: string }
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
    currentQuestion: null,
    questionQueue: [],
    questionTick: 0,
    brEliminated: false,
    brMatchesWon: 0,
    brMatchesLost: 0,
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
      }
    case 'pickCustomQuestions': {
      return {
        ...state,
        category: action.label ?? 'Custom',
        customQuestions: action.questions,
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
      const me = state.players.find((p) => p.id === action.playerId)
      if (!me) return state
      const refill = state.customQuestions
        ? [...state.customQuestions].sort(() => Math.random() - 0.5)
        : shuffledQs(state.category ?? CATEGORIES[0])
      const queueSrc = me.questionQueue.length > 0 ? me.questionQueue : refill
      const [next, ...rest] = queueSrc
      return updatePlayer(state, action.playerId, {
        currentQuestion: next,
        questionQueue: rest,
        questionTick: me.questionTick + 1,
      })
    }
    case 'answerQuestion': {
      const me = state.players.find((p) => p.id === action.playerId)
      if (!me) return state
      const q = me.currentQuestion
      if (!q) return state
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
    case 'doRisk': {
      const p = state.players.find((x) => x.id === action.playerId)
      if (!p) return state
      if (p.coins < RISK_COST) return state
      const afterCost = p.coins - RISK_COST
      let next: number
      let label: string
      switch (action.outcome) {
        case 'x2':      next = afterCost * 2;                  label = '×2';   break
        case 'x3':      next = afterCost * 3;                  label = '×3';   break
        case 'half':    next = Math.floor(afterCost / 2);      label = '÷2';   break
        case 'plus5':   next = afterCost + 5;                  label = '+5';   break
        case 'plus10':  next = afterCost + 10;                 label = '+10';  break
        case 'minus5':  next = Math.max(0, afterCost - 5);     label = '−5';   break
        case 'minus10': next = Math.max(0, afterCost - 10);    label = '−10';  break
        case 'zero':    next = afterCost;                       label = 'nothing'; break
      }
      const s1 = updatePlayer(state, p.id, { coins: Math.max(0, next) })
      return addEvent(s1, `${p.handle} risked it — ${label}.`, 'neutral')
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
        players: state.players.map((p) => ({ ...p, currentQuestion: null })),
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

    // ============================================================
    // Battle Royale
    // ============================================================
    case 'brStart': {
      const source = state.customQuestions
        ? [...state.customQuestions]
        : shuffledQs(state.category ?? CATEGORIES[0])
      // Reset any prior BR state and start round 1.
      const alivePlayers = state.players.map((p) => ({
        ...p,
        brEliminated: false,
        brMatchesWon: 0,
        brMatchesLost: 0,
      }))
      const brWithRound1 = buildNextRound(
        {
          round: 0,
          matches: [],
          championId: null,
          questionQueue: [...source].sort(() => Math.random() - 0.5),
        },
        alivePlayers,
        state.settings.brQuestionsPerMatch,
      )
      return {
        ...state,
        phase: 'brMatch',
        players: alivePlayers,
        br: brWithRound1,
      }
    }

    case 'brNextRound': {
      if (!state.br) return state
      // Eliminate everyone who lost their match this round
      const nextPlayers = state.players.map((p) => {
        const wasInMatch = state.br!.matches.some(
          (m) => (m.playerAId === p.id || m.playerBId === p.id) && m.done,
        )
        if (!wasInMatch) return p
        const lost = state.br!.matches.some(
          (m) => m.done && m.winnerId !== p.id && (m.playerAId === p.id || m.playerBId === p.id),
        )
        return lost ? { ...p, brEliminated: true } : p
      })
      const survivors = nextPlayers.filter((p) => !p.brEliminated)
      if (survivors.length <= 1) {
        // Champion crowned
        return {
          ...state,
          phase: 'brChampion',
          players: nextPlayers,
          br: {
            ...state.br,
            championId: survivors[0]?.id ?? null,
            matches: [],
          },
        }
      }
      const nextBR = buildNextRound(
        state.br,
        survivors,
        state.settings.brQuestionsPerMatch,
      )
      return {
        ...state,
        phase: 'brMatch',
        players: nextPlayers,
        br: nextBR,
      }
    }

    case 'brAnswer': {
      if (!state.br) return state
      const nextMatches = state.br.matches.map((m) => {
        if (m.id !== action.matchId || m.done) return m
        if (action.playerId === m.playerAId && !m.playerAAnswered) {
          return {
            ...m,
            playerAAnswered: true,
            playerACorrect: action.correct,
            scoreA: m.scoreA + (action.correct ? 1 : 0),
          }
        }
        if (action.playerId === m.playerBId && !m.playerBAnswered) {
          return {
            ...m,
            playerBAnswered: true,
            playerBCorrect: action.correct,
            scoreB: m.scoreB + (action.correct ? 1 : 0),
          }
        }
        return m
      })
      return { ...state, br: { ...state.br, matches: nextMatches } }
    }

    case 'brFinishMatch': {
      if (!state.br) return state
      const totalQ = state.settings.brQuestionsPerMatch
      const nextMatches = state.br.matches.map((m) => {
        if (m.id !== action.matchId || m.done) return m
        const bothAnswered = m.playerAAnswered && m.playerBAnswered
        if (!bothAnswered) return m
        const nextQAnswered = m.questionsAnswered + 1
        // Match ends when a player has enough wins that opponent can't catch up
        const remaining = totalQ - nextQAnswered
        const aCanWin = m.scoreA + remaining >= m.scoreB
        const bCanWin = m.scoreB + remaining >= m.scoreA
        if (nextQAnswered >= totalQ || !(aCanWin && bCanWin)) {
          const winnerId =
            m.scoreA > m.scoreB
              ? m.playerAId
              : m.scoreB > m.scoreA
                ? m.playerBId
                : m.playerAId
          return {
            ...m,
            questionsAnswered: nextQAnswered,
            done: true,
            winnerId,
            currentQuestion: null,
          }
        }
        // Advance to next question — queue is drawn from state.br.questionQueue
        // outside this map. Reset per-question flags for the next question.
        const nextQ = state.br!.questionQueue[0] ?? null
        return {
          ...m,
          questionsAnswered: nextQAnswered,
          currentQuestion: nextQ,
          playerAAnswered: false,
          playerBAnswered: false,
          playerACorrect: false,
          playerBCorrect: false,
        }
      })
      // Consume queue for advanced matches
      const consumed = nextMatches.filter(
        (m, i) =>
          !m.done && state.br!.matches[i].questionsAnswered !== m.questionsAnswered,
      ).length
      const nextQueue = state.br.questionQueue.slice(consumed)

      // Once we ran out of unique questions, refill from source
      const refillIfEmpty =
        nextQueue.length < 10
          ? [
              ...nextQueue,
              ...(state.customQuestions
                ? [...state.customQuestions].sort(() => Math.random() - 0.5)
                : shuffledQs(state.category ?? CATEGORIES[0])),
            ]
          : nextQueue

      // Update the winner/loser stats
      const finishedMatch = nextMatches.find((m) => m.id === action.matchId && m.done)
      let nextPlayers = state.players
      if (finishedMatch && finishedMatch.winnerId) {
        const loserId =
          finishedMatch.winnerId === finishedMatch.playerAId
            ? finishedMatch.playerBId
            : finishedMatch.playerAId
        nextPlayers = state.players.map((p) => {
          if (p.id === finishedMatch.winnerId) return { ...p, brMatchesWon: p.brMatchesWon + 1 }
          if (p.id === loserId) return { ...p, brMatchesLost: p.brMatchesLost + 1 }
          return p
        })
      }

      // If every match is done, transition to matchResult phase
      const allDone = nextMatches.every((m) => m.done)
      return {
        ...state,
        players: nextPlayers,
        phase: allDone ? 'brMatchResult' : state.phase,
        br: { ...state.br, matches: nextMatches, questionQueue: refillIfEmpty },
      }
    }
  }
}

// Build the next Battle Royale round: pair the survivors, deal first questions.
function buildNextRound(br: BRState, survivors: Player[], questionsPerMatch: number): BRState {
  const shuffled = [...survivors].sort(() => Math.random() - 0.5)
  const matches: BRMatch[] = []
  const nextRound = br.round + 1
  let queue = [...br.questionQueue]

  // If odd, one player gets a bye (auto-advance to next round without playing).
  // We handle it by pairing an odd person with themselves and marking them a
  // pass-through winner immediately.
  let i = 0
  while (i < shuffled.length - 1) {
    const a = shuffled[i]
    const b = shuffled[i + 1]
    const [q, ...restQ] = queue
    queue = restQ
    matches.push({
      id: `r${nextRound}m${i / 2}`,
      round: nextRound,
      playerAId: a.id,
      playerBId: b.id,
      scoreA: 0,
      scoreB: 0,
      questionsAnswered: 0,
      currentQuestion: q ?? null,
      playerAAnswered: false,
      playerBAnswered: false,
      playerACorrect: false,
      playerBCorrect: false,
      done: false,
      winnerId: null,
    })
    i += 2
  }
  // Odd count: give the last player a free-pass match against themselves
  // (winner set immediately). questionsPerMatch is referenced to hint at the
  // format but not strictly used here.
  void questionsPerMatch
  if (i === shuffled.length - 1) {
    const solo = shuffled[i]
    matches.push({
      id: `r${nextRound}bye`,
      round: nextRound,
      playerAId: solo.id,
      playerBId: solo.id,
      scoreA: 1,
      scoreB: 0,
      questionsAnswered: 1,
      currentQuestion: null,
      playerAAnswered: true,
      playerBAnswered: true,
      playerACorrect: true,
      playerBCorrect: false,
      done: true,
      winnerId: solo.id,
    })
  }

  return {
    round: nextRound,
    matches,
    championId: null,
    questionQueue: queue,
  }
}
