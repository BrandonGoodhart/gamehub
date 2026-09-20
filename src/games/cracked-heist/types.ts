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

// The Last One Standing — 1v1 match knockout trivia
export interface BRState {
  // The two players currently in the ring. Everyone else watches.
  matchAId: string | null
  matchBId: string | null
  // Match score used for best-of formats (2-player games).
  scoreA: number
  scoreB: number
  // Number of round wins required to end this match. 1 = single-round
  // (loser is eliminated immediately), 2 = best-of-3, 3 = best-of-5, etc.
  scoreToWin: number
  // Current question shown to A and B.
  currentQuestion: Question | null
  // How many questions we've played in the current game.
  questionIndex: number
  // Draw pool.
  questionQueue: Question[]
  // Per-question answers keyed by playerId — only A and B populate this.
  answers: { [playerId: string]: number }
  // Champion when the game is over.
  championId: string | null
  // Marks that the current match's result has been revealed, so the UI can
  // hold on it briefly before the host advances to the next match / question.
  matchResolved: boolean
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
