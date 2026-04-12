const GEMINI_WS = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'

export const onRequestGet: PagesFunction<{ GEMINI_API_KEY: string }> = async ({ request, env }) => {
  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 })
  }

  const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket]
  server.accept()

  let geminiWs: WebSocket | null = null
  let configReceived = false
  const pending: string[] = []

  function connectGemini(systemPrompt: string) {
    geminiWs = new WebSocket(`${GEMINI_WS}?key=${env.GEMINI_API_KEY}`)

    geminiWs.addEventListener('open', () => {
      geminiWs!.send(JSON.stringify({
        setup: {
          model: 'models/gemini-2.5-flash-native-audio-latest',
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          },
          systemInstruction: { parts: [{ text: systemPrompt }] },
        },
      }))
      for (const msg of pending) geminiWs!.send(msg)
      pending.length = 0
    })

    geminiWs.addEventListener('message', async (event) => {
      if (server.readyState !== 1) return
      const data = event.data
      if (data instanceof Blob) {
        // Cloudflare runtime delivers outbound WS messages as Blobs
        server.send(await data.text())
      } else if (data instanceof ArrayBuffer) {
        server.send(new TextDecoder().decode(data))
      } else {
        server.send(data as string)
      }
    })

    geminiWs.addEventListener('close', (e) => {
      if (server.readyState === 1) {
        server.send(JSON.stringify({ type: 'gemini_closed', code: e.code }))
        server.close(1000, 'Gemini closed')
      }
    })

    geminiWs.addEventListener('error', () => {
      if (server.readyState === 1) {
        server.send(JSON.stringify({ type: 'error', message: 'Gemini connection error' }))
      }
    })
  }

  server.addEventListener('message', (event) => {
    const raw = event.data as string
    if (!configReceived) {
      try {
        const msg = JSON.parse(raw) as { type: string; systemPrompt: string }
        if (msg.type === 'config' && msg.systemPrompt) {
          configReceived = true
          connectGemini(msg.systemPrompt)
          return
        }
      } catch { /* ignore */ }
      server.send(JSON.stringify({ type: 'error', message: 'Send {type:"config",systemPrompt:"..."} first' }))
      return
    }
    if (geminiWs?.readyState === 1) {
      geminiWs.send(raw)
    } else if (geminiWs?.readyState === 0) {
      pending.push(raw)
    }
  })

  server.addEventListener('close', () => {
    if (geminiWs?.readyState === 1) geminiWs.close(1000, 'Client disconnected')
  })

  return new Response(null, { status: 101, webSocket: client })
}
