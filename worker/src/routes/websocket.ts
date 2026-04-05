import { GEMINI_LIVE_WS_URL } from '../utils/gemini'

export async function handleWebSocket(
  request: Request,
  env: { GEMINI_API_KEY: string; ALLOWED_ORIGIN?: string }
): Promise<Response> {
  const upgradeHeader = request.headers.get('Upgrade')
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 })
  }

  const pair = new WebSocketPair()
  const [clientSocket, serverSocket] = Object.values(pair) as [WebSocket, WebSocket]

  serverSocket.accept()

  // State for this connection
  let geminiWs: WebSocket | null = null
  let configReceived = false
  const pendingMessages: string[] = []

  function connectToGemini(systemPrompt: string) {
    const geminiUrl = `${GEMINI_LIVE_WS_URL}?key=${env.GEMINI_API_KEY}`

    try {
      geminiWs = new WebSocket(geminiUrl)
    } catch (err) {
      serverSocket.send(
        JSON.stringify({ type: 'error', message: `Failed to connect to Gemini: ${(err as Error).message}` })
      )
      return
    }

    geminiWs.addEventListener('open', () => {
      // Send setup message with system prompt
      const setupMessage = {
        setup: {
          model: 'models/gemini-2.0-flash-live-001',
          generationConfig: {
            responseModalities: ['AUDIO', 'TEXT'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Kore',
                },
              },
            },
          },
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
        },
      }
      geminiWs!.send(JSON.stringify(setupMessage))

      // Flush any messages buffered before Gemini was ready
      for (const msg of pendingMessages) {
        geminiWs!.send(msg)
      }
      pendingMessages.length = 0
    })

    geminiWs.addEventListener('message', (event) => {
      // Relay Gemini → frontend
      if (serverSocket.readyState === 1 /* OPEN */) {
        serverSocket.send(event.data as string)
      }
    })

    geminiWs.addEventListener('close', (event) => {
      if (serverSocket.readyState === 1 /* OPEN */) {
        serverSocket.send(JSON.stringify({ type: 'gemini_closed', code: event.code }))
        serverSocket.close(1000, 'Gemini connection closed')
      }
    })

    geminiWs.addEventListener('error', () => {
      if (serverSocket.readyState === 1 /* OPEN */) {
        serverSocket.send(JSON.stringify({ type: 'error', message: 'Gemini WebSocket error' }))
      }
    })
  }

  serverSocket.addEventListener('message', (event) => {
    const data = event.data as string

    if (!configReceived) {
      // First message must be the config
      try {
        const msg = JSON.parse(data) as { type: string; systemPrompt: string }
        if (msg.type === 'config' && msg.systemPrompt) {
          configReceived = true
          connectToGemini(msg.systemPrompt)
          return
        }
      } catch {
        // ignore parse errors
      }
      serverSocket.send(
        JSON.stringify({ type: 'error', message: 'First message must be {type:"config", systemPrompt:"..."}' })
      )
      return
    }

    // Relay frontend → Gemini
    if (geminiWs) {
      if (geminiWs.readyState === 1 /* OPEN */) {
        geminiWs.send(data)
      } else if (geminiWs.readyState === 0 /* CONNECTING */) {
        pendingMessages.push(data)
      }
    }
  })

  serverSocket.addEventListener('close', () => {
    if (geminiWs && geminiWs.readyState === 1 /* OPEN */) {
      geminiWs.close(1000, 'Frontend disconnected')
    }
  })

  serverSocket.addEventListener('error', () => {
    if (geminiWs && geminiWs.readyState === 1 /* OPEN */) {
      geminiWs.close(1011, 'Frontend error')
    }
  })

  return new Response(null, {
    status: 101,
    webSocket: clientSocket,
  })
}
