const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent'

/** Build a minimal WAV file from raw s16le PCM chunks (24 kHz, mono) */
function buildWav(chunks: string[]): string {
  const enc = new TextEncoder()

  // Decode each base64 chunk to bytes
  const bufs = chunks.map((b64) => {
    const bin = atob(b64)
    const arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    return arr
  })

  const pcmLen = bufs.reduce((s, b) => s + b.length, 0)
  const wav = new Uint8Array(44 + pcmLen)
  const view = new DataView(wav.buffer)

  // RIFF / WAV header
  wav.set(enc.encode('RIFF'), 0)
  view.setUint32(4, 36 + pcmLen, true)
  wav.set(enc.encode('WAVE'), 8)
  wav.set(enc.encode('fmt '), 12)
  view.setUint32(16, 16, true)      // chunk size
  view.setUint16(20, 1, true)       // PCM format
  view.setUint16(22, 1, true)       // mono
  view.setUint32(24, 24000, true)   // sample rate
  view.setUint32(28, 48000, true)   // byte rate (24000 * 1 * 2)
  view.setUint16(32, 2, true)       // block align
  view.setUint16(34, 16, true)      // bits per sample
  wav.set(enc.encode('data'), 36)
  view.setUint32(40, pcmLen, true)

  let offset = 44
  for (const buf of bufs) { wav.set(buf, offset); offset += buf.length }

  // Base64-encode the WAV
  let bin = ''
  for (const byte of wav) bin += String.fromCharCode(byte)
  return btoa(bin)
}

export const onRequestPost: PagesFunction<{ GEMINI_API_KEY: string }> = async ({ request, env }) => {
  try {
    const { chunks } = await request.json() as { chunks: string[] }
    if (!chunks?.length) return Response.json({ text: '' })

    const wavBase64 = buildWav(chunks)

    const res = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: 'Transcribe exactly what is spoken in this audio clip. Return only the spoken words with no commentary, labels, or extra text.' },
            { inlineData: { mimeType: 'audio/wav', data: wavBase64 } },
          ],
        }],
        generationConfig: { temperature: 0 },
      }),
    })

    const data = await res.json() as { candidates?: Array<{ content: { parts: Array<{ text: string }> } }> }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return Response.json({ text: text.trim() })
  } catch (err) {
    return Response.json({ text: '', error: (err as Error).message })
  }
}
