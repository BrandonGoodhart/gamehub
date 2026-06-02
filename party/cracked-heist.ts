import type * as Party from 'partykit/server'
import { makeInitialState, reducer, type GameAction } from '../src/games/cracked-heist/reducer'
import type { Avatar, Player, Question, RoomState } from '../src/games/cracked-heist/types'
import { PASSWORD_POOL } from '../src/games/cracked-heist/utils'
import { botAnswer, botSkill } from '../src/games/cracked-heist/bots'

interface ClientToServer {
  type: 'JOIN' | 'ACTION' | 'PING'
  handle?: string
  avatar?: Avatar
  isHost?: boolean
  action?: GameAction
}

interface ServerToClient {
  type: 'STATE' | 'WELCOME' | 'ERROR' | 'KICKED'
  state?: RoomState
  meId?: string
  message?: string
}

// Map connection.id → playerId so we can clean up when someone disconnects
type ConnMeta = { playerId: string }

export default class CrackedHeistServer implements Party.Server {
  state: RoomState
  // Per-connection metadata, keyed by conn.id
  conns = new Map<string, ConnMeta>()
  // Whether anyone has ever connected to this room (host claim)
  hasHost = false
  timerInterval: ReturnType<typeof setInterval> | null = null
  questionTimeout: ReturnType<typeof setTimeout> | null = null
  botTimers = new Set<ReturnType<typeof setTimeout>>()
  botActionInterval: ReturnType<typeof setInterval> | null = null

  constructor(readonly room: Party.Room) {
    this.state = makeInitialState(room.id)
  }

  broadcast() {
    const payload: ServerToClient = { type: 'STATE', state: this.state }
    this.room.broadcast(JSON.stringify(payload))
  }

  apply(action: GameAction) {
    this.state = reducer(this.state, action)
    this.broadcast()
    this.maybeAdvanceLifecycle()
  }

  // ----- Lifecycle helpers (timers, questions, bots) -----

  maybeAdvanceLifecycle() {
    if (this.state.phase === 'countdown' && !this.questionTimeout) {
      this.startCountdown()
    }
    if (this.state.phase === 'playing' && !this.timerInterval) {
      this.startPlayingTimers()
    }
    if (this.state.phase !== 'playing' && this.timerInterval) {
      this.stopPlayingTimers()
    }
  }

  startCountdown() {
    const tick = () => {
      if (this.state.phase !== 'countdown') return
      if (this.state.countdownValue < 0) {
        this.apply({ type: 'startRound' })
        return
      }
      this.questionTimeout = setTimeout(() => {
        this.apply({ type: 'tickCountdown' })
        tick()
      }, 1000) as unknown as ReturnType<typeof setTimeout>
    }
    tick()
  }

  startPlayingTimers() {
    this.timerInterval = setInterval(() => {
      if (this.state.phase !== 'playing') {
        this.stopPlayingTimers()
        return
      }
      this.apply({ type: 'tickTimer' })
      if (this.state.timeLeft <= 0) {
        this.apply({ type: 'endGame' })
      }
    }, 1000)

    // Load first question
    setTimeout(() => {
      if (this.state.phase === 'playing' && !this.state.currentQuestion) {
        this.apply({ type: 'nextQuestion' })
        this.scheduleBotAnswers()
      }
    }, 400)

    // Bots take side-actions every few seconds
    this.botActionInterval = setInterval(() => {
      if (this.state.phase !== 'playing') return
      const bots = this.state.players.filter((p) => !p.isHuman && p.alive)
      for (const bot of bots) {
        if (Math.random() > 0.4) continue
        if (bot.tokens < this.state.settings.costs.hack) continue
        const targets = this.state.players.filter((p) => p.id !== bot.id && p.alive)
        if (targets.length === 0) continue
        const target = targets[Math.floor(Math.random() * targets.length)]
        const correct = Math.random() < 0.4
        this.apply({
          type: 'doHack',
          playerId: bot.id,
          targetId: target.id,
          correctPassword: correct,
        })
      }
    }, 5500)
  }

  stopPlayingTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
    if (this.botActionInterval) {
      clearInterval(this.botActionInterval)
      this.botActionInterval = null
    }
    this.botTimers.forEach((t) => clearTimeout(t))
    this.botTimers.clear()
  }

  scheduleBotAnswers() {
    const q: Question | null = this.state.currentQuestion
    if (!q) return
    const bots = this.state.players.filter((p) => !p.isHuman && p.alive)
    bots.forEach((bot) => {
      const skill = botSkill(bot)
      const delay = 1800 + Math.random() * 7000
      const t = setTimeout(() => {
        if (this.state.currentQuestion !== q || this.state.phase !== 'playing') return
        const choice = botAnswer(q, skill)
        this.apply({ type: 'answerQuestion', playerId: bot.id, choice })
        this.botTimers.delete(t)
      }, delay) as unknown as ReturnType<typeof setTimeout>
      this.botTimers.add(t)
    })
  }

  // ----- Party.Server hooks -----

  onConnect(conn: Party.Connection) {
    // Tell the client who they are. They'll send JOIN with their handle/avatar next.
    const welcome: ServerToClient = {
      type: 'WELCOME',
      meId: conn.id,
      state: this.state,
    }
    conn.send(JSON.stringify(welcome))
  }

  onClose(conn: Party.Connection) {
    const meta = this.conns.get(conn.id)
    if (meta) {
      this.apply({ type: 'removePlayer', id: meta.playerId })
      this.conns.delete(conn.id)
    }
    // If the room is empty, reset
    if (this.conns.size === 0) {
      this.stopPlayingTimers()
      this.hasHost = false
      this.state = makeInitialState(this.room.id)
    }
  }

  onMessage(raw: string, sender: Party.Connection) {
    let msg: ClientToServer
    try {
      msg = JSON.parse(raw)
    } catch {
      return
    }
    if (msg.type === 'JOIN' && msg.handle && msg.avatar) {
      const wantsHost = !!msg.isHost && !this.hasHost
      const playerId = sender.id
      const player: Player = {
        id: playerId,
        handle: msg.handle,
        isHuman: true,
        isHost: wantsHost,
        avatar: msg.avatar,
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
      if (wantsHost) this.hasHost = true
      this.conns.set(sender.id, { playerId })
      this.apply({ type: 'addPlayer', player })
      return
    }

    if (msg.type === 'ACTION' && msg.action) {
      // Auto-assign bot passwords once everyone hits the password-pick phase
      // Lightweight guard against trusting clients beyond reason
      const meta = this.conns.get(sender.id)
      if (!meta) return
      // Forbid actions that pretend to be other players
      const a = msg.action
      if (
        ('playerId' in a && a.playerId && a.playerId !== meta.playerId) ||
        ('spyId' in a && a.spyId && a.spyId !== meta.playerId) ||
        ('guesserId' in a && a.guesserId && a.guesserId !== meta.playerId)
      ) {
        return
      }
      // Only host can kick / configure / start
      const isHost = this.state.hostId === meta.playerId
      const hostOnly: GameAction['type'][] = [
        'setSettings',
        'pickCategory',
        'pickCustomQuestions',
        'kickPlayer',
        'beginCountdown',
        'setPhase',
        'addBots',
        'reset',
      ]
      if (hostOnly.includes(a.type) && !isHost) return
      this.apply(a)
      // After lockPassword from everyone, host can begin countdown manually.
      // Auto-fill bot passwords when reaching pickPassword phase
      if (a.type === 'setPhase' && a.phase === 'pickPassword') {
        const bots = this.state.players.filter((p) => !p.isHuman && !p.passwordLocked)
        for (const b of bots) {
          const pw = PASSWORD_POOL[Math.floor(Math.random() * PASSWORD_POOL.length)]
          this.apply({ type: 'lockPassword', playerId: b.id, password: pw })
        }
      }
      // Schedule bot answers each time a new question comes up
      if (a.type === 'nextQuestion') {
        this.scheduleBotAnswers()
      }
      return
    }
  }
}
