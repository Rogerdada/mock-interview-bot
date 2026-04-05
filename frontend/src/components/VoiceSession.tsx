import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AudioVisualizer } from './AudioVisualizer'
import { Timer } from './Timer'
import { Transcript } from './Transcript'
import { useAudioCapture } from '../hooks/useAudioCapture'
import { useAudioPlayback } from '../hooks/useAudioPlayback'
import { useGeminiLive } from '../hooks/useGeminiLive'
import type { InterviewConfig, TranscriptEntry } from '../types'
import { buildSystemPrompt } from '../lib/prompts'

interface Props {
  config: InterviewConfig
  onEnd: (transcript: TranscriptEntry[]) => void
}

export function VoiceSession({ config, onEnd }: Props) {
  const [sessionState, setSessionState] = useState<
    'initialising' | 'ready' | 'active' | 'ending' | 'error'
  >('initialising')
  const [timerRunning, setTimerRunning] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Connecting to AI interviewer…')
  const endCalledRef = useRef(false)

  // Speech recognition for user transcript (fallback)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const { enqueueAudio, initPlayback, stopPlayback, isPlaying, amplitude: aiAmplitude } =
    useAudioPlayback()

  const handleAudioChunk = useCallback(
    (base64pcm: string) => {
      enqueueAudio(base64pcm)
    },
    [enqueueAudio]
  )

  const {
    status: wsStatus,
    transcript,
    error: wsError,
    connect,
    sendAudioChunk,
    sendText,
    disconnect,
    appendUserTranscript,
  } = useGeminiLive(handleAudioChunk)

  const { isCapturing, amplitude: micAmplitude, error: captureError, startCapture, stopCapture } =
    useAudioCapture()

  // Connect on mount
  useEffect(() => {
    initPlayback()
    const systemPrompt = buildSystemPrompt(config)
    connect(systemPrompt)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // React to WebSocket status changes
  useEffect(() => {
    if (wsStatus === 'ready') {
      setSessionState('ready')
      setStatusMessage('AI interviewer connected. Starting your session…')
      // Auto-start after brief delay
      setTimeout(() => startSession(), 1000)
    } else if (wsStatus === 'error') {
      setSessionState('error')
      setStatusMessage(wsError ?? 'Connection failed')
    }
  }, [wsStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  async function startSession() {
    try {
      await startCapture(sendAudioChunk)
      startSpeechRecognition()
      setSessionState('active')
      setTimerRunning(true)
      setStatusMessage('')
    } catch {
      setSessionState('error')
      setStatusMessage(captureError ?? 'Could not start microphone')
    }
  }

  function startSpeechRecognition() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.webkitSpeechRecognition ?? w.SpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      if (result.isFinal) {
        appendUserTranscript(result[0].transcript)
      }
    }

    recognition.onerror = () => {
      // Non-fatal — just stop trying
    }

    recognition.onend = () => {
      // Restart if still active
      if (sessionState === 'active') {
        try { recognition.start() } catch { /* ignore */ }
      }
    }

    recognition.start()
    recognitionRef.current = recognition
  }

  function handleTimerExpired() {
    if (!endCalledRef.current) endInterview('timer')
  }

  function handleEndEarly() {
    if (!endCalledRef.current) endInterview('manual')
  }

  async function endInterview(reason: 'timer' | 'manual') {
    endCalledRef.current = true
    setSessionState('ending')
    setTimerRunning(false)
    setStatusMessage('Wrapping up your session…')

    recognitionRef.current?.stop()
    stopCapture()

    // Ask Gemini to wrap up gracefully
    if (reason === 'timer') {
      sendText(
        "We're out of time. Please give a brief closing statement wrapping up the interview, thank the candidate, and let them know feedback will follow."
      )
      // Give AI 5 seconds to finish speaking
      await new Promise((r) => setTimeout(r, 5000))
    }

    disconnect()
    stopPlayback()

    onEnd(transcript)
  }

  const showVisualizer = sessionState === 'active'
  const isMicActive = isCapturing && !isPlaying
  const isAiActive = isPlaying

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col bg-bg"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div>
          <p className="label-mono">{config.parsedJd.role}</p>
          <p className="text-muted text-xs mt-0.5">{config.parsedJd.company}</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                sessionState === 'active'
                  ? isAiActive
                    ? 'bg-indigo animate-pulse'
                    : 'bg-accent animate-pulse'
                  : 'bg-muted'
              }`}
            />
            {sessionState === 'active'
              ? isAiActive
                ? 'AI speaking'
                : 'Listening…'
              : sessionState === 'ending'
              ? 'Ending session…'
              : ''}
          </div>

          <Timer
            durationSeconds={config.duration * 60}
            running={timerRunning}
            onExpired={handleTimerExpired}
          />

          {sessionState === 'active' && (
            <button
              onClick={handleEndEarly}
              className="btn-danger text-sm px-4 py-2"
            >
              End Early
            </button>
          )}
        </div>
      </div>

      {/* Visualizer */}
      {showVisualizer && (
        <div className="px-6 py-4">
          <div className="h-16 rounded-xl overflow-hidden bg-surface">
            <AudioVisualizer
              amplitude={isAiActive ? aiAmplitude : micAmplitude}
              color={isAiActive ? 'indigo' : 'green'}
            />
          </div>
          <p className="text-center text-muted text-xs mt-2">
            {isAiActive ? 'Interviewer speaking' : 'Your turn — speak now'}
          </p>
        </div>
      )}

      {/* Status overlays */}
      {(sessionState === 'initialising' ||
        sessionState === 'ready' ||
        sessionState === 'ending') && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
            </div>
            <p className="text-muted">{statusMessage}</p>
          </div>
        </div>
      )}

      {sessionState === 'error' && (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center card p-8 max-w-md">
            <p className="text-danger text-lg font-semibold mb-2">Connection Error</p>
            <p className="text-muted text-sm mb-6">{statusMessage}</p>
            <button onClick={() => window.location.reload()} className="btn-secondary">
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Transcript */}
      {sessionState === 'active' && (
        <div className="flex-1 flex flex-col min-h-0 mx-4 mb-4 card overflow-hidden">
          <div className="px-4 pt-4 pb-2 border-b border-white/5">
            <p className="label-mono">Live Transcript</p>
          </div>
          <Transcript entries={transcript} />
        </div>
      )}
    </motion.div>
  )
}
