import Groq from 'groq-sdk'

// Llama 3.1 70B — modelo open source, free tier en Groq
export const MODEL = 'llama-3.1-70b-versatile'

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})
