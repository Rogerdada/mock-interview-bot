import { useCallback, useRef, useState } from 'react'
import { float32ToInt16, downsample, arrayBufferToBase64, getRmsAmplitude } from '../lib/audioUtils'

const TARGET_SAMPLE_RATE = 16000
const CHUNK_INTERVAL_MS = 100

export interface AudioCaptureState {
  isCapturing: boolean
  amplitude: number // 0..1 for visualizer
  error: string | null
}

export interface AudioCaptureControls {
  startCapture: (onChunk: (base64pcm: string) => void) => Promise<void>
  stopCapture: () => void
}

export function useAudioCapture(): AudioCaptureState & AudioCaptureControls {
  const [isCapturing, setIsCapturing] = useState(false)
  const [amplitude, setAmplitude] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const bufferAccRef = useRef<Float32Array[]>([])
  const intervalRef = useRef<number | null>(null)
  const onChunkRef = useRef<((base64pcm: string) => void) | null>(null)

  const stopCapture = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current.onaudioprocess = null
      processorRef.current = null
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect()
      analyserRef.current = null
    }
    if (contextRef.current && contextRef.current.state !== 'closed') {
      contextRef.current.close()
      contextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    bufferAccRef.current = []
    onChunkRef.current = null
    setIsCapturing(false)
    setAmplitude(0)
  }, [])

  const startCapture = useCallback(
    async (onChunk: (base64pcm: string) => void) => {
      setError(null)
      onChunkRef.current = onChunk

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: { ideal: TARGET_SAMPLE_RATE },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        })
        streamRef.current = stream

        // Create AudioContext — try to use 16kHz directly
        const ctx = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE })
        contextRef.current = ctx

        const source = ctx.createMediaStreamSource(stream)

        // Analyser for amplitude visualisation
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        analyserRef.current = analyser
        source.connect(analyser)

        // ScriptProcessorNode for PCM capture
        // bufferSize 4096 = ~256ms at 16kHz; we accumulate then flush on interval
        const bufferSize = 4096
        const processor = ctx.createScriptProcessor(bufferSize, 1, 1)
        processorRef.current = processor

        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0)
          // Downsample if context sample rate differs from 16kHz
          const samples =
            ctx.sampleRate !== TARGET_SAMPLE_RATE
              ? downsample(input, ctx.sampleRate, TARGET_SAMPLE_RATE)
              : new Float32Array(input)
          bufferAccRef.current.push(samples)
        }

        source.connect(processor)
        processor.connect(ctx.destination)

        // Send chunks every CHUNK_INTERVAL_MS
        intervalRef.current = window.setInterval(() => {
          if (bufferAccRef.current.length === 0) return

          // Flatten accumulated buffers
          const totalLength = bufferAccRef.current.reduce((s, b) => s + b.length, 0)
          const flat = new Float32Array(totalLength)
          let offset = 0
          for (const b of bufferAccRef.current) {
            flat.set(b, offset)
            offset += b.length
          }
          bufferAccRef.current = []

          // Amplitude for visualiser
          setAmplitude(Math.min(1, getRmsAmplitude(flat) * 8))

          // Convert to Int16 PCM
          const int16 = float32ToInt16(flat)
          const base64 = arrayBufferToBase64(int16.buffer as ArrayBuffer)
          onChunkRef.current?.(base64)
        }, CHUNK_INTERVAL_MS)

        setIsCapturing(true)
      } catch (err) {
        const msg = (err as Error).message
        setError(
          msg.includes('Permission denied') || msg.includes('NotAllowedError')
            ? 'Microphone access denied. Please allow microphone access and try again.'
            : `Failed to start audio capture: ${msg}`
        )
      }
    },
    [stopCapture]
  )

  return { isCapturing, amplitude, error, startCapture, stopCapture }
}
