import { useState } from 'react'
import { Link } from 'react-router'
import { useGame } from '../games/cracked-heist/gameState'
import MatrixBg from '../games/cracked-heist/components/MatrixBg'
import Lobby from '../games/cracked-heist/components/Lobby'
import WordPick from '../games/cracked-heist/components/WordPick'
import CategoryPick from '../games/cracked-heist/components/CategoryPick'
import HUD from '../games/cracked-heist/components/HUD'
import QuestionCard from '../games/cracked-heist/components/QuestionCard'
import ActionPanel from '../games/cracked-heist/components/ActionPanel'
import PlayerList from '../games/cracked-heist/components/PlayerList'
import EventFeed from '../games/cracked-heist/components/EventFeed'
import Modal from '../games/cracked-heist/components/Modal'
import PasswordPicker from '../games/cracked-heist/components/PasswordPicker'
import RoundEnd from '../games/cracked-heist/components/RoundEnd'
import GameOver from '../games/cracked-heist/components/GameOver'

type ActionFlow =
  | { kind: 'none' }
  | { kind: 'spyPick' }
  | { kind: 'passwordPickTarget' }
  | { kind: 'passwordPickGuess'; targetId: string }

export default function CrackedHeist() {
  const { state, dispatch, answer, doHack, doSpy, doPassword } = useGame()
  const [flow, setFlow] = useState<ActionFlow>({ kind: 'none' })
  const me = state.players.find((p) => p.id === state.meId)!
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
    <div className="min-h-screen text-emerald-100 relative">
      <MatrixBg intensity={state.phase === 'playing' ? 0.55 : 0.85} />

      <div className="relative z-10 px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between mb-6">
          <Link to="/" className="font-mono text-emerald-500 hover:text-emerald-300 text-sm transition-colors">
            &lt; cd ../
          </Link>
          <div className="font-mono text-emerald-700 text-xs">cracked-heist v0.1 // mainline</div>
        </div>

        {state.phase === 'lobby' && (
          <Lobby state={state} onContinue={() => dispatch({ type: 'setPhase', phase: 'pickWord' })} />
        )}

        {state.phase === 'pickWord' && (
          <WordPick
            onPick={(h) => {
              dispatch({ type: 'pickHandle', handle: h })
              dispatch({ type: 'setPhase', phase: 'pickCategory' })
            }}
          />
        )}

        {state.phase === 'pickCategory' && (
          <CategoryPick
            settings={state.settings}
            onChange={(patch) => dispatch({ type: 'setSettings', patch })}
            onStart={(cat) => {
              dispatch({ type: 'pickCategory', category: cat })
              dispatch({ type: 'startRound' })
            }}
          />
        )}

        {(state.phase === 'playing' || state.phase === 'roundEnd') && (
          <div className="max-w-6xl mx-auto space-y-4">
            <HUD state={state} me={me} />

            {state.phase === 'playing' && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                <div className="space-y-4">
                  <div className="bg-black/70 border border-emerald-700 rounded-lg p-5 min-h-[280px]">
                    <QuestionCard question={state.currentQuestion} onAnswer={answer} />
                  </div>
                  <div className="bg-black/70 border border-emerald-700 rounded-lg p-5">
                    <div className="text-emerald-500 font-mono text-xs mb-3">/* live feed */</div>
                    <EventFeed events={state.events} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-black/70 border border-emerald-700 rounded-lg p-4">
                    <div className="text-emerald-500 font-mono text-xs mb-3">/* actions */</div>
                    <ActionPanel state={state} me={me} onChoose={chooseAction} />
                  </div>
                  <div className="bg-black/70 border border-emerald-700 rounded-lg p-4">
                    <div className="text-emerald-500 font-mono text-xs mb-3">/* hackers */</div>
                    <PlayerList state={state} />
                  </div>
                </div>
              </div>
            )}

            {state.phase === 'roundEnd' && (
              <RoundEnd state={state} onNext={() => dispatch({ type: 'startRound' })} />
            )}
          </div>
        )}

        {state.phase === 'gameOver' && (
          <GameOver state={state} onReset={() => dispatch({ type: 'reset' })} />
        )}
      </div>

      <Modal open={flow.kind === 'spyPick'} onClose={close} title="SPY :: pick target">
        <p className="text-emerald-300 text-sm mb-3 font-mono">
          Tail a hacker. Red outline = hacked in last 3 rounds.
        </p>
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

      <Modal open={flow.kind === 'passwordPickTarget'} onClose={close} title="CRACK :: pick target">
        <p className="text-emerald-300 text-sm mb-3 font-mono">Whose wallet do you want to crack?</p>
        <div className="space-y-2">
          {others.map((p) => (
            <button
              key={p.id}
              onClick={() => setFlow({ kind: 'passwordPickGuess', targetId: p.id })}
              className="w-full text-left px-3 py-2 rounded border border-fuchsia-500 bg-black/40 hover:bg-fuchsia-900/30 text-fuchsia-200 font-mono transition-colors"
            >
              &gt; {p.handle}
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={flow.kind === 'passwordPickGuess' && !!pwTarget} onClose={close} title="CRACK :: pick password">
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
