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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="min-h-screen flex items-center justify-center px-4"
    >
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-emerald-400 text-sm font-mono font-bold">M</span>
            </div>
            <span className="font-mono text-sm font-bold text-zinc-300">MockMind</span>
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
            Practice your interview
          </h1>
          <p className="text-zinc-400 text-sm">
            Real-time voice mock interview with AI feedback
          </p>
        </div>

        <div className="glass p-6">
          {/* Mode tabs */}
          <div className="flex gap-1 mb-5 p-1 bg-white/[0.03] rounded-lg w-fit">
            {(['text', 'url'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null) }}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === m ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
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
            <p className="mt-3 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
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

        <p className="text-center text-zinc-600 text-xs mt-5">
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
