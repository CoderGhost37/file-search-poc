import { GoogleGenAI } from '@google/genai'

export function getGoogleAIClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

  if (!apiKey) {
    throw new Error(
      'GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set. ' +
      'Please configure your Google AI API key in the environment variables.'
    )
  }

  return new GoogleGenAI({
    apiKey,
  })
}