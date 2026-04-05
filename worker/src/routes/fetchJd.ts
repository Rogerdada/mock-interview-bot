import { corsHeaders } from '../utils/gemini'

export async function handleFetchJd(
  request: Request,
  env: { ALLOWED_ORIGIN?: string }
): Promise<Response> {
  const origin = request.headers.get('Origin')
  const allowed = env.ALLOWED_ORIGIN ?? '*'
  const headers = { ...corsHeaders(origin, allowed), 'Content-Type': 'application/json' }

  try {
    const body = (await request.json()) as { url?: string }
    if (!body.url) {
      return new Response(JSON.stringify({ error: 'url is required' }), { status: 400, headers })
    }

    const url = body.url.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400, headers })
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; MockInterviewBot/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${res.status}` }),
        { status: 502, headers }
      )
    }

    const html = await res.text()
    const text = extractTextFromHtml(html)

    return new Response(JSON.stringify({ text }), { status: 200, headers })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Failed to fetch: ${(err as Error).message}` }),
      { status: 500, headers }
    )
  }
}

function extractTextFromHtml(html: string): string {
  // Remove script, style, nav, footer, header blocks
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')

  // Replace block elements with newlines
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|li|h[1-6]|section|article|main)[^>]*>/gi, '\n')

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')

  // Collapse whitespace but preserve paragraph breaks
  text = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')

  // Limit to 8000 chars to stay within Gemini context
  return text.slice(0, 8000)
}
