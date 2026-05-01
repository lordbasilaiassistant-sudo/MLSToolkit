import { dbg } from './debug'

export type AIBackend = 'window-ai' | 'pollinations' | 'unavailable'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GenerateOptions {
  system?: string
  user: string
  messages?: AIMessage[]
  signal?: AbortSignal
  model?: string
  /** Called on each retry/queue update so UI can render status. */
  onStatus?: (status: string) => void
}

export interface AIStatus {
  backend: AIBackend
  ready: boolean
  reason?: string
}

interface WindowWithAI extends Window {
  ai?: {
    assistant?: {
      capabilities(): Promise<{ available: 'readily' | 'after-download' | 'no' }>
      create(opts?: { systemPrompt?: string }): Promise<{
        prompt(text: string, opts?: { signal?: AbortSignal }): Promise<string>
        destroy?(): void
      }>
    }
    languageModel?: {
      capabilities(): Promise<{ available: 'readily' | 'after-download' | 'no' }>
      create(opts?: { systemPrompt?: string }): Promise<{
        prompt(text: string, opts?: { signal?: AbortSignal }): Promise<string>
        destroy?(): void
      }>
    }
  }
}

let cachedStatus: AIStatus | null = null

async function probeWindowAI(): Promise<AIStatus | null> {
  if (typeof window === 'undefined') return null
  const w = window as WindowWithAI
  const api = w.ai?.assistant ?? w.ai?.languageModel
  if (!api) return null
  try {
    const caps = await api.capabilities()
    if (caps.available === 'readily') {
      return { backend: 'window-ai', ready: true }
    }
    if (caps.available === 'after-download') {
      return { backend: 'window-ai', ready: false, reason: 'On-device model needs to download first.' }
    }
    return null
  } catch (err) {
    dbg.warn('ai', 'window.ai probe failed', { err: String(err) })
    return null
  }
}

export async function getStatus(): Promise<AIStatus> {
  if (cachedStatus) return cachedStatus
  const local = await probeWindowAI()
  if (local) {
    cachedStatus = local
    dbg.ai('ai', `backend: ${local.backend}`, local)
    return local
  }
  cachedStatus = { backend: 'pollinations', ready: true, reason: 'Using free public endpoint (Pollinations). Calls leave your browser.' }
  dbg.ai('ai', 'backend: pollinations (fallback)', cachedStatus)
  return cachedStatus
}

export function resetStatus() {
  cachedStatus = null
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider: window.ai (Chrome on-device Gemini Nano)
// ─────────────────────────────────────────────────────────────────────────────

async function generateWindowAI(opts: GenerateOptions): Promise<string> {
  const w = window as WindowWithAI
  const api = w.ai?.assistant ?? w.ai?.languageModel
  if (!api) throw new Error('window.ai not available')
  const session = await api.create({ systemPrompt: opts.system })
  try {
    return await session.prompt(opts.user, { signal: opts.signal })
  } finally {
    session.destroy?.()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider: Pollinations text endpoint (anonymous, GET, no preflight)
// ─────────────────────────────────────────────────────────────────────────────

const POLLINATIONS_GET = 'https://text.pollinations.ai/'
const MAX_PROMPT_CHARS = 5500
const MAX_SYSTEM_CHARS = 1200

function flattenForGet(opts: GenerateOptions): { prompt: string; system?: string } {
  const parts: string[] = []
  if (opts.messages?.length) {
    for (const m of opts.messages) {
      parts.push(`${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    }
  }
  parts.push(`User: ${opts.user}`)
  let prompt = parts.join('\n\n')
  if (prompt.length > MAX_PROMPT_CHARS) prompt = '…[earlier messages trimmed]…\n\n' + prompt.slice(-MAX_PROMPT_CHARS)
  let system = opts.system
  if (system && system.length > MAX_SYSTEM_CHARS) {
    system = system.slice(0, MAX_SYSTEM_CHARS) + '\n…[context trimmed]'
  }
  return { prompt, system }
}

function buildPollinationsUrl(opts: GenerateOptions, model: string): string {
  const { prompt, system } = flattenForGet(opts)
  const params = new URLSearchParams({ model, referrer: 'mlstoolkit' })
  if (system) params.set('system', system)
  return `${POLLINATIONS_GET}${encodeURIComponent(prompt)}?${params.toString()}`
}

class TransientError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'TransientError'
  }
}

function isRateLimitedResponse(text: string): boolean {
  if (text.startsWith('{') && text.includes('Queue full')) return true
  if (text.startsWith('{') && text.includes('"status":429')) return true
  if (text.includes('IMPORTANT NOTICE') && text.includes('legacy text API')) return true
  return false
}

async function fetchPollinationsOnce(url: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(url, { method: 'GET', signal })
  const text = (await res.text()).trim()
  if (res.status === 429) throw new TransientError('rate limit (HTTP 429)')
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    throw new TransientError(`upstream ${res.status}`)
  }
  if (!res.ok) throw new Error(`AI returned HTTP ${res.status}`)
  if (!text) throw new TransientError('empty response')
  if (isRateLimitedResponse(text)) throw new TransientError('rate limit (queue full)')
  return text
}

const POLLINATIONS_MODELS = ['openai-fast', 'openai']

async function generatePollinations(opts: GenerateOptions): Promise<string> {
  const RETRY_DELAYS = [1500, 3000, 6000, 10000]
  let lastErr: unknown = null
  let modelIdx = 0
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    const model = POLLINATIONS_MODELS[modelIdx]
    const url = buildPollinationsUrl(opts, model)
    try {
      const text = await fetchPollinationsOnce(url, opts.signal)
      if (attempt > 0) dbg.info('ai', `pollinations succeeded on attempt ${attempt + 1} (model=${model})`)
      return text
    } catch (err) {
      lastErr = err
      if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      if (!(err instanceof TransientError) || attempt === RETRY_DELAYS.length) {
        throw err
      }
      // Try alternate model after first transient failure
      if (attempt === 1 && POLLINATIONS_MODELS[1]) modelIdx = 1
      const delay = RETRY_DELAYS[attempt]
      dbg.warn('ai', `pollinations transient (${(err as Error).message}), retry ${attempt + 1}/${RETRY_DELAYS.length} in ${delay}ms`)
      opts.onStatus?.(`AI is busy, retrying in ${Math.round(delay / 1000)}s…`)
      await abortableDelay(delay, opts.signal)
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Top-level generate() with single-concurrency queue
// Pollinations limits to 1 inflight request per IP. Serializing eliminates
// the most common failure path entirely.
// ─────────────────────────────────────────────────────────────────────────────

let activeChain: Promise<unknown> = Promise.resolve()
let queueDepth = 0

export async function generate(opts: GenerateOptions): Promise<string> {
  const myPos = ++queueDepth
  if (myPos > 1) {
    opts.onStatus?.(`Queued (${myPos - 1} ahead of you)…`)
    dbg.ai('ai', `queued at position ${myPos}`)
  }
  const job = activeChain.then(async () => {
    try {
      return await runProviders(opts)
    } finally {
      queueDepth--
    }
  }, async () => {
    // Previous job failed — still try ours
    try {
      return await runProviders(opts)
    } finally {
      queueDepth--
    }
  })
  activeChain = job
  return job as Promise<string>
}

async function runProviders(opts: GenerateOptions): Promise<string> {
  const status = await getStatus()
  const start = performance.now()

  // Try window.ai first if available
  if (status.backend === 'window-ai') {
    try {
      const out = await generateWindowAI(opts)
      dbg.ai('ai', 'generate ok (window-ai)', { ms: Math.round(performance.now() - start) })
      return out
    } catch (err) {
      if (opts.signal?.aborted) throw err
      dbg.warn('ai', `window-ai failed, falling back to pollinations: ${(err as Error).message}`)
      // Force fallback to Pollinations for this call
    }
  }

  // Pollinations primary cloud path
  try {
    const out = await generatePollinations(opts)
    dbg.ai('ai', 'generate ok (pollinations)', {
      ms: Math.round(performance.now() - start),
      promptChars: opts.user.length,
      outputChars: out.length,
    })
    return out
  } catch (err) {
    dbg.error('ai', `all providers failed: ${err instanceof Error ? err.message : String(err)}`, err)
    throw new Error(
      err instanceof DOMException && err.name === 'AbortError'
        ? 'Cancelled.'
        : `AI is unavailable right now (${err instanceof Error ? err.message : String(err)}). Please try again in a moment — the free service occasionally rate-limits or is briefly down.`,
    )
  }
}

export const SYSTEM_PROMPT = `You are an assistant embedded in MLS Toolkit, a broker engagement cockpit used by Alisa at Property Shield (a real estate fraud-listing detection company). Her job is the broker partnership funnel: 1:1 outreach, webinar coordination, and providing forwardable content brokers cascade to their agents.

Be direct, specific, and tactical. No fluff. No "Certainly!" preambles. No bullet-point spam where prose would do. When drafting emails, write like a thoughtful colleague — concrete details, ask for one thing, get out. Default to ~80 words unless asked for more.`
