import { useMemo, useState } from 'react'
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
import HUD from '../games/cracked-heist/components/HUD'
import QuestionCard from '../games/cracked-heist/components/QuestionCard'
import ActionPanel from '../games/cracked-heist/components/ActionPanel'
import PlayerList from '../games/cracked-heist/components/PlayerList'
import EventFeed from '../games/cracked-heist/components/EventFeed'
import Modal from '../games/cracked-heist/components/Modal'
import PasswordPicker from '../games/cracked-heist/components/PasswordPicker'
import HackComputers from '../games/cracked-heist/components/HackComputers'
import GameOver from '../games/cracked-heist/components/GameOver'
import { defaultAvatar } from '../games/cracked-heist/avatar'
import { getShared } from '../games/cracked-heist/shareStore'
import { generateRoomCode, pickN } from '../games/cracked-heist/utils'
import type { Avatar, Player, Question, SharedGame } from '../games/cracked-heist/types'
import '../games/cracked-heist/forbidden-green.css'

type LocalPhase =
  | 'loading'
  | 'start'
  | 'joinPrompt'
  | 'pickAvatar'
  | 'connecting'
  | 'connected'
  | 'viewShared'

type ActionFlow =
  | { kind: 'none' }
  | { kind: 'spyPick'; targets: Player[]; truthId: string }
  | { kind: 'spyResult'; correct: boolean }
  | { kind: 'hackPicker'; targets: Player[] }
  | { kind: 'passwordPickTarget' }
  | { kind: 'passwordPickGuess'; targetId: string }
  | { kind: 'viewOptions' }

type EntryRole = 'host' | 'player' | null

export default function CrackedHeist() {
  const [localPhase, setLocalPhase] = useState<LocalPhase>('loading')
  const [role, setRole] = useState<EntryRole>(null)
  const [pendingCode, setPendingCode] = useState<string>('')
  const [pendingHandle, setPendingHandle] = useState<string>('')
  const [flow, setFlow] = useState<ActionFlow>({ kind: 'none' })
  const [sharedView, setSharedView] = useState<{ code: string; game: SharedGame | null } | null>(null)
  const [editorSeed, setEditorSeed] = useState<{ topic: string; questions: Question[] } | null>(null)

  const { state, meId, connected, error, connect, disconnect, dispatch } = usePartyGame()

  const me = state?.players.find((p) => p.id === meId)
  const isHost = !!me?.isHost
  const others = useMemo(
    () => (state?.players ?? []).filter((p) => p.id !== meId && p.alive),
    [state?.players, meId],
  )

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

  function chooseAction(kind: 'spy' | 'hack' | 'password') {
    if (kind === 'hack') return openHack()
    if (kind === 'spy') return openSpy()
    if (kind === 'password') setFlow({ kind: 'passwordPickTarget' })
  }

  function viewShared(code: string) {
    setSharedView({ code, game: getShared(code) })
    setLocalPhase('viewShared')
  }

  const close = () => setFlow({ kind: 'none' })
  const pwTarget = flow.kind === 'passwordPickGuess' ? state?.players.find((p) => p.id === flow.targetId) : null

  // --- Render guards for pre-connection states ---

  if (localPhase === 'loading') {
    return (
      <div className="fg-root min-h-screen relative">
        <AmbientBg />
        <div className="relative z-10 px-4 py-5">
          <LoadingSplash onDone={() => setLocalPhase('start')} />
        </div>
      </div>
    )
  }

  if (localPhase === 'start') {
    return (
      <div className="fg-root min-h-screen relative">
        <AmbientBg />
        <div className="relative z-10 px-4 py-5">
          <StartScreen
            onHost={startHostFlow}
            onJoin={startJoinFlow}
            onViewShared={viewShared}
          />
        </div>
      </div>
    )
  }

  if (localPhase === 'joinPrompt') {
    return (
      <div className="fg-root min-h-screen relative">
        <AmbientBg />
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
        <AmbientBg />
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

  if (localPhase === 'viewShared' && sharedView) {
    return (
      <div className="fg-root min-h-screen relative">
        <AmbientBg />
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
        <AmbientBg />
        <div className="relative z-10 max-w-md mx-auto p-6 mt-16 text-center">
          <div className="fg-panel fg-panel-lg">
            <h2 className="fg-display text-2xl mb-2">
              {error ? 'Connection problem' : 'Connecting…'}
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
      <AmbientBg />

      <div className="relative z-10 px-4 py-5 md:py-7">
        {state.phase === 'hostLobby' && (
          <HostLobby
            state={state}
            isHost={isHost}
            onKick={(id) => dispatch({ type: 'kickPlayer', id })}
            onStart={() => {
              // If solo, fill with bots
              const humanCount = state.players.filter((p) => p.isHuman).length
              if (humanCount < 2) {
                dispatch({ type: 'addBots', count: 3 })
              }
              dispatch({ type: 'setPhase', phase: 'pickCategory' })
            }}
          />
        )}

        {state.phase === 'pickCategory' && (
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
        )}

        {state.phase === 'customQuestions' && (
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
        )}

        {state.phase === 'pregame' && (
          <PregameSplash
            state={state}
            onPlay={() => dispatch({ type: 'setPhase', phase: 'pickPassword' })}
          />
        )}

        {state.phase === 'pickPassword' && me && (
          <PasswordPickPhase
            onLock={(pw) => {
              dispatch({ type: 'lockPassword', playerId: me.id, password: pw })
              // Host kicks off countdown when they're done
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
                      question={state.currentQuestion}
                      tick={state.questionTick}
                      onAnswer={(choice) => {
                        dispatch({ type: 'answerQuestion', playerId: me.id, choice })
                        // Host (or any client) advances to next question; server is authoritative
                        if (isHost) {
                          setTimeout(() => dispatch({ type: 'nextQuestion' }), 700)
                        }
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
                    <div
                      className="font-extrabold text-xs px-2 py-1 rounded-full"
                      style={{
                        background: 'rgba(74,222,128,0.12)',
                        color: '#86efac',
                        fontFamily: 'JetBrains Mono, monospace',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {me.password || '—'}
                    </div>
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

      <Modal open={flow.kind === 'passwordPickTarget'} onClose={close} title="Crack — pick target">
        <p className="fg-sub text-sm mb-3">Whose wallet do you want to crack?</p>
        <div className="space-y-2">
          {others.map((p) => (
            <button
              key={p.id}
              onClick={() => setFlow({ kind: 'passwordPickGuess', targetId: p.id })}
              className="w-full text-left p-3 rounded-2xl border font-bold transition-all flex items-center gap-3"
              style={{
                borderColor: 'rgba(163,230,53,0.3)',
                background: 'rgba(163,230,53,0.05)',
                color: '#d9f99d',
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold flex-shrink-0"
                style={{ background: p.avatar.color, color: '#0a0a0a' }}
              >
                {p.handle.charAt(0).toUpperCase()}
              </div>
              <span>{p.handle}</span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={flow.kind === 'passwordPickGuess' && !!pwTarget}
        onClose={close}
        title="Crack — pick password"
      >
        {pwTarget && (
          <PasswordPicker
            target={pwTarget}
            onResult={(correct) => {
              dispatch({
                type: 'doPassword',
                guesserId: me.id,
                targetId: pwTarget.id,
                correctPassword: correct,
              })
              close()
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
            cost={`${state.settings.costs.spy} coins`}
            desc={`Three suspects. One has been hacking. Find them to win ${state.settings.rewards.spyCatch} coins.`}
          />
          <OptionInfo
            color="#a3e635"
            title="Crack Password"
            cost={`${state.settings.costs.password} coins`}
            desc={`Pick a target and one of three passwords. Right = +${state.settings.rewards.passwordCatch} coins.`}
          />
          <div
            className="rounded-2xl p-3 mt-2"
            style={{
              background: 'rgba(74,222,128,0.06)',
              border: '1px solid rgba(74,222,128,0.2)',
            }}
          >
            <div className="fg-lbl mb-1">your password</div>
            <div
              className="font-extrabold text-base"
              style={{
                color: '#86efac',
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.06em',
              }}
            >
              {me?.password || '—'}
            </div>
            <p className="fg-sub text-[11px] mt-1">
              Don't show this to anyone or they can crack your wallet.
            </p>
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
