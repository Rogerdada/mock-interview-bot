import { useState } from 'react'
import { motion } from 'framer-motion'
import type { InterviewDuration, InterviewType, ParsedJd } from '../types'

interface Props {
  jobDescription: string
  parsedJd: ParsedJd
  onStart: (type: InterviewType, duration: InterviewDuration) => void
  onBack: () => void
}

const INTERVIEW_TYPES: Array<{
  id: InterviewType
  label: string
  description: string
  icon: string
}> = [
  {
    id: 'behavioral',
    label: 'Behavioral',
    description: "STAR-method questions based on the role's competencies. Leadership, collaboration, problem-solving.",
    icon: '🧠',
  },
  {
    id: 'case-study',
    label: 'Case Study',
    description: 'Business or product case relevant to the industry. Tests structured thinking and business acumen.',
    icon: '📊',
  },
  {
    id: 'company-knowledge',
    label: 'Company Knowledge',
    description: 'Products, competitive landscape, strategy, recent news. Tests depth of research.',
    icon: '🏢',
  },
]

const DURATIONS: InterviewDuration[] = [5, 10, 15]

export function InterviewConfig({ jobDescription: _jd, parsedJd, onStart, onBack }: Props) {
  const [selectedType, setSelectedType] = useState<InterviewType>('behavioral')
  const [selectedDuration, setSelectedDuration] = useState<InterviewDuration>(10)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-2xl">
        <button
          onClick={onBack}
          className="text-muted hover:text-text text-sm mb-8 flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>

        {/* Role summary */}
        <div className="card p-6 mb-6">
          <p className="label-mono mb-3">Position</p>
          <h2 className="font-mono text-2xl font-bold text-text">
            {parsedJd.role}
          </h2>
          <p className="text-muted mt-1">{parsedJd.company}</p>
          {parsedJd.keyCompetencies.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {parsedJd.keyCompetencies.map((c) => (
                <span
                  key={c}
                  className="text-xs px-3 py-1 rounded-full bg-indigo/10 text-indigo border border-indigo/20"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Interview type */}
        <div className="mb-6">
          <p className="label-mono mb-3">Interview Type</p>
          <div className="grid gap-3">
            {INTERVIEW_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`card p-5 text-left transition-all duration-200 ${
                  selectedType === type.id
                    ? 'border-accent/50 bg-accent/5'
                    : 'hover:border-white/15'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{type.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-text">{type.label}</span>
                      {selectedType === type.id && (
                        <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-mono">
                          selected
                        </span>
                      )}
                    </div>
                    <p className="text-muted text-sm mt-1">{type.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="mb-8">
          <p className="label-mono mb-3">Interview Length</p>
          <div className="flex gap-3">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                className={`flex-1 card py-4 font-mono font-bold text-lg transition-all duration-200 ${
                  selectedDuration === d
                    ? 'border-accent/50 text-accent bg-accent/5'
                    : 'text-muted hover:text-text hover:border-white/15'
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onStart(selectedType, selectedDuration)}
          className="btn-primary w-full text-base"
        >
          Start Interview
        </button>
      </div>
    </motion.div>
  )
}
