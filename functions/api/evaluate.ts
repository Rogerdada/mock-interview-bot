const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const SYSTEM = `You are a hiring committee reviewer at Google/YouTube. Evaluate the candidate using Google's structured evaluation rubric.
Return ONLY valid JSON (no markdown):
{
  "overallRecommendation": "Strong Hire|Hire|Leaning Hire|Leaning No Hire|No Hire|Strong No Hire",
  "overallSummary": "2-3 sentence summary",
  "dimensions": [
    {"name":"General Cognitive Ability","rating":"...","justification":"2-3 sentences with specific transcript examples"},
    {"name":"Role-Related Knowledge","rating":"...","justification":"..."},
    {"name":"Leadership","rating":"...","justification":"..."},
    {"name":"Googleyness","rating":"...","justification":"..."}
  ],
  "strengths": ["strength with example","..."],
  "improvements": ["actionable improvement","..."],
  "sampleStrongerAnswers": [
    {"originalQuestion":"...","candidateAnswer":"brief summary","strongerAnswer":"what an exceptional candidate would say"}
  ]
}`

export const onRequestPost: PagesFunction<{ GEMINI_API_KEY: string }> = async ({ request, env }) => {
  try {
    const body = await request.json() as {
      transcript?: string; interviewType?: string; role?: string; jobDescription?: string
    }
    if (!body.transcript) return Response.json({ error: 'transcript required' }, { status: 400 })

    const userPrompt = `Interview type: ${body.interviewType ?? 'Behavioral'}
Role: ${body.role ?? 'Unknown'}
Job Description: ${(body.jobDescription ?? '').slice(0, 2000)}

Transcript:
${body.transcript.slice(0, 8000)}`

    const res = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
      }),
    })

    const data = await res.json() as { candidates?: Array<{ content: { parts: Array<{ text: string }> } }> }
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
    return Response.json(JSON.parse(raw))
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}
