// Runs the real Edge Function with an in-process fake of Supabase + Anthropic.
type Handler = (req: Request) => Promise<Response> | Response
let handler: Handler | null = null
;(Deno as unknown as { serve: (h: Handler) => object }).serve = (h) => {
  handler = h
  return {}
}

const state = { isPro: false, mineCount: 0, globalCount: 0, anthropicStatus: 200, inserted: [] as Record<string, unknown>[], anthropicCalls: 0, lastAnthropicBody: null as Record<string, unknown> | null }

const realFetch = globalThis.fetch
globalThis.fetch = (async (input: Request | URL | string, init?: RequestInit) => {
  const req = new Request(input as Request, init)
  const url = new URL(req.url)
  const j = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })

  if (url.hostname === 'api.anthropic.com') {
    state.anthropicCalls++
    state.lastAnthropicBody = JSON.parse(await req.text())
    if (state.anthropicStatus !== 200) return new Response('boom', { status: state.anthropicStatus })
    return j({ content: [{ type: 'text', text: 'Shoprite is cheapest.' }], usage: { input_tokens: 40, output_tokens: 12 } })
  }
  if (url.pathname === '/auth/v1/user') {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    return token === 'good' ? j({ id: 'user-1', aud: 'authenticated', email: 'a@x.co' }) : j({ msg: 'bad jwt' }, 401)
  }
  if (url.pathname === '/rest/v1/profiles') {
    const single = (req.headers.get('accept') ?? '').includes('vnd.pgrst.object')
    return single ? j({ is_pro: state.isPro }) : j([{ is_pro: state.isPro }])
  }
  if (url.pathname === '/rest/v1/ai_usage') {
    if (req.method === 'HEAD') {
      const mine = url.searchParams.has('user_id')
      return new Response(null, { status: 200, headers: { 'content-range': `*/${mine ? state.mineCount : state.globalCount}` } })
    }
    if (req.method === 'POST') {
      state.inserted.push(JSON.parse(await req.text()))
      return new Response(null, { status: 201 })
    }
  }
  return realFetch(input as Request, init)
}) as typeof fetch

Deno.env.set('SUPABASE_URL', 'http://fake.supabase.local')
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service')
Deno.env.set('ANTHROPIC_API_KEY', 'sk-test')
Deno.env.set('GLOBAL_DAILY_CAP', '100')
await import('../functions/ai-chat/index.ts')
if (!handler) throw new Error('handler not captured')

let fails = 0
const check = (name: string, ok: boolean, detail = '') => {
  if (!ok) fails++
  console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : detail)
}
const reset = () => Object.assign(state, { isPro: false, mineCount: 0, globalCount: 0, anthropicStatus: 200, inserted: [], anthropicCalls: 0, lastAnthropicBody: null })
const call = async (opts: { token?: string; method?: string; body?: unknown; raw?: string } = {}) => {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (opts.token) headers.authorization = `Bearer ${opts.token}`
  const res = await handler!(new Request('http://fn/ai-chat', { method: opts.method ?? 'POST', headers, body: opts.raw ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)) }))
  const text = await res.text()
  let body: Record<string, unknown> = {}
  try { body = JSON.parse(text) } catch { /* non-json */ }
  return { status: res.status, body, res }
}
const good = { messages: [{ role: 'user', content: 'cheapest chicken?' }], system: 'You are GroceryGo.' }

reset(); let r = await call({ method: 'OPTIONS' })
check('OPTIONS preflight 200 + CORS', r.status === 200 && r.res.headers.get('access-control-allow-origin') === '*')
r = await call({ method: 'GET' }); check('GET rejected 405', r.status === 405)
r = await call({ body: good }); check('no token -> 401', r.status === 401 && state.anthropicCalls === 0)
r = await call({ token: 'forged', body: good }); check('bad token -> 401, Anthropic never called', r.status === 401 && state.anthropicCalls === 0)
r = await call({ token: 'good', raw: 'not json' }); check('malformed JSON -> 400', r.status === 400)
r = await call({ token: 'good', body: { messages: [] } }); check('empty messages -> 400', r.status === 400)
r = await call({ token: 'good', body: { messages: [{ role: 'system', content: 'x' }] } }); check('role "system" injected -> 400', r.status === 400)
r = await call({ token: 'good', body: { messages: [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }] } }); check('last message must be user -> 400', r.status === 400)
r = await call({ token: 'good', body: { messages: [{ role: 'user', content: 'x'.repeat(4001) }] } }); check('oversized message -> 400', r.status === 400)
r = await call({ token: 'good', body: { messages: Array.from({ length: 21 }, () => ({ role: 'user', content: 'x' })) } }); check('21 messages -> 400', r.status === 400)
check('no rejected request reached Anthropic', state.anthropicCalls === 0)

reset(); r = await call({ token: 'good', body: good })
check('valid request -> 200 with reply', r.status === 200 && r.body.reply === 'Shoprite is cheapest.', JSON.stringify(r.body))
check('free user remaining = 14', r.body.remaining === 14, String(r.body.remaining))
check('usage logged once with tokens=52', state.inserted.length === 1 && state.inserted[0]?.tokens_used === 52 && state.inserted[0]?.user_id === 'user-1', JSON.stringify(state.inserted))
check('model + system forwarded', state.lastAnthropicBody?.system === 'You are GroceryGo.' && typeof state.lastAnthropicBody?.model === 'string')
check('default model is claude-sonnet-5-5', state.lastAnthropicBody?.model === 'claude-sonnet-5-5', String(state.lastAnthropicBody?.model))

reset(); r = await call({ token: 'good', body: { ...good, userId: 'someone-else', isPro: true } })
check('body userId/isPro ignored: still logged as token user', r.status === 200 && state.inserted[0]?.user_id === 'user-1' && r.body.remaining === 14)

reset(); state.mineCount = 15; r = await call({ token: 'good', body: good })
check('free user at 15 -> 429, Anthropic not called', r.status === 429 && r.body.remaining === 0 && state.anthropicCalls === 0 && state.inserted.length === 0)
reset(); state.mineCount = 14; r = await call({ token: 'good', body: good })
check('free user at 14 -> last message allowed, remaining 0', r.status === 200 && r.body.remaining === 0)
reset(); state.isPro = true; state.mineCount = 15; r = await call({ token: 'good', body: good })
check('pro user at 15 still allowed (limit 200)', r.status === 200 && r.body.remaining === 184, JSON.stringify(r.body))
reset(); state.isPro = true; state.mineCount = 200; r = await call({ token: 'good', body: good })
check('pro user at 200 -> 429', r.status === 429)
reset(); state.globalCount = 100; r = await call({ token: 'good', body: good })
check('global cap hit -> 503, Anthropic not called', r.status === 503 && state.anthropicCalls === 0)
reset(); state.anthropicStatus = 500; r = await call({ token: 'good', body: good })
check('Anthropic 500 -> 502, no usage charged', r.status === 502 && state.inserted.length === 0)
check('upstream detail not leaked to client', !JSON.stringify(r.body).includes('boom'))

console.log(fails === 0 ? '\nALL PASSED' : `\n${fails} FAILED`)
Deno.exit(fails === 0 ? 0 : 1)
