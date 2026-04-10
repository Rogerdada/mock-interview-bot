export type Screen = 'job-input' | 'config' | 'session' | 'feedback'

export type InterviewType = 'behavioral' | 'case-study' | 'company-knowledge'

export type InterviewQuestionCount = 3 | 5 | 8

export interface ParsedJd {
  company: string
  role: string
  keyCompetencies: string[]
}

export interface InterviewConfig {
  jobDescription: string
  parsedJd: ParsedJd
  interviewType: InterviewType
  questionCount: InterviewQuestionCount
}

export interface TranscriptEntry {
  speaker: 'interviewer' | 'candidate'
  text: string
  timestamp: number
}

export type HireRating =
  | 'Strong Hire'
  | 'Hire'
  | 'Leaning Hire'
  | 'Leaning No Hire'
  | 'No Hire'
  | 'Strong No Hire'

export interface EvaluationDimension {
  name: string
  rating: HireRating
  justification: string
}

export interface SampleAnswer {
  originalQuestion: string
  candidateAnswer: string
  strongerAnswer: string
}

export interface Evaluation {
  overallRecommendation: HireRating
  overallSummary: string
  dimensions: EvaluationDimension[]
  strengths: string[]
  improvements: string[]
  sampleStrongerAnswers: SampleAnswer[]
}

// Gemini Multimodal Live API message types
export interface GeminiSetupMessage {
  setup: {
    model: string
    generationConfig: {
      responseModalities: string[]
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: string }
        }
      }
      outputAudioTranscription?: Record<string, never>
    }
    systemInstruction: {
      parts: Array<{ text: string }>
    }
  }
}

export interface GeminiAudioChunk {
  realtimeInput: {
    mediaChunks: Array<{
      mimeType: string
      data: string
    }>
  }
}

export interface GeminiServerContent {
  serverContent?: {
    modelTurn?: {
      parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      >
    }
    outputTranscription?: { text: string }
    turnComplete?: boolean
    interrupted?: boolean
  }
  setupComplete?: Record<string, unknown>
}
