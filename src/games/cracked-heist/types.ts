export type Phase = 'lobby' | 'pickWord' | 'pickCategory' | 'playing' | 'roundEnd' | 'gameOver'

export type ActionKind = 'spy' | 'hack' | 'password'

export interface Player {
  id: string
  handle: string
  isHuman: boolean
  coins: number
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
  startingCoins: number
  costs: { spy: number; hack: number; password: number }
  rewards: { hack: number; spyCatch: number; passwordCatch: number; correctAnswer: number }
}

export interface RoomState {
  code: string
  phase: Phase
  round: number
  timeLeft: number
  players: Player[]
  meId: string
  category: string | null
  questionQueue: Question[]
  currentQuestion: Question | null
  questionStartTs: number
  events: EventLog[]
  settings: Settings
  pendingAction: ActionKind | null
}
