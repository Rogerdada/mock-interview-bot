import { callGeminiRest, corsHeaders } from '../utils/gemini'

const EVALUATOR_SYSTEM_PROMPT = `You are a hiring committee reviewer at Google/YouTube. You have just reviewed a mock interview transcript. Evaluate the candidate using Google's structured evaluation rubric.

Provide your evaluation ONLY as valid JSON (no markdown fences, no explanation outside the JSON). Use exactly this schema:
{
  "overallRecommendation": "Strong Hire" | "Hire" | "Leaning Hire" | "Leaning No Hire" | "No Hire" | "Strong No Hire",
  "overallSummary": "2-3 sentence summary",
  "dimensions": [
    {
      "name": "General Cognitive Ability",
      "rating": "Strong Hire" | "Hire" | "Leaning Hire" | "Leaning No Hire" | "No Hire" | "Strong No Hire",
      "justification": "2-3 sentences with specific examples from the transcript"
    },
    {
      "name": "Role-Related Knowledge",
      "rating": "...",
      "justification": "..."
    },
    {
      "name": "Leadership",
      "rating": "...",
      "justification": "..."
    },
    {
      "name": "Googleyness",
      "rating": "...",
      "justification": "..."
    }
  ],
  "strengths": ["strength with specific example", "strength 2", "strength 3"],
  "improvements": ["actionable improvement 1", "actionable improvement 2", "actionable improvement 3"],
  "sampleStrongerAnswers": [
    {
      "originalQuestion": "the question asked",
      "candidateAnswer": "brief summary of what the candidate said",
      "strongerAnswer": "what an exceptional candidate would have said, with specifics"
    }
  ]
}`

export async function handleEvaluate(
  request: Request,
  env: { GEMINI_API_KEY: string; ALLOWED_ORIGIN?: string }
): Promise<Response> {
  const origin = request.headers.get('Origin')
  const allowed = env.ALLOWED_ORIGIN ?? '*'
  const headers = { ...corsHeaders(origin, allowed), 'Content-Type': 'application/json' }

  try {
    const body = (await request.json()) as {
      transcript?: string
      interviewType?: string
      role?: string
      jobDescription?: string
    }

    if (!body.transcript) {
      return new Response(JSON.stringify({ error: 'transcript is required' }), {
        status: 400,
        headers,
      })
    }

    const userPrompt = `Interview type: ${body.interviewType ?? 'Behavioral'}
Role: ${body.role ?? 'Unknown Role'}
Job Description: ${(body.jobDescription ?? '').slice(0, 2000)}

Transcript:
${body.transcript.slice(0, 8000)}`

    const raw = await callGeminiRest(env.GEMINI_API_KEY, {
      systemInstruction: { parts: [{ text: EVALUATOR_SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
    })

    const evaluation = JSON.parse(raw)
    return new Response(JSON.stringify(evaluation), { status: 200, headers })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Evaluation failed: ${(err as Error).message}` }),
      { status: 500, headers }
    )
  }
}
