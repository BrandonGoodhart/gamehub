export type Phase =
  | 'loading'
  | 'start'
  | 'hostLobby'
  | 'joinPrompt'
  | 'pickAvatar'
  | 'pickCategory'
  | 'customQuestions'
  | 'viewShared'
  | 'pregame'
  | 'pickPassword'
  | 'countdown'
  | 'playing'
  | 'gameOver'

export type ActionKind = 'spy' | 'hack' | 'password' | 'risk'

export type RiskOutcome = 'x2' | 'x3' | 'half' | 'plus5' | 'plus10' | 'minus5' | 'minus10' | 'zero'

export const RISK_OUTCOMES: RiskOutcome[] = ['x2', 'x3', 'half', 'plus5', 'plus10', 'minus5', 'minus10', 'zero']

export const RISK_COST = 3

export interface Avatar {
  color: string
}

export interface Player {
  id: string
  handle: string
  isHuman: boolean
  isHost: boolean
  avatar: Avatar
  coins: number
  tokens: number
  hackedRecently: boolean
  caughtCount: number
  hacksDone: number
  spiesDone: number
  passwordsGuessed: number
  password: string
  passwordLocked: boolean
  passwordOptions: string[]
  alive: boolean
}

export interface Question {
  q: string
  choices: string[]
  answer: number
}

export interface EventLog {
  id: number
  text: string
  tone: 'good' | 'bad' | 'neutral' | 'system'
  ts: number
}

export interface Settings {
  roundSeconds: number
  costs: { spy: number; hack: number; password: number }
  rewards: {
    spyCatch: number
    passwordCatch: number
    correctAnswerCoins: number
    correctAnswerTokens: number
  }
}

export interface RoomState {
  code: string
  phase: Phase
  timeLeft: number
  players: Player[]
  meId: string
  hostId: string
  category: string | null
  customQuestions: Question[] | null
  questionQueue: Question[]
  currentQuestion: Question | null
  questionTick: number
  events: EventLog[]
  fullLog: EventLog[]
  settings: Settings
  pendingAction: ActionKind | null
  countdownValue: number
  shareCode: string | null
  isJoiner: boolean
}

export interface SharedGame {
  code: string
  finishedAt: number
  category: string | null
  seconds: number
  players: { handle: string; color: string; coins: number; tokens: number; hacks: number; caught: number }[]
  log: EventLog[]
}
