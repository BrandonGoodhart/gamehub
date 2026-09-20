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
  | 'brPlaying'
  | 'brChampion'

export type GameMode = 'heist' | 'battleRoyale'

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
  // Per-player question stream — each player advances at their own pace
  currentQuestion: Question | null
  questionQueue: Question[]
  questionTick: number
  // Battle Royale
  brEliminated: boolean
  brMatchesWon: number
  brMatchesLost: number
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
  allowLateJoin: boolean
  gameMode: GameMode
  brQuestionsPerMatch: number // 1 or 3
  costs: { spy: number; hack: number; password: number }
  rewards: {
    spyCatch: number
    passwordCatch: number
    correctAnswerCoins: number
    correctAnswerTokens: number
  }
}

// Battle Royale — simple elimination trivia
export interface BRState {
  // Shared question state — everyone sees the same question
  currentQuestion: Question | null
  questionIndex: number
  questionQueue: Question[]
  // Map of playerId → their answer for the current question (choice index)
  answers: { [playerId: string]: number }
  // Elapsed ms since currentQuestion showed up (used for timer / tiebreaks)
  questionStartedAt: number
  // Deadline in ms since epoch when the question times out
  deadline: number
  // Winner if the round is over
  championId: string | null
  // How many seconds each question gives you before you're eliminated
  secondsPerQuestion: number
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
  events: EventLog[]
  fullLog: EventLog[]
  settings: Settings
  pendingAction: ActionKind | null
  countdownValue: number
  shareCode: string | null
  isJoiner: boolean
  br: BRState | null
}

export interface SharedGame {
  code: string
  finishedAt: number
  category: string | null
  seconds: number
  players: { handle: string; color: string; coins: number; tokens: number; hacks: number; caught: number }[]
  log: EventLog[]
}
