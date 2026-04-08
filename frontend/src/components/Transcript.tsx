import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TranscriptEntry } from '../types'

interface Props { entries: TranscriptEntry[] }

export function Transcript({ entries }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [entries])

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">
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
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 ${
              e.speaker === 'interviewer'
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-emerald-100 text-emerald-600'
            }`}>
              {e.speaker === 'interviewer' ? 'AI' : 'Y'}
            </div>
            <div
              className="max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed text-stone-800"
              style={e.speaker === 'interviewer'
                ? { background: '#f5f4f2', borderRadius: '4px 16px 16px 16px' }
                : { background: 'rgba(16,185,129,0.07)', boxShadow: '0 0 0 1px rgba(16,185,129,0.18)', borderRadius: '16px 4px 16px 16px' }
              }
            >
              {e.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  )
}
