import Papa from 'papaparse'
import type { EngagementEntry, EngagementType, EngagementStatus } from './types'
import { ENGAGEMENT_TYPES, ENGAGEMENT_STATUSES } from './constants'
import { uid } from './utils'

const HEADER = ['date', 'broker_name', 'brokerage', 'type', 'ask', 'status', 'notes']

function asType(s: string): EngagementType {
  return ENGAGEMENT_TYPES.includes(s as EngagementType) ? (s as EngagementType) : 'follow_up'
}

function asStatus(s: string): EngagementStatus {
  return ENGAGEMENT_STATUSES.includes(s as EngagementStatus) ? (s as EngagementStatus) : 'sent'
}

export function parseLog(csv: string): EngagementEntry[] {
  if (!csv.trim()) return []
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim().toLowerCase(),
  })
  return result.data.map(row => ({
    id: uid('e_'),
    date: (row.date || '').trim(),
    broker_name: (row.broker_name || '').trim(),
    brokerage: (row.brokerage || '').trim(),
    type: asType((row.type || '').trim()),
    ask: (row.ask || '').trim(),
    status: asStatus((row.status || '').trim()),
    notes: (row.notes || '').trim(),
  })).filter(e => e.date && e.broker_name)
}

export function stringifyLog(entries: EngagementEntry[]): string {
  const rows = entries.map(e => ({
    date: e.date,
    broker_name: e.broker_name,
    brokerage: e.brokerage,
    type: e.type,
    ask: e.ask,
    status: e.status,
    notes: e.notes,
  }))
  return Papa.unparse(rows, { columns: HEADER })
}
