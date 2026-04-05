import { useCallback, useRef, useState } from 'react'
import { int16ToFloat32, base64ToArrayBuffer, getRmsAmplitude } from '../lib/audioUtils'

// Gemini Live API returns PCM at 24kHz
const GEMINI_OUTPUT_SAMPLE_RATE = 24000

export interface AudioPlaybackState {
  isPlaying: boolean
  amplitude: number // 0..1 for visualiser
}

export interface AudioPlaybackControls {
  initPlayback: () => void
  enqueueAudio: (base64pcm: string) => void
  stopPlayback: () => void
}

export function useAudioPlayback(): AudioPlaybackState & AudioPlaybackControls {
  const [isPlaying, setIsPlaying] = useState(false)
  const [amplitude, setAmplitude] = useState(0)

  const contextRef = useRef<AudioContext | null>(null)
  const nextStartTimeRef = useRef<number>(0)
  const amplitudeTimerRef = useRef<number | null>(null)

  const initPlayback = useCallback(() => {
    if (!contextRef.current || contextRef.current.state === 'closed') {
      contextRef.current = new AudioContext({ sampleRate: GEMINI_OUTPUT_SAMPLE_RATE })
      nextStartTimeRef.current = 0
    }
  }, [])

  const stopPlayback = useCallback(() => {
    if (amplitudeTimerRef.current) {
      clearInterval(amplitudeTimerRef.current)
      amplitudeTimerRef.current = null
    }
    if (contextRef.current && contextRef.current.state !== 'closed') {
      contextRef.current.close()
      contextRef.current = null
    }
    nextStartTimeRef.current = 0
    setIsPlaying(false)
    setAmplitude(0)
  }, [])

  const enqueueAudio = useCallback((base64pcm: string) => {
    const ctx = contextRef.current
    if (!ctx || ctx.state === 'closed') return

    const arrayBuffer = base64ToArrayBuffer(base64pcm)
    const int16 = new Int16Array(arrayBuffer)
    const float32 = int16ToFloat32(int16)

    const audioBuffer = ctx.createBuffer(1, float32.length, GEMINI_OUTPUT_SAMPLE_RATE)
    audioBuffer.copyToChannel(float32 as Float32Array<ArrayBuffer>, 0)

    const source = ctx.createBufferSource()
    source.buffer = audioBuffer

    // Analyser for amplitude
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyser.connect(ctx.destination)

    // Schedule seamlessly
    const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current)
    source.start(startTime)
    nextStartTimeRef.current = startTime + audioBuffer.duration

    setIsPlaying(true)

    source.onended = () => {
      // Check if queue is empty
      if (ctx.currentTime >= nextStartTimeRef.current - 0.05) {
        setIsPlaying(false)
        setAmplitude(0)
      }
    }

    // Update amplitude while playing
    if (amplitudeTimerRef.current) clearInterval(amplitudeTimerRef.current)
    amplitudeTimerRef.current = window.setInterval(() => {
      if (ctx.state === 'closed') return
      const dataArray = new Float32Array(analyser.frequencyBinCount)
      analyser.getFloatTimeDomainData(dataArray)
      const rms = getRmsAmplitude(dataArray)
      setAmplitude(Math.min(1, rms * 8))
      if (ctx.currentTime >= nextStartTimeRef.current - 0.05) {
        setAmplitude(0)
        if (amplitudeTimerRef.current) clearInterval(amplitudeTimerRef.current)
      }
    }, 50)
  }, [])

  return { isPlaying, amplitude, initPlayback, enqueueAudio, stopPlayback }
}
