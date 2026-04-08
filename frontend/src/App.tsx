import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { JobInput } from './components/JobInput'
import { InterviewConfig } from './components/InterviewConfig'
import { VoiceSession } from './components/VoiceSession'
import { Feedback } from './components/Feedback'
import { parseJobDescription, evaluateInterview } from './lib/api'
import type {
  Screen,
  InterviewType,
  InterviewDuration,
  ParsedJd,
  Evaluation,
  TranscriptEntry,
} from './types'

interface AppState {
  screen: Screen
  jobDescription: string
  parsedJd: ParsedJd | null
  interviewType: InterviewType
  duration: InterviewDuration
  evaluation: Evaluation | null
  evaluating: boolean
  evaluationError: string | null
}

const DEFAULT_STATE: AppState = {
  screen: 'job-input',
  jobDescription: '',
  parsedJd: null,
  interviewType: 'behavioral',
  duration: 10,
  evaluation: null,
  evaluating: false,
  evaluationError: null,
}

export default function App() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE)

  function patch(updates: Partial<AppState>) {
    setState((s) => ({ ...s, ...updates }))
  }

  // Screen 1 → Screen 2: parse JD
  async function handleJobInput(jobDescription: string) {
    patch({ jobDescription, screen: 'config', parsedJd: null })
    try {
      const raw = await parseJobDescription(jobDescription)
      // Ensure all fields exist even if API returns partial data
      patch({
        parsedJd: {
          company: raw.company || 'Unknown Company',
          role: raw.role || 'Unknown Role',
          keyCompetencies: Array.isArray(raw.keyCompetencies) ? raw.keyCompetencies : [],
        },
      })
    } catch {
      patch({ parsedJd: { company: 'Unknown Company', role: 'Unknown Role', keyCompetencies: [] } })
    }
  }

  // Screen 2 → Screen 3: start session
  function handleStartInterview(type: InterviewType, duration: InterviewDuration) {
    patch({ interviewType: type, duration, screen: 'session' })
  }

  // Screen 3 → Screen 4: evaluate
  async function handleSessionEnd(transcript: TranscriptEntry[]) {
    patch({ screen: 'feedback', evaluating: true, evaluationError: null })

    const transcriptText = transcript
      .map((e) => `${e.speaker === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${e.text}`)
      .join('\n')

    try {
      const evaluation = await evaluateInterview({
        transcript: transcriptText || 'No transcript available.',
        interviewType: state.interviewType,
        role: state.parsedJd?.role ?? 'Unknown Role',
        jobDescription: state.jobDescription,
      })
      patch({ evaluation, evaluating: false })
    } catch (err) {
      patch({
        evaluating: false,
        evaluationError: (err as Error).message,
      })
    }
  }

  // Reset
  function handleTryAgain() {
    setState(DEFAULT_STATE)
  }

  // Placeholder ParsedJd while loading
  const parsedJd: ParsedJd = state.parsedJd ?? {
    company: 'Loading…',
    role: 'Loading…',
    keyCompetencies: [],
  }

  return (
    <div className="min-h-screen text-stone-900 font-sans" style={{ background: '#f9f8f6' }}>
      <AnimatePresence mode="wait">
        {state.screen === 'job-input' && (
          <JobInput key="job-input" onContinue={handleJobInput} />
        )}

        {state.screen === 'config' && (
          <InterviewConfig
            key="config"
            jobDescription={state.jobDescription}
            parsedJd={parsedJd}
            onStart={handleStartInterview}
            onBack={() => patch({ screen: 'job-input' })}
          />
        )}

        {state.screen === 'session' && state.parsedJd && (
          <VoiceSession
            key="session"
            config={{
              jobDescription: state.jobDescription,
              parsedJd: state.parsedJd,
              interviewType: state.interviewType,
              duration: state.duration,
            }}
            onEnd={handleSessionEnd}
          />
        )}

        {state.screen === 'feedback' && (
          <div key="feedback">
            {state.evaluating ? (
              <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <div className="w-14 h-14 rounded-full border-2 border-emerald-200 border-t-emerald-500 animate-spin" />
                <p className="font-mono text-stone-500">Generating your evaluation…</p>
                <p className="text-stone-400 text-sm">Using Google's hiring rubric</p>
              </div>
            ) : state.evaluationError ? (
              <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
                <p className="text-red-600 text-lg font-semibold">Evaluation Failed</p>
                <p className="text-stone-500 text-sm text-center max-w-md">{state.evaluationError}</p>
                <button onClick={handleTryAgain} className="btn-ghost mt-4">
                  Try Again
                </button>
              </div>
            ) : state.evaluation ? (
              <Feedback
                evaluation={state.evaluation}
                config={{
                  jobDescription: state.jobDescription,
                  parsedJd: state.parsedJd ?? parsedJd,
                  interviewType: state.interviewType,
                  duration: state.duration,
                }}
                onTryAgain={handleTryAgain}
              />
            ) : null}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
