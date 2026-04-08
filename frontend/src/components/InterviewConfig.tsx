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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="min-h-screen flex items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-lg">
        <button onClick={onBack} className="text-zinc-500 hover:text-zinc-700 text-sm mb-8 transition-colors">
          ← Back
        </button>

        {/* Role card */}
        <div className="glass p-5 mb-6">
          <p className="label mb-1">Position</p>
          <p className="text-lg font-semibold text-zinc-900">{parsedJd.role}</p>
          <p className="text-zinc-500 text-sm">{parsedJd.company}</p>
          {(parsedJd.keyCompetencies ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(parsedJd.keyCompetencies ?? []).map((c) => (
                <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Type */}
        <p className="label mb-2">Interview type</p>
        <div className="space-y-2 mb-6">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`w-full glass p-4 text-left transition-all duration-150 ${
                type === t.id ? 'border-emerald-400 bg-emerald-50' : 'hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-zinc-900">{t.label}</span>
                {type === t.id && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-zinc-500 text-xs mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>

        {/* Duration */}
        <p className="label mb-2">Duration</p>
        <div className="flex gap-2 mb-8">
          {([5, 10, 15] as InterviewDuration[]).map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-mono font-bold border transition-all ${
                duration === d
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-600'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-700'
              }`}
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
