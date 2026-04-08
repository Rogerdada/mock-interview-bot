import { useEffect, useRef, useState } from 'react'

interface Props {
  durationSeconds: number
  running: boolean
  onExpired: () => void
}

export function Timer({ durationSeconds, running, onExpired }: Props) {
  const [remaining, setRemaining] = useState(durationSeconds)
  const intervalRef = useRef<number | null>(null)
  const onExpiredRef = useRef(onExpired)
  onExpiredRef.current = onExpired

  useEffect(() => {
    setRemaining(durationSeconds)
  }, [durationSeconds])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          onExpiredRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const progress = remaining / durationSeconds

  const isWarning = remaining <= 60
  const isDanger = remaining <= 30

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-9 h-9">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15" fill="none"
            stroke={isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 15}`}
            strokeDashoffset={`${2 * Math.PI * 15 * (1 - progress)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
      </div>
      <span className={`font-mono text-xl font-bold tabular-nums transition-colors ${
        isDanger ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-stone-800'
      }`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  )
}
