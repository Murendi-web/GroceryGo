// Supabase Edge Function: authenticated, rate-limited proxy to the Anthropic API.
//
// Deploy:   supabase functions deploy ai-chat
// Secrets:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Optional: ANTHROPIC_MODEL (default below), GLOBAL_DAILY_CAP (default 2000 messages per 24h)
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by Supabase automatically.

import { createClient } from 'npm:@supabase/supabase-js@2'

const FREE_DAILY_LIMIT = 15
const PRO_DAILY_LIMIT = 200
const MAX_MESSAGES = 20
const MAX_CONTENT_CHARS = 4000
const MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-5-5'
const GLOBAL_DAILY_CAP = Number(Deno.env.get('GLOBAL_DAILY_CAP') ?? '2000')

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AnthropicBlock {
  type: string
  text?: string
}

interface AnthropicResponse {
  content?: AnthropicBlock[]
  usage?: { input_tokens?: number; output_tokens?: number }
}

const json = (status: number, body: Record<string, unknown>): Response =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

function parseMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_MESSAGES) return null
  const out: ChatMessage[] = []
  for (const m of input) {
    if (typeof m !== 'object' || m === null) return null
    const { role, content } = m as { role?: unknown; content?: unknown }
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null
    if (content.length === 0 || content.length > MAX_CONTENT_CHARS) return null
    out.push({ role, content })
  }
  return out[out.length - 1]?.role === 'user' ? out : null
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!supabaseUrl || !serviceKey || !anthropicKey) return json(500, { error: 'not_configured' })

  // 1. Who is calling? The identity comes from the verified token, never from the request body.
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json(401, { error: 'unauthorized', message: 'Sign in to use the AI features.' })

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const { data: auth, error: authError } = await admin.auth.getUser(token)
  if (authError || !auth.user) return json(401, { error: 'unauthorized', message: 'Your session has expired. Sign in again.' })
  const userId = auth.user.id

  // 2. Validate input.
  let body: { messages?: unknown; system?: unknown }
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'bad_request', message: 'Invalid JSON.' })
  }
  const messages = parseMessages(body.messages)
  if (!messages) return json(400, { error: 'bad_request', message: 'Invalid messages.' })
  const system = typeof body.system === 'string' ? body.system.slice(0, MAX_CONTENT_CHARS) : 'You are GroceryGo, a South African grocery assistant.'

  // 3. Rate limit. The plan comes from the database, so a client cannot claim to be Pro.
  const { data: profile } = await admin.from('profiles').select('is_pro').eq('id', userId).maybeSingle()
  const limit = profile?.is_pro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const mine = await admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', since)
  const used = mine.count ?? 0
  if (used >= limit) {
    return json(429, {
      error: 'rate_limited',
      message: profile?.is_pro ? 'You have used all your AI messages for today.' : `Daily limit of ${limit} AI messages reached. Upgrade to Pro for more.`,
      remaining: 0,
    })
  }

  // Global ceiling protects the API bill if someone mass-creates guest accounts.
  const everyone = await admin.from('ai_usage').select('id', { count: 'exact', head: true }).gte('created_at', since)
  if ((everyone.count ?? 0) >= GLOBAL_DAILY_CAP) {
    return json(503, { error: 'capacity', message: 'The AI is very busy right now. Try again later.' })
  }

  // 4. Call Anthropic.
  let upstream: Response
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 1000, system, messages }),
    })
  } catch (e) {
    console.error('anthropic fetch failed', e)
    return json(502, { error: 'upstream_error', message: 'The AI service is unreachable. Try again.' })
  }
  if (!upstream.ok) {
    console.error('anthropic error', upstream.status, await upstream.text())
    return json(502, { error: 'upstream_error', message: 'The AI service is unavailable right now.' })
  }

  const data = (await upstream.json()) as AnthropicResponse
  const reply = (data.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('')
  if (!reply) return json(502, { error: 'empty_reply', message: 'The AI returned an empty answer. Try again.' })

  // 5. Record usage. The last user message is truncated and kept only for abuse review.
  const tokens = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0)
  const lastUser = messages[messages.length - 1]?.content ?? ''
  const logged = await admin.from('ai_usage').insert({ user_id: userId, tokens_used: tokens, message: lastUser.slice(0, 200) })
  if (logged.error) console.error('usage log failed', logged.error.message)

  return json(200, { reply, remaining: Math.max(0, limit - used - 1) })
})
