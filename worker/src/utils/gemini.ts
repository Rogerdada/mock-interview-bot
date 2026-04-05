export const GEMINI_REST_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

export const GEMINI_LIVE_WS_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'

export interface GeminiTextRequest {
  contents: Array<{
    role: 'user' | 'model'
    parts: Array<{ text: string }>
  }>
  generationConfig?: {
    responseMimeType?: string
    temperature?: number
  }
  systemInstruction?: {
    parts: Array<{ text: string }>
  }
}

export async function callGeminiRest(
  apiKey: string,
  body: GeminiTextRequest
): Promise<string> {
  const res = await fetch(`${GEMINI_REST_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini REST error ${res.status}: ${err}`)
  }

  const data = (await res.json()) as {
    candidates: Array<{
      content: { parts: Array<{ text: string }> }
    }>
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export function corsHeaders(origin: string | null, allowedOrigin: string) {
  const allowed =
    origin === allowedOrigin || allowedOrigin === '*' ? origin ?? '*' : allowedOrigin
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
