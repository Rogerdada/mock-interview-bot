import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Evaluation, HireRating, InterviewConfig } from '../types'
import jsPDF from 'jspdf'

interface Props {
  evaluation: Evaluation
  config: InterviewConfig
  onTryAgain: () => void
}

const RATING_META: Record<HireRating, { color: string; bar: string; bg: string; value: number }> = {
  'Strong Hire':     { color: '#059669', bar: '#10b981', bg: 'rgba(16,185,129,0.08)',  value: 6 },
  'Hire':            { color: '#059669', bar: '#10b981', bg: 'rgba(16,185,129,0.08)',  value: 5 },
  'Leaning Hire':    { color: '#d97706', bar: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  value: 4 },
  'Leaning No Hire': { color: '#ea580c', bar: '#f97316', bg: 'rgba(249,115,22,0.08)', value: 3 },
  'No Hire':         { color: '#dc2626', bar: '#ef4444', bg: 'rgba(239,68,68,0.08)',   value: 2 },
  'Strong No Hire':  { color: '#dc2626', bar: '#ef4444', bg: 'rgba(239,68,68,0.08)',   value: 1 },
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
    add(`${config.interviewType} · ${config.questionCount} questions · ${new Date().toLocaleDateString()}`)
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="min-h-screen px-4 py-12"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="glass p-8 mb-4 text-center"
          style={{ background: recMeta.bg }}>
          <p className="label mb-3">Interview Complete</p>
          <p className="font-semibold text-4xl mb-3 tracking-tight" style={{ color: recMeta.color }}>
            {rec}
          </p>
          <p className="text-stone-600 text-sm max-w-lg mx-auto leading-relaxed">
            {evaluation.overallSummary}
          </p>
        </div>

        {/* Rubric */}
        <div className="glass p-5 mb-4">
          <p className="label mb-4">Evaluation Rubric</p>
          <div className="space-y-5">
            {evaluation.dimensions.map((d) => {
              const m = RATING_META[d.rating as HireRating] ?? RATING_META['Leaning No Hire']
              return (
                <div key={d.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-stone-800">{d.name}</span>
                    <span className="text-xs font-semibold font-mono" style={{ color: m.color }}>{d.rating}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(0,0,0,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(m.value / 6) * 100}%`, background: m.bar }} />
                  </div>
                  <p className="text-stone-500 text-xs leading-relaxed">{d.justification}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Strengths + Improvements */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass p-4">
            <p className="label mb-3" style={{ color: '#059669' }}>Strengths</p>
            <ul className="space-y-2.5">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="text-xs text-stone-700 flex gap-2 leading-relaxed">
                  <span className="text-emerald-500 flex-shrink-0 mt-px">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass p-4">
            <p className="label mb-3" style={{ color: '#d97706' }}>Improve</p>
            <ul className="space-y-2.5">
              {evaluation.improvements.map((s, i) => (
                <li key={i} className="text-xs text-stone-700 flex gap-2 leading-relaxed">
                  <span className="text-amber-500 flex-shrink-0 mt-px">→</span>{s}
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
                <div key={i} className="rounded-xl overflow-hidden"
                  style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.07)' }}>
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full text-left px-4 py-3 flex items-start justify-between gap-4 hover:bg-stone-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-stone-900 font-medium">{item.originalQuestion}</p>
                      <p className="text-xs text-stone-400 mt-0.5">You: {item.candidateAnswer}</p>
                    </div>
                    <span className="text-stone-300 text-xs flex-shrink-0 mt-1">{expanded === i ? '▲' : '▼'}</span>
                  </button>
                  {expanded === i && (
                    <div className="px-4 pb-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      <p className="label mt-3 mb-1.5">Stronger answer</p>
                      <p className="text-stone-600 text-xs leading-relaxed">{item.strongerAnswer}</p>
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
