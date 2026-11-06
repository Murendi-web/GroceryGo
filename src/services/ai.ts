import type { ChatMessage } from '../types'
import { supabase } from './supabase'

const AI_URL = process.env.EXPO_PUBLIC_AI_URL ?? ''
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

export class AIError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AIError'
  }
}

export interface AIResult {
  reply: string
  /** Messages left today, as reported by the server. */
  remaining: number | null
}

interface AIResponseBody {
  reply?: string
  remaining?: number
  error?: string
  message?: string
}

/**
 * Sends a conversation to the ai-chat Edge Function.
 * The Anthropic key lives on the server. It must never ship inside the app.
 */
export async function askAI(messages: ChatMessage[], system: string): Promise<AIResult> {
  if (!AI_URL || !supabase) {
    throw new AIError('AI is not set up. Add EXPO_PUBLIC_AI_URL and Supabase keys to your .env file.')
  }
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new AIError('Sign in to use the AI features.')

  let res: Response
  try {
    res = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify({ messages, system }),
    })
  } catch {
    throw new AIError('No connection. Check your internet and try again.')
  }

  let body: AIResponseBody = {}
  try {
    body = (await res.json()) as AIResponseBody
  } catch {
    // fall through to the status check
  }
  if (res.status === 429) throw new AIError(body.message ?? 'Daily AI limit reached.')
  if (!res.ok || !body.reply) throw new AIError(body.message ?? body.error ?? 'The AI request failed.')
  return { reply: body.reply, remaining: typeof body.remaining === 'number' ? body.remaining : null }
}
