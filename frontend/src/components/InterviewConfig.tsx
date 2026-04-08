import { useState } from 'react'
import { motion } from 'framer-motion'
import type { InterviewDuration, InterviewType, ParsedJd } from '../types'

interface Props {
  jobDescription: string
  parsedJd: ParsedJd
  onStart: (type: InterviewType, duration: InterviewDuration) => void
  onBack: () => void
}

const TYPES: Array<{ id: InterviewType; label: string; desc: string }> = [
  { id: 'behavioral',        label: 'Behavioral',        desc: 'STAR-method questions on leadership, collaboration & problem-solving' },
  { id: 'case-study',        label: 'Case Study',         desc: 'Business scenario — tests structured thinking & data intuition' },
  { id: 'company-knowledge', label: 'Company Knowledge',  desc: "Products, strategy, competitors & why you want this role" },
]

export function InterviewConfig({ parsedJd, onStart, onBack }: Props) {
  const [type, setType]         = useState<InterviewType>('behavioral')
  const [duration, setDuration] = useState<InterviewDuration>(10)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="min-h-screen flex items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-lg">
        <button onClick={onBack} className="text-stone-400 hover:text-stone-700 text-sm mb-8 transition-colors flex items-center gap-1.5">
          <span>←</span> <span>Back</span>
        </button>

        {/* Role card */}
        <div className="glass p-5 mb-5">
          <p className="label mb-2">Position</p>
          <p className="text-lg font-semibold text-stone-900 leading-snug">{parsedJd.role}</p>
          <p className="text-stone-500 text-sm mt-0.5">{parsedJd.company}</p>
          {(parsedJd.keyCompetencies ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(parsedJd.keyCompetencies ?? []).map((c) => (
                <span key={c} className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(99,102,241,0.07)', color: '#4f46e5', boxShadow: '0 0 0 1px rgba(99,102,241,0.15)' }}>
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Type */}
        <p className="label mb-2.5">Interview type</p>
        <div className="space-y-2 mb-5">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className="w-full text-left transition-all duration-150 rounded-2xl"
              style={type === t.id
                ? { background: 'white', boxShadow: '0 0 0 1.5px rgba(16,185,129,0.5), 0 2px 8px -2px rgba(0,0,0,0.06)', padding: '1rem' }
                : { background: 'white', boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03)', padding: '1rem' }
              }
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-stone-900">{t.label}</span>
                {type === t.id && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-stone-400 text-xs mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>

        {/* Duration */}
        <p className="label mb-2.5">Duration</p>
        <div className="flex gap-2 mb-8">
          {([5, 10, 15] as InterviewDuration[]).map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className="flex-1 py-2.5 rounded-xl text-sm font-mono font-bold transition-all duration-150"
              style={duration === d
                ? { background: 'rgba(16,185,129,0.08)', color: '#059669', boxShadow: '0 0 0 1.5px rgba(16,185,129,0.4)' }
                : { background: 'white', color: '#a8a29e', boxShadow: '0 0 0 1px rgba(0,0,0,0.06)' }
              }
            >
              {d} min
            </button>
          ))}
        </div>

        <button onClick={() => onStart(type, duration)} className="btn-green w-full">
          Start Interview
        </button>
      </div>
    </motion.div>
  )
}
