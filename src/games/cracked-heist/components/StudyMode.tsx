// Solo "Study Mode" — single-player trivia practice. No multiplayer hooks,
// no room code, no actions/hacks/etc. Just answer questions for coins until
// you hit a time limit or a score target.

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Question } from '../types'
import AiChat from './AiChat'
import CustomQuestions from './CustomQuestions'
import QuestionCard from './QuestionCard'
import Countdown from './Countdown'
import confetti from 'canvas-confetti'
import { sfxCountdown } from '../audio'

const COINS_PER_CORRECT = 1

type Mode = 'timed' | 'score'

type LocalPhase =
  | 'setup'
  | 'aiChat'
  | 'questionEditor'
  | 'countdown'
  | 'playing'
  | 'gameOver'

interface Props {
  onExit: () => void
}

export default function StudyMode({ onExit }: Props) {
  const [phase, setPhase] = useState<LocalPhase>('setup')
  const [mode, setMode] = useState<Mode>('timed')
  const [minutes, setMinutes] = useState(7) // for timed mode
  const [scoreTarget, setScoreTarget] = useState(10) // for score mode
  const [source, setSource] = useState<'write' | 'ai'>('write')
  const [hardMode, setHardMode] = useState(false) // lose 1 coin per wrong answer

  const [questions, setQuestions] = useState<Question[]>([])
  const [topic, setTopic] = useState<string>('')

  const [queue, setQueue] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState<Question | null>(null)
  const [tick, setTick] = useState(0)
  const [coins, setCoins] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [countdownValue, setCountdownValue] = useState(3)

  const phaseRef = useRef(phase)
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  // Countdown 3-2-1-GO
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdownValue < 0) {
      // Start game
      const shuffled = [...questions].sort(() => Math.random() - 0.5)
      setQueue(shuffled.slice(1))
      setCurrentQ(shuffled[0] ?? null)
      setTick(1)
      setSecondsLeft(minutes * 60)
      setCoins(0)
      setCorrectCount(0)
      setWrongCount(0)
      setPhase('playing')
      return
    }
    sfxCountdown(countdownValue)
    const t = setTimeout(() => setCountdownValue((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdownValue, questions, minutes])

  // Timed mode: round timer
  useEffect(() => {
    if (phase !== 'playing' || mode !== 'timed') return
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        const next = s - 1
        if (next <= 0) {
          setPhase('gameOver')
          return 0
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase, mode])

  // Score mode: check if reached
  useEffect(() => {
    if (phase !== 'playing' || mode !== 'score') return
    if (coins >= scoreTarget) setPhase('gameOver')
  }, [phase, mode, coins, scoreTarget])

  // Game over confetti
  useEffect(() => {
    if (phase !== 'gameOver') return
    if (mode === 'score' && coins >= scoreTarget) {
      confetti({
        particleCount: 180,
        spread: 90,
        startVelocity: 50,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#22c55e', '#4ade80'],
      })
    } else if (mode === 'timed' && coins >= 25) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#4ade80'],
      })
    }
  }, [phase, coins, scoreTarget, mode])

  function start() {
    if (questions.length < 4) return
    setPhase('countdown')
    setCountdownValue(3)
  }

  function handleAnswer(choice: number) {
    if (!currentQ) return
    const correct = choice === currentQ.answer
    if (correct) {
      setCoins((c) => c + COINS_PER_CORRECT)
      setCorrectCount((c) => c + 1)
    } else {
      setWrongCount((c) => c + 1)
      if (hardMode) setCoins((c) => Math.max(0, c - 1))
    }
    // Advance to next question
    let nextQueue = queue
    if (nextQueue.length === 0) {
      nextQueue = [...questions].sort(() => Math.random() - 0.5)
    }
    const [next, ...rest] = nextQueue
    setQueue(rest)
    setCurrentQ(next ?? null)
    setTick((t) => t + 1)
  }

  // ---------- Render ----------

  if (phase === 'setup') {
    return (
      <SetupScreen
        mode={mode}
        setMode={setMode}
        minutes={minutes}
        setMinutes={setMinutes}
        scoreTarget={scoreTarget}
        setScoreTarget={setScoreTarget}
        source={source}
        setSource={setSource}
        hardMode={hardMode}
        setHardMode={setHardMode}
        onChooseAi={() => setPhase('aiChat')}
        onChooseWrite={() => setPhase('questionEditor')}
        onBack={onExit}
      />
    )
  }

  if (phase === 'aiChat') {
    return (
      <div className="max-w-[440px] mx-auto w-full space-y-4 pb-5">
        <div className="flex">
          <button onClick={() => setPhase('setup')} className="fg-back">
            ← Back
          </button>
        </div>
        <div className="text-center">
          <h1
            className="fg-display"
            style={{ fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', padding: '0 8px' }}
          >
            AI Question Writer
          </h1>
        </div>
        <div className="fg-panel p-4">
          <AiChat
            onDone={(t, qs) => {
              setTopic(t)
              setQuestions(qs)
              setPhase('questionEditor')
            }}
          />
        </div>
      </div>
    )
  }

  if (phase === 'questionEditor') {
    return (
      <CustomQuestions
        initial={questions.length > 0 ? questions : undefined}
        title={topic ? `AI: ${topic}` : 'Your Questions'}
        subtitle={
          topic
            ? 'AI made these. Edit anything before you start.'
            : 'Write trivia for yourself. Minimum 4.'
        }
        onBack={() => {
          if (topic) setPhase('aiChat')
          else setPhase('setup')
        }}
        onSubmit={(qs) => {
          setQuestions(qs)
          start()
        }}
      />
    )
  }

  if (phase === 'countdown') {
    return <Countdown value={countdownValue} />
  }

  if (phase === 'playing') {
    return (
      <PlayingScreen
        currentQ={currentQ}
        tick={tick}
        coins={coins}
        secondsLeft={secondsLeft}
        scoreTarget={scoreTarget}
        mode={mode}
        onAnswer={handleAnswer}
        onQuit={() => setPhase('gameOver')}
      />
    )
  }

  // gameOver
  const youWon = mode === 'score' && coins >= scoreTarget
  return (
    <GameOverScreen
      mode={mode}
      coins={coins}
      correctCount={correctCount}
      wrongCount={wrongCount}
      scoreTarget={scoreTarget}
      timeUp={mode === 'timed'}
      youWon={youWon}
      onPlayAgain={() => {
        setPhase('setup')
      }}
      onExit={onExit}
    />
  )
}

// ---------- Setup screen ----------

function SetupScreen({
  mode,
  setMode,
  minutes,
  setMinutes,
  scoreTarget,
  setScoreTarget,
  source,
  setSource,
  hardMode,
  setHardMode,
  onChooseAi,
  onChooseWrite,
  onBack,
}: {
  mode: Mode
  setMode: (m: Mode) => void
  minutes: number
  setMinutes: (n: number) => void
  scoreTarget: number
  setScoreTarget: (n: number) => void
  source: 'write' | 'ai'
  setSource: (s: 'write' | 'ai') => void
  hardMode: boolean
  setHardMode: (h: boolean) => void
  onChooseAi: () => void
  onChooseWrite: () => void
  onBack: () => void
}) {
  function go() {
    if (source === 'ai') onChooseAi()
    else onChooseWrite()
  }

  return (
    <div className="max-w-[440px] mx-auto w-full space-y-5 pb-5">
      <div className="flex">
        <button onClick={onBack} className="fg-back">
          ← Back
        </button>
      </div>

      <div className="text-center">
        <h1
          className="fg-display"
          style={{ fontSize: 'clamp(2rem, 7vw, 3rem)', padding: '0 8px' }}
        >
          Study Mode
        </h1>
        <p className="fg-sub text-xs mt-1">
          Practice alone. Earn coins by answering correctly.
        </p>
      </div>

      <div className="fg-panel p-5 space-y-4">
        <div>
          <div className="fg-lbl mb-2 text-center">how do you finish</div>
          <div className="grid grid-cols-2 gap-2">
            <ModeChip
              active={mode === 'timed'}
              onClick={() => setMode('timed')}
              label="Time limit"
              detail="play until the clock runs out"
            />
            <ModeChip
              active={mode === 'score'}
              onClick={() => setMode('score')}
              label="Score limit"
              detail="play until you hit a coin target"
            />
          </div>
        </div>

        {mode === 'timed' && (
          <NumStepper
            label="game length (minutes)"
            value={minutes}
            min={2}
            step={1}
            onChange={setMinutes}
          />
        )}
        {mode === 'score' && (
          <NumStepper
            label="coin target"
            value={scoreTarget}
            min={1}
            step={1}
            onChange={setScoreTarget}
          />
        )}

        <button
          onClick={() => setHardMode(!hardMode)}
          className="w-full rounded-2xl p-3 text-left flex items-center gap-3"
          style={{
            background: hardMode
              ? 'rgba(251,113,133,0.10)'
              : 'rgba(255,255,255,0.04)',
            border: hardMode
              ? '2px solid rgba(251,113,133,0.45)'
              : '2px solid rgba(74,222,128,0.18)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: '#fff',
            transition: 'all 0.15s',
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              flexShrink: 0,
              background: hardMode ? '#fb7185' : 'transparent',
              border: hardMode
                ? '2px solid #fb7185'
                : '2px solid rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#450a0a',
              fontWeight: 900,
              fontSize: '0.95rem',
            }}
          >
            {hardMode ? '✓' : ''}
          </div>
          <div>
            <div className="font-extrabold text-sm">
              Hard mode — lose 1 coin per wrong answer
            </div>
            <div className="fg-sub text-[11px] mt-0.5">
              Coins still can't go below 0.
            </div>
          </div>
        </button>
      </div>

      <div className="fg-panel p-5">
        <div className="fg-lbl mb-3 text-center">pick how to make questions</div>
        <div className="grid grid-cols-2 gap-2">
          <ModeChip
            active={source === 'write'}
            onClick={() => setSource('write')}
            label="Write your own"
            detail="type in trivia for yourself"
          />
          <ModeChip
            active={source === 'ai'}
            onClick={() => setSource('ai')}
            label="Ask AI"
            detail="pick a topic, AI writes them"
          />
        </div>
      </div>

      <button onClick={go} className="fg-btn fg-btn-grad">
        Continue →
      </button>
    </div>
  )
}

function ModeChip({
  active,
  onClick,
  label,
  detail,
}: {
  active: boolean
  onClick: () => void
  label: string
  detail: string
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl p-3 text-left"
      style={{
        cursor: 'pointer',
        background: active
          ? 'linear-gradient(135deg,#4ade80,#a3e635)'
          : 'rgba(255,255,255,0.05)',
        color: active ? '#052e16' : '#d1d5db',
        border: active
          ? '2px solid #86efac'
          : '2px solid rgba(74,222,128,0.18)',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
    >
      <div className="font-extrabold text-sm">{label}</div>
      <div className="text-[10px] mt-0.5 font-semibold opacity-80">{detail}</div>
    </button>
  )
}

function NumStepper({
  label,
  value,
  min,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  step: number
  onChange: (n: number) => void
}) {
  return (
    <div>
      <div className="fg-lbl mb-2 text-center">{label}</div>
      <div
        className="flex items-stretch rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '2px solid rgba(74,222,128,0.35)',
        }}
      >
        <button
          aria-label="decrease"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          style={{
            width: 56,
            fontSize: '1.6rem',
            fontWeight: 900,
            background:
              value <= min ? 'rgba(255,255,255,0.02)' : 'rgba(74,222,128,0.18)',
            color: value <= min ? 'rgba(255,255,255,0.2)' : '#4ade80',
            border: 'none',
            cursor: value <= min ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          −
        </button>
        <div
          className="flex-1 text-center tabular-nums"
          style={{
            padding: '12px 0',
            color: '#fff',
            fontSize: '1.4rem',
            fontWeight: 900,
          }}
        >
          {value}
        </div>
        <button
          aria-label="increase"
          onClick={() => onChange(value + step)}
          style={{
            width: 56,
            fontSize: '1.6rem',
            fontWeight: 900,
            background: 'rgba(74,222,128,0.18)',
            color: '#4ade80',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

// ---------- Playing screen ----------

function PlayingScreen({
  currentQ,
  tick,
  coins,
  secondsLeft,
  scoreTarget,
  mode,
  onAnswer,
  onQuit,
}: {
  currentQ: Question | null
  tick: number
  coins: number
  secondsLeft: number
  scoreTarget: number
  mode: Mode
  onAnswer: (i: number) => void
  onQuit: () => void
}) {
  const timeLabel = useMemo(
    () =>
      `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`,
    [secondsLeft],
  )

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4 pb-5">
      <div className="grid grid-cols-3 gap-3">
        <div
          className="rounded-2xl p-3 text-center"
          style={{
            background: 'rgba(251,191,36,0.06)',
            border: '1.5px solid rgba(251,191,36,0.3)',
          }}
        >
          <div className="fg-lbl">coins</div>
          <div
            className="font-extrabold tabular-nums"
            style={{ color: '#fbbf24', fontSize: '1.6rem', lineHeight: 1.1 }}
          >
            {coins}
          </div>
        </div>

        {mode === 'timed' ? (
          <div
            className="rounded-2xl p-3 text-center"
            style={{
              background: secondsLeft <= 10 ? 'rgba(251,113,133,0.10)' : 'rgba(74,222,128,0.06)',
              border:
                secondsLeft <= 10
                  ? '1.5px solid rgba(251,113,133,0.45)'
                  : '1.5px solid rgba(74,222,128,0.3)',
            }}
          >
            <div className="fg-lbl">time</div>
            <div
              className="font-extrabold tabular-nums"
              style={{
                color: secondsLeft <= 10 ? '#fda4af' : '#4ade80',
                fontSize: '1.6rem',
                lineHeight: 1.1,
              }}
            >
              {timeLabel}
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-3 text-center"
            style={{
              background: 'rgba(74,222,128,0.06)',
              border: '1.5px solid rgba(74,222,128,0.3)',
            }}
          >
            <div className="fg-lbl">goal</div>
            <div
              className="font-extrabold tabular-nums"
              style={{ color: '#4ade80', fontSize: '1.6rem', lineHeight: 1.1 }}
            >
              {coins} / {scoreTarget}
            </div>
          </div>
        )}

        <button
          onClick={onQuit}
          className="rounded-2xl text-center"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1.5px solid rgba(255,255,255,0.15)',
            color: '#d1d5db',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          End early
        </button>
      </div>

      <div className="fg-gcard relative">
        <div className="fg-codebg" />
        <div className="relative z-[1]">
          <QuestionCard question={currentQ} tick={tick} onAnswer={onAnswer} />
        </div>
      </div>
    </div>
  )
}

// ---------- Game Over ----------

function GameOverScreen({
  mode,
  coins,
  correctCount,
  wrongCount,
  scoreTarget,
  timeUp,
  youWon,
  onPlayAgain,
  onExit,
}: {
  mode: Mode
  coins: number
  correctCount: number
  wrongCount: number
  scoreTarget: number
  timeUp: boolean
  youWon: boolean
  onPlayAgain: () => void
  onExit: () => void
}) {
  const headline =
    mode === 'score'
      ? youWon
        ? 'You hit your goal!'
        : 'Stopped early'
      : timeUp
        ? "Time's up!"
        : 'Stopped early'
  const total = correctCount + wrongCount
  const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto fg-panel fg-panel-lg text-center"
      >
        <div className="fg-lbl mb-2" style={{ color: '#fbbf24' }}>
          study session done
        </div>
        <h2 className="fg-display text-4xl mb-4">{headline}</h2>

        <div
          className="rounded-2xl p-4 mb-5"
          style={{
            background: 'rgba(251,191,36,0.06)',
            border: '1.5px solid rgba(251,191,36,0.3)',
          }}
        >
          <div className="fg-lbl">coins earned</div>
          <div
            className="font-extrabold tabular-nums"
            style={{ color: '#fbbf24', fontSize: '3rem', lineHeight: 1.1 }}
          >
            {coins}
            {mode === 'score' && (
              <span className="fg-sub text-base ml-2">/ {scoreTarget}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          <Stat label="correct" value={correctCount} color="#86efac" />
          <Stat label="wrong" value={wrongCount} color="#fda4af" />
          <Stat label="accuracy" value={`${pct}%`} color="#5eead4" />
        </div>

        <div className="flex gap-2">
          <button onClick={onPlayAgain} className="fg-btn fg-btn-grad flex-1">
            Play again
          </button>
          <button
            onClick={onExit}
            className="fg-btn flex-1"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1.5px solid rgba(255,255,255,0.18)',
              color: '#d1d5db',
            }}
          >
            Home
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function Stat({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}) {
  return (
    <div
      className="rounded-2xl p-3 text-center"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(74,222,128,0.12)',
      }}
    >
      <div className="fg-lbl text-[10px]">{label}</div>
      <div
        className="font-extrabold tabular-nums"
        style={{ color, fontSize: '1.4rem', lineHeight: 1.1 }}
      >
        {value}
      </div>
    </div>
  )
}
