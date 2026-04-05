import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TranscriptEntry } from '../types'

interface Props { entries: TranscriptEntry[] }

export function Transcript({ entries }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [entries])

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
        Transcript will appear here…
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <AnimatePresence initial={false}>
        {entries.map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${e.speaker === 'candidate' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-mono font-bold mt-0.5 ${
              e.speaker === 'interviewer' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {e.speaker === 'interviewer' ? 'AI' : 'Y'}
            </div>
            <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              e.speaker === 'interviewer'
                ? 'bg-white/[0.04] text-zinc-200 rounded-tl-sm'
                : 'bg-emerald-500/10 text-zinc-200 border border-emerald-500/15 rounded-tr-sm'
            }`}>
              {e.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  )
}
