import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [phase, setPhase] = useState<'connecting' | 'active' | 'ending' | 'error'>('connecting')
  const [timerRunning, setTimerRunning] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const endedRef = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const isPlayingRef = useRef(false)

  const { enqueueAudio, initPlayback, stopPlayback, isPlaying, amplitude: aiAmp } = useAudioPlayback()
  const handleAudioChunk = useCallback((b64: string) => enqueueAudio(b64), [enqueueAudio])

  const { status: wsStatus, transcript, error: wsError, connect, sendAudioChunk, sendText, disconnect, appendUserTranscript } =
    useGeminiLive(handleAudioChunk)

  // Don't forward mic audio to Gemini while AI is playing (avoids echo/confusion)
  const safeSendAudioChunk = useCallback((b64: string) => {
    if (!isPlayingRef.current) sendAudioChunk(b64)
  }, [sendAudioChunk])

  const { isCapturing, amplitude: micAmp, startCapture, stopCapture } = useAudioCapture()

  useEffect(() => {
    initPlayback()
    connect(buildSystemPrompt(config))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (wsStatus === 'ready') {
      setTimeout(() => beginSession(), 800)
    } else if (wsStatus === 'error') {
      setPhase('error')
      setErrorMsg(wsError ?? 'Connection failed. Check your API key and try again.')
    }
  }, [wsStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  async function beginSession() {
    try {
      await startCapture(safeSendAudioChunk)
      startSpeechRecognition()
      setPhase('active')
      setTimerRunning(true)
    } catch {
      setPhase('error')
      setErrorMsg('Microphone access denied. Please allow mic access and reload.')
    }
  }

  function startSpeechRecognition() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.webkitSpeechRecognition ?? w.SpeechRecognition
    if (!SR) return
    const r = new SR()
    r.continuous = true
    r.interimResults = false
    r.lang = 'en-US'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      const res = e.results[e.results.length - 1]
      if (res.isFinal) appendUserTranscript(res[0].transcript)
    }
    r.onend = () => { if (!isPlayingRef.current) { try { r.start() } catch { /* ignore */ } } }
    r.start()
    recognitionRef.current = r
  }

  // Pause speech recognition while AI is speaking to avoid capturing AI audio
  useEffect(() => {
    isPlayingRef.current = isPlaying
    const r = recognitionRef.current
    if (!r || phase !== 'active') return
    if (isPlaying) {
      try { r.stop() } catch { /* ignore */ }
    } else {
      try { r.start() } catch { /* ignore */ }
    }
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  function endInterview(reason: 'timer' | 'manual') {
    if (endedRef.current) return
    endedRef.current = true
    setPhase('ending')
    setTimerRunning(false)
    recognitionRef.current?.stop()
    stopCapture()
    if (reason === 'timer') {
      sendText('Time is up. Please give a brief closing statement and thank the candidate.')
    }
    setTimeout(() => {
      disconnect()
      stopPlayback()
      onEnd(transcript)
    }, reason === 'timer' ? 5000 : 500)
  }

  const speakerActive = isPlaying
  const micActive = isCapturing && !isPlaying

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div>
          <p className="text-sm font-medium text-zinc-100">{config.parsedJd.role}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{config.parsedJd.company}</p>
        </div>
        <div className="flex items-center gap-4">
          {phase === 'active' && (
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${speakerActive ? 'bg-indigo-400 animate-pulse' : micActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span className="text-xs text-zinc-500">
                {speakerActive ? 'AI speaking' : 'Listening'}
              </span>
            </div>
          )}
          <Timer durationSeconds={config.duration * 60} running={timerRunning} onExpired={() => endInterview('timer')} />
          {phase === 'active' && (
            <button onClick={() => endInterview('manual')} className="btn-red text-xs px-3 py-1.5">
              End
            </button>
          )}
        </div>
      </div>

      {/* Visualizer */}
      {phase === 'active' && (
        <div className="px-6 pt-4">
          <div className="h-12 rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.04]">
            <AudioVisualizer amplitude={speakerActive ? aiAmp : micAmp} color={speakerActive ? 'indigo' : 'green'} />
          </div>
        </div>
      )}

      {/* State overlays */}
      <AnimatePresence>
        {(phase === 'connecting' || phase === 'ending') && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-3"
          >
            <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
            <p className="text-zinc-400 text-sm">
              {phase === 'connecting' ? 'Connecting to AI interviewer…' : 'Wrapping up session…'}
            </p>
          </motion.div>
        )}
        {phase === 'error' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center px-6"
          >
            <div className="glass p-8 max-w-sm text-center">
              <p className="text-red-400 font-semibold mb-2">Connection Error</p>
              <p className="text-zinc-400 text-sm mb-5">{errorMsg}</p>
              <button onClick={() => window.location.reload()} className="btn-ghost text-sm">Reload</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript */}
      {phase === 'active' && (
        <div className="flex-1 flex flex-col min-h-0 mx-4 my-4 glass overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="label">Transcript</p>
          </div>
          <Transcript entries={transcript} />
        </div>
      )}
    </div>
  )
}
