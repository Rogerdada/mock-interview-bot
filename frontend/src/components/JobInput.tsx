import { useState } from 'react'
import { motion } from 'framer-motion'
import { fetchJobDescriptionFromUrl } from '../lib/api'

interface Props {
  onContinue: (jobDescription: string) => void
}

export function JobInput({ onContinue }: Props) {
  const [mode, setMode] = useState<'text' | 'url'>('text')
  const [jdText, setJdText] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleContinue() {
    setError(null)
    if (mode === 'text') {
      if (!jdText.trim()) { setError('Paste a job description to continue.'); return }
      onContinue(jdText.trim())
      return
    }
    if (!url.trim() || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      setError('Enter a valid URL starting with https://')
      return
    }
    setLoading(true)
    try {
      const text = await fetchJobDescriptionFromUrl(url.trim())
      if (!text || text.length < 50) { setError("Couldn't extract enough text. Try pasting the JD directly."); return }
      onContinue(text)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="min-h-screen flex items-center justify-center px-4"
    >
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-7">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center"
              style={{ boxShadow: '0 2px 8px rgba(16,185,129,0.35)' }}>
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <span className="text-sm font-semibold text-stone-700 tracking-tight">MockMind</span>
          </div>
          <h1 className="text-[2rem] font-semibold text-stone-900 tracking-tight leading-tight mb-3">
            Practice your interview
          </h1>
          <p className="text-stone-500 text-[0.9375rem]">
            Real-time voice mock interview with AI feedback
          </p>
        </div>

        <div className="glass p-6">
          {/* Mode tabs */}
          <div className="flex gap-1 mb-5 p-1 rounded-lg w-fit" style={{ background: 'rgba(0,0,0,0.04)' }}>
            {(['text', 'url'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null) }}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                  mode === m
                    ? 'bg-white text-stone-800 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {m === 'text' ? 'Paste text' : 'From URL'}
              </button>
            ))}
          </div>

          {mode === 'text' ? (
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full job description here…"
              rows={10}
              className="input-base resize-none leading-relaxed"
            />
          ) : (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
              placeholder="https://jobs.lever.co/…"
              className="input-base"
            />
          )}

          {error && (
            <p className="mt-3 text-red-600 text-xs rounded-lg px-3 py-2"
              style={{ background: 'rgba(239,68,68,0.06)', boxShadow: '0 0 0 1px rgba(239,68,68,0.12)' }}>
              {error}
            </p>
          )}

          <button
            onClick={handleContinue}
            disabled={loading}
            className="btn-green w-full mt-4"
          >
            {loading ? <Spinner /> : null}
            {loading ? 'Fetching…' : 'Continue'}
          </button>
        </div>

        <p className="text-center text-stone-400 text-xs mt-5">
          Nothing is stored — session stays in your browser only
        </p>
      </div>
    </motion.div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
