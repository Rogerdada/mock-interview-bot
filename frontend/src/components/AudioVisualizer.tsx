import { useEffect, useRef } from 'react'

interface Props {
  amplitude: number // 0..1
  color: 'green' | 'indigo'
  barCount?: number
}

export function AudioVisualizer({ amplitude, color, barCount = 32 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const amplitudeRef = useRef(amplitude)
  const animFrameRef = useRef<number>(0)

  // Smoothed bar heights array
  const barsRef = useRef<number[]>(Array(barCount).fill(0))

  useEffect(() => {
    amplitudeRef.current = amplitude
  }, [amplitude])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const primaryColor = color === 'green' ? '#4ade80' : '#818cf8'
    const dimColor = color === 'green' ? '#14532d' : '#1e1b4b'
    // capture non-null refs for use inside draw()
    const c = canvas
    const cx = ctx

    function draw() {
      const w = c.width
      const h = c.height
      cx.clearRect(0, 0, w, h)

      const amp = amplitudeRef.current
      const barW = Math.floor(w / barCount) - 1
      const maxH = h * 0.9

      barsRef.current = barsRef.current.map((prev, i) => {
        // Each bar gets a slightly randomised target height based on amplitude
        const noise = amp > 0.01 ? (0.3 + Math.random() * 0.7) * amp : 0
        const center = Math.abs(i / barCount - 0.5) * 2 // 0=edge, 1=center
        const target = noise * (0.3 + 0.7 * center) * maxH
        // Smooth toward target
        return prev + (target - prev) * 0.3
      })

      for (let i = 0; i < barCount; i++) {
        const x = i * (barW + 1)
        const barH = Math.max(2, barsRef.current[i])
        const y = (h - barH) / 2

        // Gradient fill
        const grad = cx.createLinearGradient(0, y, 0, y + barH)
        grad.addColorStop(0, dimColor)
        grad.addColorStop(0.5, primaryColor)
        grad.addColorStop(1, dimColor)

        cx.fillStyle = grad
        cx.beginPath()
        cx.roundRect(x, y, barW, barH, 2)
        cx.fill()
      }

      animFrameRef.current = requestAnimationFrame(draw)
    }

    animFrameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [color, barCount])

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
    })
    observer.observe(canvas)
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    return () => observer.disconnect()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  )
}
