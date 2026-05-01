type LogLevel = 'info' | 'warn' | 'error' | 'action' | 'ai' | 'fs'

export interface LogEntry {
  id: string
  ts: number
  level: LogLevel
  scope: string
  message: string
  data?: unknown
}

type Listener = (entry: LogEntry) => void

const RING_SIZE = 500

class DebugBus {
  private buffer: LogEntry[] = []
  private listeners = new Set<Listener>()
  private seq = 0
  enabled = true

  log(level: LogLevel, scope: string, message: string, data?: unknown) {
    if (!this.enabled) return
    const entry: LogEntry = {
      id: `${Date.now()}_${++this.seq}`,
      ts: Date.now(),
      level,
      scope,
      message,
      data: data === undefined ? undefined : safeClone(data),
    }
    this.buffer.push(entry)
    if (this.buffer.length > RING_SIZE) this.buffer.shift()
    for (const l of this.listeners) {
      try { l(entry) } catch { /* listener errors must not break logging */ }
    }
    if (typeof console !== 'undefined') {
      const tag = `[${scope}]`
      const args = data === undefined ? [tag, message] : [tag, message, data]
      switch (level) {
        case 'error': console.error(...args); break
        case 'warn':  console.warn(...args); break
        default:      console.debug(...args); break
      }
    }
  }
  info(scope: string, message: string, data?: unknown)   { this.log('info', scope, message, data) }
  warn(scope: string, message: string, data?: unknown)   { this.log('warn', scope, message, data) }
  error(scope: string, message: string, data?: unknown)  { this.log('error', scope, message, data) }
  action(scope: string, message: string, data?: unknown) { this.log('action', scope, message, data) }
  ai(scope: string, message: string, data?: unknown)     { this.log('ai', scope, message, data) }
  fs(scope: string, message: string, data?: unknown)     { this.log('fs', scope, message, data) }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  snapshot(): LogEntry[] {
    return [...this.buffer]
  }
  clear() { this.buffer = [] }
}

function safeClone<T>(v: T): T | string {
  try {
    return JSON.parse(JSON.stringify(v, (_k, val) => {
      if (typeof val === 'function') return '[Function]'
      if (val instanceof Error) return { name: val.name, message: val.message, stack: val.stack }
      return val
    }))
  } catch (err) {
    return `[unserializable: ${String(err)}]`
  }
}

export const dbg = new DebugBus()

if (typeof window !== 'undefined') {
  window.addEventListener('error', e => {
    dbg.error('window', e.message, { filename: e.filename, lineno: e.lineno, colno: e.colno })
  })
  window.addEventListener('unhandledrejection', e => {
    const reason = e.reason
    const msg = reason instanceof Error ? reason.message : String(reason)
    dbg.error('promise', `Unhandled rejection: ${msg}`, reason instanceof Error ? { stack: reason.stack } : { reason })
  })
  ;(window as unknown as { __mlsDebug?: DebugBus }).__mlsDebug = dbg
}

export function exportBundle(extra: Record<string, unknown> = {}): string {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    userAgent: ua,
    url: typeof location !== 'undefined' ? location.href : 'unknown',
    logs: dbg.snapshot(),
    ...extra,
  }, null, 2)
}

export function instrument<TArgs extends unknown[], TReturn>(
  scope: string,
  name: string,
  fn: (...args: TArgs) => TReturn,
): (...args: TArgs) => TReturn {
  return (...args: TArgs) => {
    const start = performance.now()
    try {
      const result = fn(...args)
      const elapsed = performance.now() - start
      dbg.action(scope, name, { ms: Math.round(elapsed * 100) / 100, args: args.length ? args : undefined })
      return result
    } catch (err) {
      dbg.error(scope, `${name} threw: ${err instanceof Error ? err.message : String(err)}`, err)
      throw err
    }
  }
}
