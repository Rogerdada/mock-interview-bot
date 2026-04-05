import type { Evaluation, ParsedJd } from '../types'

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? ''

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${WORKER_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? `Request failed: ${res.status}`)
  }

  return res.json() as Promise<T>
}

export async function fetchJobDescriptionFromUrl(url: string): Promise<string> {
  const result = await post<{ text: string }>('/api/fetch-jd', { url })
  return result.text
}

export async function parseJobDescription(text: string): Promise<ParsedJd> {
  return post<ParsedJd>('/api/parse-jd', { text })
}

export async function evaluateInterview(params: {
  transcript: string
  interviewType: string
  role: string
  jobDescription: string
}): Promise<Evaluation> {
  return post<Evaluation>('/api/evaluate', params)
}

export function getWebSocketUrl(): string {
  if (WORKER_URL) {
    return WORKER_URL.replace(/^http/, 'ws') + '/api/ws'
  }
  // Dev: proxy through Vite
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/api/ws`
}
