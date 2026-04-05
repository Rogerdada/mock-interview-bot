import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TranscriptEntry } from '../types'

interface Props {
  entries: TranscriptEntry[]
}

export function Transcript({ entries }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted text-sm">
        Transcript will appear here…
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      <AnimatePresence initial={false}>
        {entries.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${
              entry.speaker === 'candidate' ? 'flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold mt-0.5 ${
                entry.speaker === 'interviewer'
                  ? 'bg-indigo/20 text-indigo'
                  : 'bg-accent/20 text-accent'
              }`}
            >
              {entry.speaker === 'interviewer' ? 'AI' : 'You'}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                entry.speaker === 'interviewer'
                  ? 'bg-surface-2 text-text rounded-tl-sm'
                  : 'bg-accent/10 text-text border border-accent/20 rounded-tr-sm'
              }`}
            >
              {entry.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  )
}
