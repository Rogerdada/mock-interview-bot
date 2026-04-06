export const onRequestPost: PagesFunction<{ GEMINI_API_KEY: string }> = async ({ request }) => {
  try {
    const { url } = await request.json() as { url?: string }
    if (!url?.startsWith('http')) {
      return Response.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MockInterviewBot/1.0)' },
    })
    if (!res.ok) return Response.json({ error: `Fetch failed: ${res.status}` }, { status: 502 })

    const html = await res.text()
    const text = extractText(html)
    return Response.json({ text })
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}

function extractText(html: string): string {
  let t = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|li|h[1-6]|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
  return t.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n').slice(0, 8000)
}
