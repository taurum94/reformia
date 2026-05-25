// Llama 3.1 70B — modelo open source, free tier en Groq
export const GROQ_MODEL = 'llama-3.3-70b-versatile'
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
export const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? ''

export interface MensajeChat {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function llamarGroq(mensajes: MensajeChat[]): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: mensajes,
      temperature: 0.3,
      max_tokens: 2048,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error: ${res.status} — ${err}`)
  }

  const data = await res.json()
  return data.choices[0]?.message?.content ?? ''
}
