import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { usePartyGame } from '../games/cracked-heist/usePartyGame'
import AmbientBg from '../games/cracked-heist/components/AmbientBg'
import LoadingSplash from '../games/cracked-heist/components/LoadingSplash'
import StartScreen from '../games/cracked-heist/components/StartScreen'
import JoinPrompt from '../games/cracked-heist/components/JoinPrompt'
import AvatarPicker from '../games/cracked-heist/components/AvatarPicker'
import HostLobby from '../games/cracked-heist/components/HostLobby'
import CategoryPick from '../games/cracked-heist/components/CategoryPick'
import CustomQuestions from '../games/cracked-heist/components/CustomQuestions'
import SharedView from '../games/cracked-heist/components/SharedView'
import PregameSplash from '../games/cracked-heist/components/PregameSplash'
import PasswordPickPhase from '../games/cracked-heist/components/PasswordPickPhase'
import Countdown from '../games/cracked-heist/components/Countdown'
import WaitingForHost from '../games/cracked-heist/components/WaitingForHost'
import HUD from '../games/cracked-heist/components/HUD'
import QuestionCard from '../games/cracked-heist/components/QuestionCard'
import ActionPanel from '../games/cracked-heist/components/ActionPanel'
import PlayerList from '../games/cracked-heist/components/PlayerList'
import EventFeed from '../games/cracked-heist/components/EventFeed'
import Modal from '../games/cracked-heist/components/Modal'
import HackComputers from '../games/cracked-heist/components/HackComputers'
import PhishingGame from '../games/cracked-heist/components/PhishingGame'
import RiskGame from '../games/cracked-heist/components/RiskGame'
import PasswordReveal from '../games/cracked-heist/components/PasswordReveal'
import GameOver from '../games/cracked-heist/components/GameOver'
import StudyMode from '../games/cracked-heist/components/StudyMode'
import { initAudio, startMusic } from '../games/cracked-heist/audio'
import { defaultAvatar } from '../games/cracked-heist/avatar'
import { getShared } from '../games/cracked-heist/shareStore'
import { generateRoomCode, pickN } from '../games/cracked-heist/utils'
import type { Avatar, Player, Question, SharedGame } from '../games/cracked-heist/types'
import { RISK_COST } from '../games/cracked-heist/types'
import '../games/cracked-heist/forbidden-green.css'

type LocalPhase =
  | 'loading'
  | 'start'
  | 'joinPrompt'
  | 'pickAvatar'
  | 'connecting'
  | 'connected'
  | 'viewShared'
  | 'studyMode'

// Pull in saved mute state at module load
initAudio()

type ActionFlow =
  | { kind: 'none' }
  | { kind: 'spyPick'; targets: Player[]; truthId: string }
  | { kind: 'spyResult'; correct: boolean }
  | { kind: 'hackPicker'; targets: Player[] }
  | { kind: 'phishing' }
  | { kind: 'risk' }
  | { kind: 'viewOptions' }

type EntryRole = 'host' | 'player' | null

export default function CrackedHeist() {
  const [localPhase, setLocalPhase] = useState<LocalPhase>('loading')
  const [role, setRole] = useState<EntryRole>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [pendingCode, setPendingCode] = useState<string>('')
  const [pendingHandle, setPendingHandle] = useState<string>('')
  const [flow, setFlow] = useState<ActionFlow>({ kind: 'none' })
  const [sharedView, setSharedView] = useState<{ code: string; game: SharedGame | null } | null>(null)
  const [editorSeed, setEditorSeed] = useState<{ topic: string; questions: Question[] } | null>(null)
  const [wasKicked, setWasKicked] = useState(false)
  const sawSelfInRoomRef = useRef(false)

  const { state, meId, connected, error, connect, disconnect, dispatch } = usePartyGame()

  const me = state?.players.find((p) => p.id === meId)
  const isHost = !!me?.isHost
  const others = useMemo(
    () => (state?.players ?? []).filter((p) => p.id !== meId && p.alive),
    [state?.players, meId],
  )

  // Start background music on the first user gesture (browsers require it).
  // We always start music — if the user is muted, the master gain is 0 so
  // it's silent. That way unmuting later just opens the gain and you hear it.
  useEffect(() => {
    let started = false
    const handler = () => {
      if (started) return
      started = true
      startMusic()
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('keydown', handler)
    }
    window.addEventListener('pointerdown', handler)
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [])

  function startHostFlow() {
    setRole('host')
    setPendingCode(generateRoomCode())
    setLocalPhase('pickAvatar')
  }

  function startJoinFlow() {
    setRole('player')
    setLocalPhase('joinPrompt')
  }

  function backToStart() {
    setRole(null)
    setPendingCode('')
    setPendingHandle('')
    disconnect()
    setLocalPhase('start')
  }

  function onAvatarConfirmed(handle: string, avatar: Avatar) {
    setPendingHandle(handle)
    setLocalPhase('connecting')
    connect({
      code: pendingCode,
      handle,
      avatar,
      isHost: role === 'host',
    })
    setLocalPhase('connected')
  }

  function openSpy() {
    if (!state) return
    if (others.length === 0) return
    const recently = others.filter((p) => p.hackedRecently)
    const truth = recently.length > 0
      ? recently[Math.floor(Math.random() * recently.length)]
      : others[Math.floor(Math.random() * others.length)]
    const decoyPool = others.filter((p) => p.id !== truth.id)
    const decoys = pickN(decoyPool, Math.min(2, decoyPool.length))
    const targets = [...decoys, truth].sort(() => Math.random() - 0.5)
    setFlow({ kind: 'spyPick', targets, truthId: truth.id })
  }

  function openHack() {
    if (others.length < 3) {
      setFlow({ kind: 'hackPicker', targets: others })
      return
    }
    const targets = pickN(others, 3)
    setFlow({ kind: 'hackPicker', targets })
  }

  function chooseAction(kind: 'spy' | 'hack' | 'password' | 'risk') {
    if (kind === 'hack') return openHack()
    if (kind === 'spy') return openSpy()
    if (kind === 'password') return setFlow({ kind: 'phishing' })
    if (kind === 'risk') setFlow({ kind: 'risk' })
  }

  function viewShared(code: string) {
    setSharedView({ code, game: getShared(code) })
    setLocalPhase('viewShared')
  }

  // Detect being kicked: I was a player, then suddenly I'm not in the room.
  useEffect(() => {
    if (!connected || !state || !meId) return
    const inRoom = state.players.some((p) => p.id === meId)
    if (inRoom) {
      sawSelfInRoomRef.current = true
      return
    }
    if (sawSelfInRoomRef.current && !inRoom && state.phase !== 'gameOver') {
      setWasKicked(true)
    }
  }, [connected, state, meId])

  function dismissKicked() {
    setWasKicked(false)
    sawSelfInRoomRef.current = false
    backToStart()
  }

  // If the URL has ?share=..., jump straight to the leaderboard view on load
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const share = params.get('share')
    if (share && share.length >= 6) {
      viewShared(share)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const close = () => setFlow({ kind: 'none' })

  // --- Render guards for pre-connection states ---

  // Kicked — full-screen takeover. Comes before any other guards so it
  // shows up even though `me` is no longer in state.players.
  if (wasKicked) {
    return (
      <div className="fg-root min-h-screen relative">
        <AmbientBg onHelp={() => setHelpOpen(true)} />
        <div className="relative z-10 max-w-md mx-auto p-6 mt-24 text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            className="fg-panel fg-panel-lg"
            style={{
              border: '2px solid rgba(251,113,133,0.45)',
              background: 'rgba(251,113,133,0.06)',
            }}
          >
            <div
              className="fg-lbl mb-2"
              style={{ color: '#fda4af' }}
            >
              removed from room
            </div>
            <h2 className="fg-display text-3xl mb-3" style={{ color: '#fda4af' }}>
              You've been kicked
            </h2>
            <p className="fg-sub text-sm mb-5">
              The host removed you from this room. You can host your own game or
              join a different room with a new code.
            </p>
            <button onClick={dismissKicked} className="fg-btn fg-btn-grad w-full">
              Back to start
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  if (localPhase === 'loading') {
    return (
      <div className="fg-root min-h-screen relative">
        <AmbientBg onHelp={() => setHelpOpen(true)} />
        <div className="relative z-10 px-4 py-5">
          <LoadingSplash onDone={() => setLocalPhase('start')} />
        </div>
      </div>
    )
  }

  if (localPhase === 'start') {
    return (
      <div className="fg-root min-h-screen relative">
        <AmbientBg onHelp={() => setHelpOpen(true)} />
        <div className="relative z-10 px-4 py-5">
          <StartScreen
            onHost={startHostFlow}
            onJoin={startJoinFlow}
            onStudy={() => setLocalPhase('studyMode')}
            onViewShared={viewShared}
          />
        </div>
      </div>
    )
  }

  if (localPhase === 'joinPrompt') {
    return (
      <div className="fg-root min-h-screen relative">
        <AmbientBg onHelp={() => setHelpOpen(true)} />
        <div className="relative z-10 px-4 py-5">
          <JoinPrompt
            onJoin={(code) => {
              setPendingCode(code)
              setLocalPhase('pickAvatar')
            }}
            onBack={backToStart}
          />
        </div>
      </div>
    )
  }

  if (localPhase === 'pickAvatar') {
    return (
      <div className="fg-root min-h-screen relative">
        <AmbientBg onHelp={() => setHelpOpen(true)} />
        <div className="relative z-10 px-4 py-5">
          <AvatarPicker
            initialAvatar={defaultAvatar()}
            onBack={backToStart}
            onConfirm={onAvatarConfirmed}
          />
        </div>
      </div>
    )
  }

  if (localPhase === 'studyMode') {
    return (
      <div className="fg-root min-h-screen relative">
        <AmbientBg onHelp={() => setHelpOpen(true)} />
        <div className="relative z-10 px-4 py-5">
          <StudyMode onExit={() => setLocalPhase('start')} />
        </div>
      </div>
    )
  }

  if (localPhase === 'viewShared' && sharedView) {
    return (
      <div className="fg-root min-h-screen relative">
        <AmbientBg onHelp={() => setHelpOpen(true)} />
        <div className="relative z-10 px-4 py-5">
          <SharedView
            game={sharedView.game}
            code={sharedView.code}
            onBack={() => {
              setSharedView(null)
              setLocalPhase('start')
            }}
          />
        </div>
      </div>
    )
  }

  // localPhase is 'connecting' or 'connected'
  if (!state || !connected || !me) {
    return (
      <div className="fg-root min-h-screen relative">
        <AmbientBg onHelp={() => setHelpOpen(true)} />
        <div className="relative z-10 max-w-md mx-auto p-6 mt-16 text-center">
          <div className="fg-panel fg-panel-lg">
            <h2 className="fg-display text-2xl mb-2">
              {error
                ? error.toLowerCase().includes('name')
                  ? 'Name taken'
                  : 'Connection problem'
                : 'Connecting…'}
            </h2>
            <p className="fg-sub text-sm">
              {error ?? `Room ${pendingCode}. Joining as ${pendingHandle || 'player'}.`}
            </p>
            <button onClick={backToStart} className="fg-back mt-5 w-full justify-center">
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Connected — render the live game using server state
  return (
    <div className="fg-root min-h-screen relative">
      <AmbientBg onHelp={() => setHelpOpen(true)} />

      <div className="relative z-10 px-4 py-5 md:py-7">
        {state.phase === 'hostLobby' && (
          <HostLobby
            state={state}
            isHost={isHost}
            onKick={(id) => dispatch({ type: 'kickPlayer', id })}
            onAddBots={() => dispatch({ type: 'addBots', count: 3 })}
            onStart={() => dispatch({ type: 'setPhase', phase: 'pickCategory' })}
          />
        )}

        {state.phase === 'pickCategory' &&
          (isHost ? (
            <CategoryPick
              settings={state.settings}
              onChange={(patch) => dispatch({ type: 'setSettings', patch })}
              onBack={() => dispatch({ type: 'setPhase', phase: 'hostLobby' })}
              onCustom={() => {
                setEditorSeed(null)
                dispatch({ type: 'setPhase', phase: 'customQuestions' })
              }}
              onAiGenerated={(topic, qs) => {
                setEditorSeed({ topic, questions: qs })
                dispatch({ type: 'setPhase', phase: 'customQuestions' })
              }}
            />
          ) : (
            <WaitingForHost
              state={state}
              detail="The host is picking the topic and game length."
            />
          ))}

        {state.phase === 'customQuestions' &&
          (isHost ? (
            <CustomQuestions
              initial={editorSeed?.questions}
              title={editorSeed ? `AI: ${editorSeed.topic}` : 'Custom Questions'}
              subtitle={
                editorSeed
                  ? 'AI made these. Edit anything you want, then start the game.'
                  : 'Minimum 4. No maximum. Tap the correct choice to mark it.'
              }
              onBack={() => {
                setEditorSeed(null)
                dispatch({ type: 'setPhase', phase: 'pickCategory' })
              }}
              onSubmit={(qs) => {
                dispatch({
                  type: 'pickCustomQuestions',
                  questions: qs,
                  label: editorSeed?.topic,
                })
                setEditorSeed(null)
                dispatch({ type: 'setPhase', phase: 'pregame' })
              }}
            />
          ) : (
            <WaitingForHost
              state={state}
              detail="The host is writing the trivia questions."
            />
          ))}

        {state.phase === 'pregame' &&
          (isHost ? (
            <PregameSplash
              state={state}
              onPlay={() => dispatch({ type: 'setPhase', phase: 'pickPassword' })}
            />
          ) : (
            <WaitingForHost
              state={state}
              detail="Almost ready — the host is about to start."
            />
          ))}

        {state.phase === 'pickPassword' && me && (
          <PasswordPickPhase
            options={me.passwordOptions ?? []}
            onLock={(pw) => {
              dispatch({ type: 'lockPassword', playerId: me.id, password: pw })
              // Only the host can trigger countdown — everyone else just waits.
              if (isHost) {
                dispatch({ type: 'beginCountdown' })
              }
            }}
          />
        )}

        {state.phase === 'countdown' && <Countdown value={state.countdownValue} />}

        {state.phase === 'playing' && me && (
          <div className="max-w-5xl mx-auto space-y-4">
            <HUD state={state} me={me} onViewOptions={() => setFlow({ kind: 'viewOptions' })} />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
              <div className="space-y-4">
                <div className="fg-gcard relative">
                  <div className="fg-codebg" />
                  <div className="relative z-[1]">
                    <QuestionCard
                      question={me.currentQuestion}
                      tick={me.questionTick}
                      onAnswer={(choice) => {
                        dispatch({ type: 'answerQuestion', playerId: me.id, choice })
                        // QuestionCard already waited (fast on correct, 3s on wrong)
                        dispatch({ type: 'nextQuestion', playerId: me.id })
                      }}
                    />
                  </div>
                </div>
                <div className="fg-panel p-5">
                  <div className="fg-lbl mb-3">live feed</div>
                  <EventFeed events={state.events} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="fg-panel p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="fg-lbl">your password</div>
                    <PasswordReveal password={me.password} />
                  </div>
                  <div className="fg-lbl mb-3">actions</div>
                  <ActionPanel state={state} me={me} onChoose={chooseAction} />
                </div>
                <div className="fg-panel p-5">
                  <div className="fg-lbl mb-3">hackers</div>
                  <PlayerList state={state} />
                </div>
              </div>
            </div>
          </div>
        )}

        {state.phase === 'gameOver' && (
          <GameOver
            state={state}
            meId={meId}
            onReset={() => {
              if (isHost) dispatch({ type: 'reset' })
              backToStart()
            }}
          />
        )}
      </div>

      {/* Modals */}
      <Modal
        open={flow.kind === 'spyPick' || flow.kind === 'spyResult'}
        onClose={close}
        title="Spy — find the hacker"
      >
        {flow.kind === 'spyPick' && (
          <>
            <p className="fg-sub text-sm mb-3">
              One of these three has been hacking. Pick who you think it is.
            </p>
            <div className="space-y-2">
              {flow.targets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    const correct = p.id === flow.truthId
                    dispatch({
                      type: 'doSpy',
                      spyId: me.id,
                      targetId: correct ? flow.truthId : p.id,
                      correct,
                    })
                    setFlow({ kind: 'spyResult', correct })
                  }}
                  className="w-full text-left p-3 rounded-2xl border font-bold transition-all flex items-center gap-3"
                  style={{
                    borderColor: 'rgba(94,234,212,0.3)',
                    background: 'rgba(94,234,212,0.05)',
                    color: '#99f6e4',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold flex-shrink-0"
                    style={{ background: p.avatar.color, color: '#0a0a0a' }}
                  >
                    {p.handle.charAt(0).toUpperCase()}
                  </div>
                  <span>{p.handle}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {flow.kind === 'spyResult' && (
          <div
            className="rounded-2xl p-5 text-center font-extrabold"
            style={{
              background: flow.correct
                ? 'rgba(74,222,128,0.15)'
                : 'rgba(251,113,133,0.15)',
              border: flow.correct
                ? '2px solid rgba(74,222,128,0.5)'
                : '2px solid rgba(251,113,133,0.5)',
              color: flow.correct ? '#86efac' : '#fda4af',
              fontSize: '1.2rem',
            }}
          >
            {flow.correct ? 'RIGHT — you caught them!' : 'WRONG — they got away.'}
            <button
              onClick={close}
              className="fg-back mt-4 w-full justify-center"
              style={{ fontSize: '0.9rem' }}
            >
              Close
            </button>
          </div>
        )}
      </Modal>

      <Modal open={flow.kind === 'hackPicker'} onClose={close} title="Hack — three computers">
        {flow.kind === 'hackPicker' && (
          <HackComputers
            hackCost={state.settings.costs.hack}
            tokens={me.tokens}
            targets={flow.targets}
            onClose={close}
            onResult={(targetId, correct) => {
              dispatch({
                type: 'doHack',
                playerId: me.id,
                targetId,
                correctPassword: correct,
              })
              close()
            }}
          />
        )}
      </Modal>

      <Modal open={flow.kind === 'phishing'} onClose={close} title="Phishing — pick a victim">
        <PhishingGame
          cost={state.settings.costs.password}
          tokens={me.tokens}
          targets={others}
          onClose={close}
          onResult={(targetId, correct) => {
            dispatch({
              type: 'doPassword',
              guesserId: me.id,
              targetId,
              correctPassword: correct,
            })
            close()
          }}
        />
      </Modal>

      <Modal open={flow.kind === 'risk'} onClose={close} title="Risk It — spin for coins">
        {flow.kind === 'risk' && (
          <RiskGame
            coins={me.coins}
            onClose={close}
            onResult={(outcome) => {
              dispatch({ type: 'doRisk', playerId: me.id, outcome })
            }}
          />
        )}
      </Modal>

      <Modal open={flow.kind === 'viewOptions'} onClose={close} title="Your game options">
        <div className="space-y-3">
          <OptionInfo
            color="#fbbf24"
            title="Hack Computers"
            cost={`${state.settings.costs.hack} tokens`}
            desc="Three computers, each owned by another player. Each shows three possible passwords. Pick the right tile to crack them and steal coins. Wrong = nothing."
          />
          <OptionInfo
            color="#5eead4"
            title="Spy"
            cost={`${state.settings.costs.spy} tokens`}
            desc={`Three suspects. One has been hacking. Find them to win ${state.settings.rewards.spyCatch} coins.`}
          />
          <OptionInfo
            color="#a3e635"
            title="Send Phishing"
            cost={`${state.settings.costs.password} tokens`}
            desc={`Pick a target and a fake message that fits how they think (greed, authority, or urgency). Right = +${state.settings.rewards.passwordCatch} coins.`}
          />
          <OptionInfo
            color="#c084fc"
            title="Risk It"
            cost={`${RISK_COST} coins`}
            desc="Spin a random outcome: ×2, ×3, ÷2, +5, +10, −5, or −10 coins. Pay the entry fee first; the result applies to what's left."
          />
          <div
            className="rounded-2xl p-3 mt-2"
            style={{
              background: 'rgba(74,222,128,0.06)',
              border: '1px solid rgba(74,222,128,0.2)',
            }}
          >
            <div className="fg-lbl mb-2">your password</div>
            <PasswordReveal password={me?.password ?? ''} size="md" />
            <p className="fg-sub text-[11px] mt-2">
              Tap to reveal. Hides again after a few seconds — don't show
              your screen to anyone.
            </p>
          </div>
        </div>
      </Modal>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="How it works">
        <div className="space-y-3 text-sm">
          <div
            className="rounded-2xl p-3"
            style={{
              background: 'rgba(251,191,36,0.06)',
              border: '1.5px solid rgba(251,191,36,0.3)',
            }}
          >
            <div className="font-extrabold mb-1" style={{ color: '#fbbf24' }}>
              Coins — these decide who wins
            </div>
            <p className="fg-sub text-xs leading-snug">
              Whoever has the most coins when the timer runs out wins the game.
              You start at 0. Earn 5 coins by successfully hacking, phishing,
              or catching a hacker by spying.
            </p>
          </div>

          <div
            className="rounded-2xl p-3"
            style={{
              background: 'rgba(94,234,212,0.06)',
              border: '1.5px solid rgba(94,234,212,0.3)',
            }}
          >
            <div className="font-extrabold mb-1" style={{ color: '#5eead4' }}>
              Tokens — these let you take actions
            </div>
            <p className="fg-sub text-xs leading-snug">
              Tokens pay the entry cost for Hack (15), Spy (10), and Phish (15).
              Earn 2 tokens for every question you answer correctly. Wrong
              answers cost nothing.
            </p>
          </div>

          <div
            className="rounded-2xl p-3"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(74,222,128,0.18)',
            }}
          >
            <div className="font-extrabold mb-1 text-white">Quick recap</div>
            <ul className="fg-sub text-xs leading-snug pl-4 space-y-1" style={{ listStyle: 'disc' }}>
              <li>Answer right → +2 tokens</li>
              <li>Successful Hack / Spy / Phish → +5 coins (cost: tokens)</li>
              <li>Being hacked, phished, or caught → lose up to 5 coins</li>
              <li>Risk It → pay {RISK_COST} coins for a random ×2 / ×3 / ÷2 / ±5 / ±10 swing</li>
              <li>Most coins at the end wins</li>
            </ul>
          </div>
        </div>
      </Modal>

    </div>
  )
}

function OptionInfo({
  color,
  title,
  cost,
  desc,
}: {
  color: string
  title: string
  cost: string
  desc: string
}) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{
        background: `${color}10`,
        border: `1.5px solid ${color}40`,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="font-extrabold text-base" style={{ color }}>
          {title}
        </div>
        <div className="font-extrabold text-xs" style={{ color }}>
          {cost}
        </div>
      </div>
      <p className="fg-sub text-xs leading-snug">{desc}</p>
    </div>
  )
}
