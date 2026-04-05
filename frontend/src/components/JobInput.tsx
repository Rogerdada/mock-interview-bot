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
      if (!jdText.trim()) {
        setError('Please paste a job description.')
        return
      }
      onContinue(jdText.trim())
      return
    }

    // URL mode
    if (!url.trim()) {
      setError('Please enter a URL.')
      return
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('URL must start with http:// or https://')
      return
    }

    setLoading(true)
    try {
      const text = await fetchJobDescriptionFromUrl(url.trim())
      if (!text || text.length < 50) {
        setError('Could not extract enough text from that URL. Try pasting the JD directly.')
        return
      }
      onContinue(text)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="label-mono mb-3">MockMind</p>
          <h1 className="font-mono text-4xl font-bold text-text mb-3">
            AI Interview Coach
          </h1>
          <p className="text-muted text-lg">
            Paste a job description to start a real-time voice mock interview with AI feedback.
          </p>
        </div>

        <div className="card p-8">
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-bg rounded-xl mb-6 w-fit">
            {(['text', 'url'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null) }}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? 'bg-surface-2 text-text shadow'
                    : 'text-muted hover:text-text'
                }`}
              >
                {m === 'text' ? 'Paste Text' : 'From URL'}
              </button>
            ))}
          </div>

          {mode === 'text' ? (
            <div>
              <label className="label-mono block mb-2">Job Description</label>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the full job description here — role, responsibilities, qualifications, company info..."
                rows={12}
                className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-text
                           placeholder-muted resize-none focus:outline-none focus:border-accent/50
                           transition-colors text-sm leading-relaxed"
              />
              <p className="text-muted text-xs mt-2">
                {jdText.length.toLocaleString()} characters
              </p>
            </div>
          ) : (
            <div>
              <label className="label-mono block mb-2">Job Posting URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                placeholder="https://jobs.lever.co/..."
                className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-text
                           placeholder-muted focus:outline-none focus:border-accent/50
                           transition-colors text-sm"
              />
              <p className="text-muted text-xs mt-2">
                Works with most job boards (LinkedIn, Greenhouse, Lever, Workday, etc.)
              </p>
            </div>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-4 py-3"
            >
              {error}
            </motion.p>
          )}

          <button
            onClick={handleContinue}
            disabled={loading}
            className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner />
                Fetching job description…
              </>
            ) : (
              'Continue →'
            )}
          </button>
        </div>

        <p className="text-center text-muted text-xs mt-6">
          No data is stored. Your session lives only in this browser tab.
        </p>
      </div>
    </motion.div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
