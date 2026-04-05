import { callGeminiRest, corsHeaders } from '../utils/gemini'

export async function handleParseJd(
  request: Request,
  env: { GEMINI_API_KEY: string; ALLOWED_ORIGIN?: string }
): Promise<Response> {
  const origin = request.headers.get('Origin')
  const allowed = env.ALLOWED_ORIGIN ?? '*'
  const headers = { ...corsHeaders(origin, allowed), 'Content-Type': 'application/json' }

  try {
    const body = (await request.json()) as { text?: string }
    if (!body.text) {
      return new Response(JSON.stringify({ error: 'text is required' }), { status: 400, headers })
    }

    const prompt = `Extract the following information from this job description and return ONLY valid JSON (no markdown, no backticks):
{
  "company": "company name or 'Unknown Company'",
  "role": "job title or 'Unknown Role'",
  "keyCompetencies": ["competency 1", "competency 2", "competency 3", "competency 4", "competency 5"]
}

Job Description:
${body.text.slice(0, 4000)}`

    const raw = await callGeminiRest(env.GEMINI_API_KEY, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
    })

    // Parse and validate
    const parsed = JSON.parse(raw) as {
      company: string
      role: string
      keyCompetencies: string[]
    }

    return new Response(JSON.stringify(parsed), { status: 200, headers })
  } catch (err) {
    // Fallback if parse fails
    return new Response(
      JSON.stringify({ company: 'Unknown Company', role: 'Unknown Role', keyCompetencies: [] }),
      { status: 200, headers }
    )
  }
}
