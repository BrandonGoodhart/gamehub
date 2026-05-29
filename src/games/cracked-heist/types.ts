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
  | 'countdown'
  | 'playing'
  | 'roundEnd'
  | 'gameOver'

export type ActionKind = 'spy' | 'hack' | 'password'

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
  hackedInRounds: number[]
  caughtCount: number
  hacksDone: number
  spiesDone: number
  passwordsGuessed: number
  password: string
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
  totalRounds: number
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
  round: number
  timeLeft: number
  players: Player[]
  meId: string
  hostId: string
  category: string | null
  customQuestions: Question[] | null
  questionQueue: Question[]
  currentQuestion: Question | null
  questionStartTs: number
  events: EventLog[]
  fullLog: EventLog[]
  settings: Settings
  pendingAction: ActionKind | null
  countdownValue: number
  shareCode: string | null
}

export interface SharedGame {
  code: string
  finishedAt: number
  category: string | null
  rounds: number
  players: { handle: string; color: string; coins: number; tokens: number; hacks: number; caught: number }[]
  log: EventLog[]
}
