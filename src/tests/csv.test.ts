import { describe, it, expect } from 'vitest'
import { parseLog, stringifyLog } from '../lib/csv'

const sample = `date,broker_name,brokerage,type,ask,status,notes
2026-04-30,John Smith,Acme Realty,welcome,intro_call,sent,
2026-05-01,John Smith,Acme Realty,follow_up,demo_schedule,replied,wants Q2 webinar`

describe('csv', () => {
  it('parses log into typed entries', () => {
    const entries = parseLog(sample)
    expect(entries).toHaveLength(2)
    expect(entries[0].broker_name).toBe('John Smith')
    expect(entries[0].type).toBe('welcome')
    expect(entries[1].status).toBe('replied')
    expect(entries[1].notes).toBe('wants Q2 webinar')
  })

  it('falls back to follow_up for unknown type', () => {
    const broken = `date,broker_name,brokerage,type,ask,status,notes
2026-04-30,Jane Doe,Doe Realty,not_a_real_type,intro,sent,`
    const entries = parseLog(broken)
    expect(entries[0].type).toBe('follow_up')
  })

  it('roundtrips through stringify', () => {
    const entries = parseLog(sample)
    const csv = stringifyLog(entries)
    const reparsed = parseLog(csv)
    expect(reparsed).toHaveLength(entries.length)
    expect(reparsed[0].broker_name).toBe(entries[0].broker_name)
    expect(reparsed[1].type).toBe(entries[1].type)
  })

  it('skips rows without a date or broker', () => {
    const partial = `date,broker_name,brokerage,type,ask,status,notes
,No Date,X,welcome,intro,sent,
2026-04-30,,No Name,welcome,intro,sent,`
    expect(parseLog(partial)).toHaveLength(0)
  })

  it('returns empty array for empty input', () => {
    expect(parseLog('')).toEqual([])
    expect(parseLog('   ')).toEqual([])
  })
})
