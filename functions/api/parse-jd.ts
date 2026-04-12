const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent'

export const onRequestPost: PagesFunction<{ GEMINI_API_KEY: string }> = async ({ request, env }) => {
  try {
    const { text } = await request.json() as { text?: string }
    if (!text) return Response.json({ error: 'text is required' }, { status: 400 })

    const prompt = `Extract from this job description and return ONLY valid JSON, no markdown:
{"company":"company name","role":"job title","keyCompetencies":["skill1","skill2","skill3","skill4","skill5"]}

Job Description:
${text.slice(0, 4000)}`

    const res = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
    })

    const data = await res.json() as { candidates?: Array<{ content: { parts: Array<{ text: string }> } }> }
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
    return Response.json(JSON.parse(raw))
  } catch {
    return Response.json({ company: 'Unknown Company', role: 'Unknown Role', keyCompetencies: [] })
  }
}
