import { useCallback, useRef, useState } from 'react'
import { getWebSocketUrl } from '../lib/api'
import type { GeminiServerContent, TranscriptEntry } from '../types'

export type ConnectionStatus = 'idle' | 'connecting' | 'ready' | 'error' | 'closed'

export interface GeminiLiveState {
  status: ConnectionStatus
  transcript: TranscriptEntry[]
  isAiSpeaking: boolean
  error: string | null
}

export interface GeminiLiveControls {
  connect: (systemPrompt: string) => void
  sendAudioChunk: (base64pcm: string) => void
  sendText: (text: string) => void
  disconnect: () => void
  appendUserTranscript: (text: string) => void
}

export function useGeminiLive(
  onAudioChunk: (base64pcm: string) => void
): GeminiLiveState & GeminiLiveControls {
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const accTextRef = useRef<string>('')

  const appendEntry = useCallback((speaker: 'interviewer' | 'candidate', text: string) => {
    setTranscript((prev) => {
      // Merge with the last entry if same speaker and recent
      const last = prev[prev.length - 1]
      if (last && last.speaker === speaker && Date.now() - last.timestamp < 3000) {
        return [
          ...prev.slice(0, -1),
          { speaker, text: last.text + ' ' + text, timestamp: Date.now() },
        ]
      }
      return [...prev, { speaker, text, timestamp: Date.now() }]
    })
  }, [])

  const appendUserTranscript = useCallback(
    (text: string) => {
      if (text.trim()) appendEntry('candidate', text.trim())
    },
    [appendEntry]
  )

  const connect = useCallback(
    (systemPrompt: string) => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      setStatus('connecting')
      setError(null)
      setTranscript([])
      accTextRef.current = ''

      const ws = new WebSocket(getWebSocketUrl())
      wsRef.current = ws

      // Timeout: if setupComplete not received in 15s, surface an error
      const setupTimeout = setTimeout(() => {
        if (wsRef.current === ws) {
          setError('Timed out connecting to Gemini. Check that your API key is valid and has Gemini 2.0 Flash Live access.')
          setStatus('error')
          ws.close()
        }
      }, 15000)

      ws.onopen = () => {
        // Send config as the first message
        ws.send(JSON.stringify({ type: 'config', systemPrompt }))
      }

      ws.onmessage = async (event) => {
        try {
          // Handle string, Blob, or ArrayBuffer
          let raw: string
          if (typeof event.data === 'string') {
            raw = event.data
          } else if (event.data instanceof Blob) {
            raw = await event.data.text()
          } else if (event.data instanceof ArrayBuffer) {
            raw = new TextDecoder().decode(event.data)
          } else {
            return
          }
          const data = JSON.parse(raw) as GeminiServerContent & {
            type?: string
            message?: string
            code?: number
            reason?: string
          }

          // Worker-level errors
          if (data.type === 'error') {
            setError(data.message ?? 'Unknown error from proxy')
            setStatus('error')
            return
          }

          if (data.type === 'gemini_closed') {
            setError(`Gemini closed the connection (code ${data.code ?? '?'}). Reason: ${data.reason || 'none'}. ${data.code === 1008 ? 'API quota exceeded.' : data.code === 4029 ? 'Rate limit hit — wait a moment and retry.' : 'Check API key or quota.'}`)
            setStatus('error')
            return
          }

          // Gemini setup complete
          if (data.setupComplete !== undefined) {
            clearTimeout(setupTimeout)
            setStatus('ready')
            return
          }

          // Server content (audio + transcription)
          if (data.serverContent) {
            const { serverContent } = data

            if (serverContent.modelTurn?.parts) {
              let hasAudio = false
              for (const part of serverContent.modelTurn.parts) {
                if ('inlineData' in part && part.inlineData.mimeType.startsWith('audio/')) {
                  onAudioChunk(part.inlineData.data)
                  hasAudio = true
                }
                // Text parts in audio-only mode are model internal thinking — ignore them
              }
              if (hasAudio) setIsAiSpeaking(true)
            }

            if (serverContent.turnComplete) {
              setIsAiSpeaking(false)
            }

            if (serverContent.interrupted) {
              setIsAiSpeaking(false)
            }
          }
        } catch {
          // Non-JSON or unexpected message — ignore
        }
      }

      ws.onerror = () => {
        clearTimeout(setupTimeout)
        setError('WebSocket connection error. Check your network and try again.')
        setStatus('error')
      }

      ws.onclose = (event) => {
        clearTimeout(setupTimeout)
        setStatus((prev) => prev === 'error' ? prev : (event.wasClean ? 'closed' : 'error'))
        wsRef.current = null
      }
    },
    [onAudioChunk, appendEntry]
  )

  const sendAudioChunk = useCallback((base64pcm: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(
      JSON.stringify({
        realtimeInput: {
          mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: base64pcm }],
        },
      })
    )
  }, [])

  const sendText = useCallback((text: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(
      JSON.stringify({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text }] }],
          turnComplete: true,
        },
      })
    )
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Session ended by user')
      wsRef.current = null
    }
    setStatus('closed')
    setIsAiSpeaking(false)
  }, [])

  return {
    status,
    transcript,
    isAiSpeaking,
    error,
    connect,
    sendAudioChunk,
    sendText,
    disconnect,
    appendUserTranscript,
  }
}
