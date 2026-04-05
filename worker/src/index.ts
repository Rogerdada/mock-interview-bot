import { corsHeaders } from './utils/gemini'
import { handleFetchJd } from './routes/fetchJd'
import { handleParseJd } from './routes/parseJd'
import { handleEvaluate } from './routes/evaluate'
import { handleWebSocket } from './routes/websocket'

export interface Env {
  GEMINI_API_KEY: string
  ALLOWED_ORIGIN?: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')
    const allowed = env.ALLOWED_ORIGIN ?? '*'

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin, allowed),
      })
    }

    // Route requests
    const path = url.pathname

    if (path === '/api/fetch-jd' && request.method === 'POST') {
      return handleFetchJd(request, env)
    }

    if (path === '/api/parse-jd' && request.method === 'POST') {
      return handleParseJd(request, env)
    }

    if (path === '/api/evaluate' && request.method === 'POST') {
      return handleEvaluate(request, env)
    }

    if (path === '/api/ws') {
      return handleWebSocket(request, env)
    }

    // Health check
    if (path === '/' || path === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, allowed) },
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, allowed) },
    })
  },
}
