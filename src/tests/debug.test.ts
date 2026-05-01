import { describe, it, expect, beforeEach } from 'vitest'
import { dbg, exportBundle, instrument } from '../lib/debug'

describe('debug', () => {
  beforeEach(() => {
    dbg.clear()
  })

  it('captures log entries in order', () => {
    dbg.info('test', 'first')
    dbg.action('test', 'second', { v: 1 })
    dbg.error('test', 'third')
    const snap = dbg.snapshot()
    expect(snap).toHaveLength(3)
    expect(snap[0].message).toBe('first')
    expect(snap[1].level).toBe('action')
    expect(snap[2].level).toBe('error')
  })

  it('notifies subscribers', () => {
    const seen: string[] = []
    const off = dbg.subscribe(e => seen.push(e.message))
    dbg.info('s', 'hello')
    dbg.warn('s', 'world')
    off()
    dbg.info('s', 'silent')
    expect(seen).toEqual(['hello', 'world'])
  })

  it('exports a JSON bundle with logs', () => {
    dbg.info('export', 'sample')
    const bundle = JSON.parse(exportBundle({ extra: 42 }))
    expect(bundle.logs).toHaveLength(1)
    expect(bundle.extra).toBe(42)
    expect(bundle.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('instruments a function with timing', () => {
    const add = instrument('math', 'add', (a: number, b: number) => a + b)
    expect(add(2, 3)).toBe(5)
    const snap = dbg.snapshot()
    expect(snap[0].scope).toBe('math')
    expect(snap[0].message).toBe('add')
    expect((snap[0].data as { ms: number }).ms).toBeGreaterThanOrEqual(0)
  })

  it('captures thrown errors via instrument', () => {
    const boom = instrument('test', 'boom', () => { throw new Error('kaboom') })
    expect(() => boom()).toThrow('kaboom')
    const snap = dbg.snapshot()
    expect(snap[0].level).toBe('error')
    expect(snap[0].message).toContain('kaboom')
  })

  it('safely clones non-serializable data', () => {
    const circular: { self?: unknown } = {}
    circular.self = circular
    dbg.info('test', 'circular', circular)
    const snap = dbg.snapshot()
    expect(typeof snap[0].data).toBe('string') // becomes "[unserializable: ...]"
  })
})
