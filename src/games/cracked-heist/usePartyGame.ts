import { useCallback, useEffect, useRef, useState } from 'react'
import PartySocket from 'partysocket'
import type { Avatar, RoomState } from './types'
import type { GameAction } from './reducer'

interface WireWelcome {
  type: 'WELCOME'
  meId: string
  state: RoomState
}
interface WireState {
  type: 'STATE'
  state: RoomState
}
interface WireError {
  type: 'ERROR'
  message: string
}
type WireMessage = WireWelcome | WireState | WireError

interface ConnectArgs {
  code: string
  handle: string
  avatar: Avatar
  isHost: boolean
}

const HOST: string =
  (import.meta.env.VITE_PARTYKIT_HOST as string | undefined)?.replace(/^https?:\/\//, '') ??
  ''

export function usePartyGame() {
  const [state, setState] = useState<RoomState | null>(null)
  const [meId, setMeId] = useState<string>('')
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<PartySocket | null>(null)

  const connect = useCallback(({ code, handle, avatar, isHost }: ConnectArgs) => {
    if (!HOST) {
      setError(
        'Multiplayer server URL not configured. Set VITE_PARTYKIT_HOST in Netlify env vars.',
      )
      return
    }
    // Close any existing socket
    socketRef.current?.close()
    setError(null)

    const ws = new PartySocket({
      host: HOST,
      room: code.toUpperCase(),
    })
    socketRef.current = ws

    ws.addEventListener('open', () => {
      setConnected(true)
      // Send JOIN now that we're connected. The server already replied with WELCOME
      // on connection — JOIN tells it who we are.
      ws.send(JSON.stringify({ type: 'JOIN', handle, avatar, isHost }))
    })

    ws.addEventListener('close', () => {
      setConnected(false)
    })

    ws.addEventListener('error', () => {
      setError('Lost connection. Try refreshing.')
    })

    ws.addEventListener('message', (event: MessageEvent<string>) => {
      let msg: WireMessage
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }
      if (msg.type === 'WELCOME') {
        setMeId(msg.meId)
        setState(msg.state)
      } else if (msg.type === 'STATE') {
        setState(msg.state)
      } else if (msg.type === 'ERROR') {
        setError(msg.message)
      }
    })
  }, [])

  const disconnect = useCallback(() => {
    socketRef.current?.close()
    socketRef.current = null
    setConnected(false)
    setState(null)
    setMeId('')
  }, [])

  const dispatch = useCallback((action: GameAction) => {
    socketRef.current?.send(JSON.stringify({ type: 'ACTION', action }))
  }, [])

  useEffect(() => {
    return () => {
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [])

  return { state, meId, connected, error, connect, disconnect, dispatch }
}

export function multiplayerConfigured(): boolean {
  return Boolean(HOST)
}
