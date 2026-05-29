import { useMemo, useState } from 'react'
import { useGame } from '../games/cracked-heist/gameState'
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
import Countdown from '../games/cracked-heist/components/Countdown'
import HUD from '../games/cracked-heist/components/HUD'
import QuestionCard from '../games/cracked-heist/components/QuestionCard'
import ActionPanel from '../games/cracked-heist/components/ActionPanel'
import PlayerList from '../games/cracked-heist/components/PlayerList'
import EventFeed from '../games/cracked-heist/components/EventFeed'
import Modal from '../games/cracked-heist/components/Modal'
import PasswordPicker from '../games/cracked-heist/components/PasswordPicker'
import ComputerPicker from '../games/cracked-heist/components/ComputerPicker'
import RoundEnd from '../games/cracked-heist/components/RoundEnd'
import GameOver from '../games/cracked-heist/components/GameOver'
import { defaultAvatar } from '../games/cracked-heist/avatar'
import { getShared } from '../games/cracked-heist/shareStore'
import { pickN } from '../games/cracked-heist/utils'
import type { Player, SharedGame } from '../games/cracked-heist/types'
import '../games/cracked-heist/forbidden-green.css'

type ActionFlow =
  | { kind: 'none' }
  | { kind: 'spyPick'; targets: Player[] }
  | { kind: 'hackPicker' }
  | { kind: 'passwordPickTarget' }
  | { kind: 'passwordPickGuess'; targetId: string }
  | { kind: 'viewOptions' }

type EntryRole = 'host' | 'player' | null

export default function CrackedHeist() {
  const { state, dispatch, answer, doHack, doSpy, doPassword } = useGame()
  const [flow, setFlow] = useState<ActionFlow>({ kind: 'none' })
  const [role, setRole] = useState<EntryRole>(null)
  const [sharedView, setSharedView] = useState<{ code: string; game: SharedGame | null } | null>(null)
  const me = state.players.find((p) => p.id === state.meId)
  const isHost = !!me?.isHost
  const others = useMemo(
    () => state.players.filter((p) => p.id !== state.meId && p.alive),
    [state.players, state.meId],
  )

  function pickSpyTargets(): Player[] {
    // pick 3 targets, force at least one to be "recently hacked"
    if (others.length === 0) return []
    const recentlyHacked = others.filter((p) =>
      p.hackedInRounds.some((r) => r >= state.round - 2),
    )
    const clean = others.filter((p) => !recentlyHacked.includes(p))
    let target: Player
    if (recentlyHacked.length > 0) {
      target = recentlyHacked[Math.floor(Math.random() * recentlyHacked.length)]
    } else {
      // force one of the clean ones to "have hacked" by adding a fake event in their record
      target = clean[Math.floor(Math.random() * clean.length)]
      dispatch({
        type: 'event',
        event: {
          id: Date.now(),
          text: `${target.handle} is hiding something...`,
          tone: 'neutral',
          ts: Date.now(),
        },
      })
      // Mark them as hacked so the spy logic rewards correctly
      target.hackedInRounds.push(state.round)
    }
    const decoyPool = others.filter((p) => p.id !== target.id)
    const decoys = pickN(decoyPool, Math.min(2, decoyPool.length))
    const all = [...decoys, target]
    return all.sort(() => Math.random() - 0.5)
  }

  function chooseAction(kind: 'spy' | 'hack' | 'password') {
    if (kind === 'hack') {
      setFlow({ kind: 'hackPicker' })
      return
    }
    if (kind === 'spy') {
      setFlow({ kind: 'spyPick', targets: pickSpyTargets() })
      return
    }
    if (kind === 'password') setFlow({ kind: 'passwordPickTarget' })
  }

  const close = () => setFlow({ kind: 'none' })
  const pwTarget =
    flow.kind === 'passwordPickGuess' ? state.players.find((p) => p.id === flow.targetId) : null

  function viewShared(code: string) {
    setSharedView({ code, game: getShared(code) })
    dispatch({ type: 'setPhase', phase: 'viewShared' })
  }

  return (
    <div className="fg-root min-h-screen relative">
      <AmbientBg />

      <div className="relative z-10 px-4 py-5 md:py-7">
        {state.phase === 'loading' && (
          <LoadingSplash onDone={() => dispatch({ type: 'setPhase', phase: 'start' })} />
        )}

        {state.phase === 'start' && (
          <StartScreen
            onHost={() => {
              setRole('host')
              dispatch({ type: 'setPhase', phase: 'pickAvatar' })
            }}
            onJoin={() => {
              setRole('player')
              dispatch({ type: 'setPhase', phase: 'joinPrompt' })
            }}
            onViewShared={viewShared}
          />
        )}

        {state.phase === 'joinPrompt' && (
          <JoinPrompt
            onJoin={() => dispatch({ type: 'setPhase', phase: 'pickAvatar' })}
            onBack={() => {
              setRole(null)
              dispatch({ type: 'setPhase', phase: 'start' })
            }}
          />
        )}

        {state.phase === 'pickAvatar' && (
          <AvatarPicker
            initialAvatar={defaultAvatar()}
            onBack={() => {
              setRole(null)
              dispatch({ type: 'setPhase', phase: 'start' })
            }}
            onConfirm={(handle, avatar) => {
              if (role === 'host') {
                dispatch({ type: 'createAsHost', handle, avatar })
                dispatch({ type: 'addBotsForDemo', count: 3 })
              } else {
                dispatch({ type: 'joinAsPlayer', handle, avatar })
                dispatch({ type: 'addBotsForDemo', count: 3 })
              }
            }}
          />
        )}

        {state.phase === 'hostLobby' && (
          <HostLobby
            state={state}
            isHost={isHost}
            onKick={(id) => dispatch({ type: 'kickPlayer', id })}
            onStart={() => dispatch({ type: 'setPhase', phase: 'pickCategory' })}
          />
        )}

        {state.phase === 'pickCategory' && (
          <CategoryPick
            settings={state.settings}
            onChange={(patch) => dispatch({ type: 'setSettings', patch })}
            onBack={() => dispatch({ type: 'setPhase', phase: 'hostLobby' })}
            onStart={(cat) => {
              dispatch({ type: 'pickCategory', category: cat })
              dispatch({ type: 'setPhase', phase: 'pregame' })
            }}
            onCustom={() => dispatch({ type: 'setPhase', phase: 'customQuestions' })}
          />
        )}

        {state.phase === 'customQuestions' && (
          <CustomQuestions
            onBack={() => dispatch({ type: 'setPhase', phase: 'pickCategory' })}
            onSubmit={(qs) => {
              dispatch({ type: 'pickCustomQuestions', questions: qs })
              dispatch({ type: 'setPhase', phase: 'pregame' })
            }}
          />
        )}

        {state.phase === 'viewShared' && sharedView && (
          <SharedView
            game={sharedView.game}
            code={sharedView.code}
            onBack={() => {
              setSharedView(null)
              dispatch({ type: 'setPhase', phase: 'start' })
            }}
          />
        )}

        {state.phase === 'pregame' && (
          <PregameSplash state={state} onPlay={() => dispatch({ type: 'beginCountdown' })} />
        )}

        {state.phase === 'countdown' && <Countdown value={state.countdownValue} />}

        {(state.phase === 'playing' || state.phase === 'roundEnd') && me && (
          <div className="max-w-5xl mx-auto space-y-4">
            <HUD state={state} me={me} onViewOptions={() => setFlow({ kind: 'viewOptions' })} />

            {state.phase === 'playing' && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                <div className="space-y-4">
                  <div className="fg-gcard relative">
                    <div className="fg-codebg" />
                    <div className="relative z-[1]">
                      <QuestionCard question={state.currentQuestion} onAnswer={answer} />
                    </div>
                  </div>
                  <div className="fg-panel p-5">
                    <div className="fg-lbl mb-3">live feed</div>
                    <EventFeed events={state.events} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="fg-panel p-5">
                    <div className="fg-lbl mb-3">actions</div>
                    <ActionPanel state={state} me={me} onChoose={chooseAction} />
                  </div>
                  <div className="fg-panel p-5">
                    <div className="fg-lbl mb-3">hackers</div>
                    <PlayerList state={state} />
                  </div>
                </div>
              </div>
            )}

            {state.phase === 'roundEnd' && (
              <RoundEnd state={state} onNext={() => dispatch({ type: 'beginCountdown' })} />
            )}
          </div>
        )}

        {state.phase === 'gameOver' && (
          <GameOver state={state} onReset={() => dispatch({ type: 'reset' })} />
        )}
      </div>

      <Modal
        open={flow.kind === 'spyPick'}
        onClose={close}
        title="Spy — find the hacker"
      >
        <p className="fg-sub text-sm mb-3">
          One of these three has been hacking. Pick who you think it is.
        </p>
        <div className="space-y-2">
          {flow.kind === 'spyPick' &&
            flow.targets.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  doSpy(p.id)
                  close()
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
      </Modal>

      <Modal open={flow.kind === 'hackPicker'} onClose={close} title="Hack — pick a computer">
        {flow.kind === 'hackPicker' && me && (
          <ComputerPicker
            hackCost={state.settings.costs.hack}
            tokens={me.tokens}
            onClose={close}
            onHack={(gained) => {
              doHack(gained)
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
              className="w-full text-left p-3 rounded-2xl border font-bold transition-all"
              style={{
                borderColor: 'rgba(163,230,53,0.3)',
                background: 'rgba(163,230,53,0.05)',
                color: '#d9f99d',
              }}
            >
              → {p.handle}
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
            onGuess={(g) => {
              doPassword(pwTarget.id, g)
              close()
            }}
          />
        )}
      </Modal>

      <Modal open={flow.kind === 'viewOptions'} onClose={close} title="Your game options">
        <div className="space-y-3">
          <OptionInfo
            color="#fbbf24"
            title="Hack Computer"
            cost={`${state.settings.costs.hack} tokens`}
            desc="Three locked computers. Spend tokens to peek, then pick one for 3-20 coins. Tokens come from answering correctly."
          />
          <OptionInfo
            color="#5eead4"
            title="Spy"
            cost={`${state.settings.costs.spy} coins`}
            desc={`Three suspects shown — one of them just hacked. Find them to win ${state.settings.rewards.spyCatch} coins.`}
          />
          <OptionInfo
            color="#a3e635"
            title="Crack Password"
            cost={`${state.settings.costs.password} coins`}
            desc={`Three passwords shown. Pick the right one to win ${state.settings.rewards.passwordCatch} coins.`}
          />
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
