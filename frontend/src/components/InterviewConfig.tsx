import { useState } from 'react'
import { motion } from 'framer-motion'
import type { InterviewQuestionCount, InterviewType, ParsedJd } from '../types'

interface Props {
  jobDescription: string
  parsedJd: ParsedJd
  onStart: (type: InterviewType, questionCount: InterviewQuestionCount) => void
  onBack: () => void
}

const TYPES: Array<{ id: InterviewType; label: string; desc: string }> = [
  { id: 'behavioral',        label: 'Behavioral',        desc: 'STAR-method questions on leadership, collaboration & problem-solving' },
  { id: 'case-study',        label: 'Case Study',         desc: 'Business scenario — tests structured thinking & data intuition' },
  { id: 'company-knowledge', label: 'Company Knowledge',  desc: "Products, strategy, competitors & why you want this role" },
]

const QUESTION_COUNTS: Array<{ value: InterviewQuestionCount; label: string; desc: string }> = [
  { value: 3, label: '3',  desc: 'Quick' },
  { value: 5, label: '5',  desc: 'Standard' },
  { value: 8, label: '8',  desc: 'Thorough' },
]

export function InterviewConfig({ parsedJd, onStart, onBack }: Props) {
  const [type, setType]               = useState<InterviewType>('behavioral')
  const [questionCount, setCount]     = useState<InterviewQuestionCount>(5)

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
                {type === t.id && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
              </div>
              <p className="text-stone-400 text-xs mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>

        {/* Question count */}
        <p className="label mb-2.5">Number of questions</p>
        <div className="flex gap-2 mb-8">
          {QUESTION_COUNTS.map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => setCount(value)}
              className="flex-1 py-3 rounded-xl transition-all duration-150 flex flex-col items-center gap-0.5"
              style={questionCount === value
                ? { background: 'rgba(16,185,129,0.08)', boxShadow: '0 0 0 1.5px rgba(16,185,129,0.4)' }
                : { background: 'white', boxShadow: '0 0 0 1px rgba(0,0,0,0.06)' }
              }
            >
              <span className={`text-lg font-bold font-mono ${questionCount === value ? 'text-emerald-600' : 'text-stone-400'}`}>
                {label}
              </span>
              <span className={`text-[10px] font-medium ${questionCount === value ? 'text-emerald-500' : 'text-stone-400'}`}>
                {desc}
              </span>
            </button>
          ))}
        </div>

        <button onClick={() => onStart(type, questionCount)} className="btn-green w-full">
          Start Interview
        </button>
      </div>
    </motion.div>
  )
}
