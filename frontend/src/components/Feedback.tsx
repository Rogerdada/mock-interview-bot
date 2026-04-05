import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Evaluation, HireRating, InterviewConfig } from '../types'
import jsPDF from 'jspdf'

interface Props {
  evaluation: Evaluation
  config: InterviewConfig
  onTryAgain: () => void
}

const RATING_COLORS: Record<HireRating, { bg: string; text: string; border: string; value: number }> = {
  'Strong Hire':     { bg: 'bg-accent/20',   text: 'text-accent',   border: 'border-accent/40',   value: 6 },
  'Hire':            { bg: 'bg-accent/10',   text: 'text-accent',   border: 'border-accent/30',   value: 5 },
  'Leaning Hire':    { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', value: 4 },
  'Leaning No Hire': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', value: 3 },
  'No Hire':         { bg: 'bg-danger/10',   text: 'text-danger',   border: 'border-danger/30',   value: 2 },
  'Strong No Hire':  { bg: 'bg-danger/20',   text: 'text-danger',   border: 'border-danger/40',   value: 1 },
}

function RatingBadge({ rating }: { rating: HireRating }) {
  const c = RATING_COLORS[rating]
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold border ${c.bg} ${c.text} ${c.border}`}
    >
      {rating}
    </span>
  )
}

function RatingBar({ rating }: { rating: HireRating }) {
  const c = RATING_COLORS[rating]
  const pct = (c.value / 6) * 100
  return (
    <div className="w-full bg-bg rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${
          c.value >= 4 ? 'bg-accent' : c.value === 3 ? 'bg-yellow-400' : 'bg-danger'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function Feedback({ evaluation, config, onTryAgain }: Props) {
  const [expandedAnswer, setExpandedAnswer] = useState<number | null>(null)

  function downloadReport() {
    const doc = new jsPDF()
    let y = 20

    doc.setFontSize(18)
    doc.text('Mock Interview Report', 20, y)
    y += 10

    doc.setFontSize(11)
    doc.text(`Role: ${config.parsedJd.role} at ${config.parsedJd.company}`, 20, y)
    y += 6
    doc.text(`Interview Type: ${config.interviewType} | Duration: ${config.duration} min`, 20, y)
    y += 6
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, y)
    y += 12

    doc.setFontSize(14)
    doc.text(`Overall: ${evaluation.overallRecommendation}`, 20, y)
    y += 8
    doc.setFontSize(10)
    const summaryLines = doc.splitTextToSize(evaluation.overallSummary, 170)
    doc.text(summaryLines, 20, y)
    y += summaryLines.length * 5 + 8

    doc.setFontSize(13)
    doc.text('Rubric Scores', 20, y)
    y += 7
    doc.setFontSize(10)
    for (const dim of evaluation.dimensions) {
      doc.setFont('helvetica', 'bold')
      doc.text(`${dim.name}: ${dim.rating}`, 20, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(dim.justification, 170)
      doc.text(lines, 20, y)
      y += lines.length * 5 + 5
    }

    doc.setFontSize(13)
    doc.text('Strengths', 20, y)
    y += 7
    doc.setFontSize(10)
    for (const s of evaluation.strengths) {
      const lines = doc.splitTextToSize(`• ${s}`, 170)
      doc.text(lines, 20, y)
      y += lines.length * 5 + 2
    }

    y += 4
    doc.setFontSize(13)
    doc.text('Areas for Improvement', 20, y)
    y += 7
    doc.setFontSize(10)
    for (const s of evaluation.improvements) {
      const lines = doc.splitTextToSize(`• ${s}`, 170)
      doc.text(lines, 20, y)
      y += lines.length * 5 + 2
    }

    doc.save(`interview-report-${Date.now()}.pdf`)
  }

  const overallColors = RATING_COLORS[evaluation.overallRecommendation]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen px-4 py-12"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="label-mono mb-3">Interview Complete</p>
          <h1 className="font-mono text-3xl font-bold text-text mb-4">Your Feedback</h1>
          <div
            className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border ${overallColors.bg} ${overallColors.border}`}
          >
            <span className="text-muted text-sm">Overall Recommendation</span>
            <span className={`font-mono text-xl font-bold ${overallColors.text}`}>
              {evaluation.overallRecommendation}
            </span>
          </div>
          <p className="text-muted mt-4 max-w-xl mx-auto">{evaluation.overallSummary}</p>
        </div>

        {/* Rubric scorecard */}
        <div className="card p-6 mb-6">
          <p className="label-mono mb-4">Evaluation Rubric</p>
          <div className="grid gap-5">
            {evaluation.dimensions.map((dim) => (
              <div key={dim.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-text text-sm">{dim.name}</span>
                  <RatingBadge rating={dim.rating as HireRating} />
                </div>
                <RatingBar rating={dim.rating as HireRating} />
                <p className="text-muted text-sm mt-2">{dim.justification}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths + Improvements */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="card p-5">
            <p className="label-mono mb-3 text-accent">Strengths</p>
            <ul className="space-y-2">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-text">
                  <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <p className="label-mono mb-3 text-warning">Areas to Improve</p>
            <ul className="space-y-2">
              {evaluation.improvements.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-text">
                  <span className="text-warning mt-0.5 flex-shrink-0">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sample stronger answers */}
        {evaluation.sampleStrongerAnswers?.length > 0 && (
          <div className="card p-6 mb-8">
            <p className="label-mono mb-4">Sample Stronger Answers</p>
            <div className="space-y-4">
              {evaluation.sampleStrongerAnswers.map((item, i) => (
                <div key={i} className="border border-white/5 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedAnswer(expandedAnswer === i ? null : i)}
                    className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-white/3 transition-colors"
                  >
                    <div>
                      <p className="text-text font-medium text-sm">Q: {item.originalQuestion}</p>
                      <p className="text-muted text-xs mt-1">You said: {item.candidateAnswer}</p>
                    </div>
                    <span className="text-muted flex-shrink-0 mt-0.5">
                      {expandedAnswer === i ? '▲' : '▼'}
                    </span>
                  </button>
                  {expandedAnswer === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="px-5 pb-5 border-t border-white/5"
                    >
                      <p className="label-mono mb-2 mt-4">Stronger Answer</p>
                      <p className="text-text text-sm leading-relaxed">{item.strongerAnswer}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button onClick={onTryAgain} className="btn-primary">
            Try Again
          </button>
          <button onClick={downloadReport} className="btn-secondary">
            Download Report (PDF)
          </button>
        </div>
      </div>
    </motion.div>
  )
}
