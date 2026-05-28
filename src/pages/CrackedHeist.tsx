import { useState } from 'react'
import { Link } from 'react-router'
import { useGame } from '../games/cracked-heist/gameState'
import AmbientBg from '../games/cracked-heist/components/AmbientBg'
import StartScreen from '../games/cracked-heist/components/StartScreen'
import JoinPrompt from '../games/cracked-heist/components/JoinPrompt'
import AvatarPicker from '../games/cracked-heist/components/AvatarPicker'
import HostLobby from '../games/cracked-heist/components/HostLobby'
import CategoryPick from '../games/cracked-heist/components/CategoryPick'
import Countdown from '../games/cracked-heist/components/Countdown'
import HUD from '../games/cracked-heist/components/HUD'
import QuestionCard from '../games/cracked-heist/components/QuestionCard'
import ActionPanel from '../games/cracked-heist/components/ActionPanel'
import PlayerList from '../games/cracked-heist/components/PlayerList'
import EventFeed from '../games/cracked-heist/components/EventFeed'
import Modal from '../games/cracked-heist/components/Modal'
import PasswordPicker from '../games/cracked-heist/components/PasswordPicker'
import RoundEnd from '../games/cracked-heist/components/RoundEnd'
import GameOver from '../games/cracked-heist/components/GameOver'
import { defaultAvatar } from '../games/cracked-heist/avatar'
import '../games/cracked-heist/forbidden-green.css'

type ActionFlow =
  | { kind: 'none' }
  | { kind: 'spyPick' }
  | { kind: 'passwordPickTarget' }
  | { kind: 'passwordPickGuess'; targetId: string }

type EntryRole = 'host' | 'player' | null

export default function CrackedHeist() {
  const { state, dispatch, answer, doHack, doSpy, doPassword } = useGame()
  const [flow, setFlow] = useState<ActionFlow>({ kind: 'none' })
  const [role, setRole] = useState<EntryRole>(null)
  const me = state.players.find((p) => p.id === state.meId)
  const isHost = !!me?.isHost
  const others = state.players.filter((p) => p.id !== state.meId && p.alive)

  function chooseAction(kind: 'spy' | 'hack' | 'password') {
    if (kind === 'hack') {
      doHack()
      return
    }
    if (kind === 'spy') setFlow({ kind: 'spyPick' })
    if (kind === 'password') setFlow({ kind: 'passwordPickTarget' })
  }

  const close = () => setFlow({ kind: 'none' })
  const pwTarget =
    flow.kind === 'passwordPickGuess' ? state.players.find((p) => p.id === flow.targetId) : null

  return (
    <div className="fg-root min-h-screen relative">
      <AmbientBg />

      <div className="relative z-10 px-4 py-5 md:py-7">
        <div className="max-w-6xl mx-auto flex items-center justify-between mb-5">
          <Link
            to="/"
            className="fg-btn fg-btn-outline fg-btn-sm"
            style={{ width: 'auto', padding: '8px 14px' }}
          >
            ← Hub
          </Link>
          <div className="fg-sub text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            cracked-heist v0.3
          </div>
        </div>

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
          />
        )}

        {state.phase === 'joinPrompt' && (
          <JoinPrompt
            onJoin={() => {
              dispatch({ type: 'setPhase', phase: 'pickAvatar' })
            }}
            onBack={() => {
              setRole(null)
              dispatch({ type: 'setPhase', phase: 'start' })
            }}
          />
        )}

        {state.phase === 'pickAvatar' && (
          <AvatarPicker
            initialAvatar={defaultAvatar()}
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
            onStart={(cat) => {
              dispatch({ type: 'pickCategory', category: cat })
              dispatch({ type: 'beginCountdown' })
            }}
          />
        )}

        {state.phase === 'countdown' && <Countdown value={state.countdownValue} />}

        {(state.phase === 'playing' || state.phase === 'roundEnd') && me && (
          <div className="max-w-6xl mx-auto space-y-4">
            <HUD state={state} me={me} />

            {state.phase === 'playing' && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
                <div className="space-y-4">
                  <div className="fg-gcard min-h-[300px]">
                    <QuestionCard question={state.currentQuestion} onAnswer={answer} />
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

      <Modal open={flow.kind === 'spyPick'} onClose={close} title="Spy — pick target">
        <p className="fg-sub text-sm mb-3">Tail a hacker. Red glow = hacked in last 3 rounds.</p>
        <PlayerList
          state={state}
          highlightHacked
          selectableIds={others.map((p) => p.id)}
          onSelect={(id) => {
            doSpy(id)
            close()
          }}
        />
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
    </div>
  )
}
