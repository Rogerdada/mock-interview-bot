import { useEffect, useRef, useState } from 'react'

interface Props {
  running: boolean
}

export function Timer({ running }: Props) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = window.setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.04)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-stone-400" style={running ? { animation: 'pulse 2s infinite' } : {}} />
      <span className="font-mono text-sm font-semibold tabular-nums text-stone-600">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  )
}
