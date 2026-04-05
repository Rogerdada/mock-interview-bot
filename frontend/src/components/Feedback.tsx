import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Evaluation, HireRating, InterviewConfig } from '../types'
import jsPDF from 'jspdf'

interface Props {
  evaluation: Evaluation
  config: InterviewConfig
  onTryAgain: () => void
}

const RATING_META: Record<HireRating, { color: string; bar: string; value: number }> = {
  'Strong Hire':     { color: 'text-emerald-400', bar: 'bg-emerald-400', value: 6 },
  'Hire':            { color: 'text-emerald-400', bar: 'bg-emerald-400', value: 5 },
  'Leaning Hire':    { color: 'text-yellow-400',  bar: 'bg-yellow-400',  value: 4 },
  'Leaning No Hire': { color: 'text-orange-400',  bar: 'bg-orange-400',  value: 3 },
  'No Hire':         { color: 'text-red-400',     bar: 'bg-red-400',     value: 2 },
  'Strong No Hire':  { color: 'text-red-400',     bar: 'bg-red-400',     value: 1 },
}

function RatingPill({ rating }: { rating: HireRating }) {
  const m = RATING_META[rating] ?? RATING_META['Leaning No Hire']
  return <span className={`text-xs font-mono font-bold ${m.color}`}>{rating}</span>
}

export function Feedback({ evaluation, config, onTryAgain }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null)

  function downloadPDF() {
    const doc = new jsPDF()
    let y = 20
    const add = (text: string, size = 10, bold = false) => {
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      const lines = doc.splitTextToSize(text, 170)
      doc.text(lines, 20, y)
      y += lines.length * (size * 0.45) + 3
    }
    add('Mock Interview Report', 16, true)
    add(`${config.parsedJd.role} · ${config.parsedJd.company}`)
    add(`${config.interviewType} · ${config.duration} min · ${new Date().toLocaleDateString()}`)
    y += 4
    add(`Overall: ${evaluation.overallRecommendation}`, 13, true)
    add(evaluation.overallSummary)
    y += 4
    add('Rubric', 12, true)
    for (const d of evaluation.dimensions) { add(`${d.name}: ${d.rating}`, 10, true); add(d.justification) }
    y += 4
    add('Strengths', 12, true)
    evaluation.strengths.forEach((s) => add(`• ${s}`))
    y += 4
    add('Areas to Improve', 12, true)
    evaluation.improvements.forEach((s) => add(`• ${s}`))
    doc.save(`interview-report-${Date.now()}.pdf`)
  }

  const rec = evaluation.overallRecommendation
  const recMeta = RATING_META[rec] ?? RATING_META['Leaning No Hire']

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen px-4 py-12"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="label mb-3">Interview Complete</p>
          <p className={`font-mono text-4xl font-bold mb-3 ${recMeta.color}`}>{rec}</p>
          <p className="text-zinc-400 text-sm max-w-lg mx-auto leading-relaxed">{evaluation.overallSummary}</p>
        </div>

        {/* Rubric */}
        <div className="glass p-5 mb-4">
          <p className="label mb-4">Evaluation Rubric</p>
          <div className="space-y-4">
            {evaluation.dimensions.map((d) => {
              const m = RATING_META[d.rating as HireRating] ?? RATING_META['Leaning No Hire']
              return (
                <div key={d.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-zinc-200">{d.name}</span>
                    <RatingPill rating={d.rating as HireRating} />
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full transition-all duration-700 ${m.bar}`} style={{ width: `${(m.value / 6) * 100}%` }} />
                  </div>
                  <p className="text-zinc-500 text-xs leading-relaxed">{d.justification}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Strengths + Improvements */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass p-4">
            <p className="label text-emerald-500 mb-3">Strengths</p>
            <ul className="space-y-2">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="text-xs text-zinc-300 flex gap-2">
                  <span className="text-emerald-500 flex-shrink-0">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass p-4">
            <p className="label text-amber-500 mb-3">Improve</p>
            <ul className="space-y-2">
              {evaluation.improvements.map((s, i) => (
                <li key={i} className="text-xs text-zinc-300 flex gap-2">
                  <span className="text-amber-500 flex-shrink-0">→</span>{s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sample stronger answers */}
        {evaluation.sampleStrongerAnswers?.length > 0 && (
          <div className="glass p-5 mb-6">
            <p className="label mb-3">Stronger Answers</p>
            <div className="space-y-2">
              {evaluation.sampleStrongerAnswers.map((item, i) => (
                <div key={i} className="border border-white/[0.06] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full text-left px-4 py-3 flex items-start justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div>
                      <p className="text-sm text-zinc-200">{item.originalQuestion}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">You: {item.candidateAnswer}</p>
                    </div>
                    <span className="text-zinc-600 text-xs flex-shrink-0 mt-1">{expanded === i ? '▲' : '▼'}</span>
                  </button>
                  {expanded === i && (
                    <div className="px-4 pb-4 border-t border-white/[0.06]">
                      <p className="label mt-3 mb-1.5">Stronger answer</p>
                      <p className="text-zinc-300 text-xs leading-relaxed">{item.strongerAnswer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button onClick={onTryAgain} className="btn-green">Try Again</button>
          <button onClick={downloadPDF} className="btn-ghost">Download PDF</button>
        </div>
      </div>
    </motion.div>
  )
}
