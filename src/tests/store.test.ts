import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../lib/store'

describe('store', () => {
  beforeEach(() => {
    localStorage.clear()
    useStore.getState().resetToDemoSeed()
  })

  it('seeds brokers across all stages', () => {
    const stages = new Set(useStore.getState().brokers.map(b => b.stage))
    expect(stages.has('cold')).toBe(true)
    expect(stages.has('warm')).toBe(true)
    expect(stages.has('hot')).toBe(true)
    expect(stages.has('won')).toBe(true)
  })

  it('adds and removes a broker', () => {
    const before = useStore.getState().brokers.length
    const b = useStore.getState().addBroker({
      name: 'Test Broker',
      brokerage: 'Test Brokerage',
      stage: 'warm',
      tags: [],
      notes: '',
    })
    expect(useStore.getState().brokers).toHaveLength(before + 1)
    useStore.getState().removeBroker(b.id)
    expect(useStore.getState().brokers).toHaveLength(before)
  })

  it('changes broker stage via setBrokerStage', () => {
    const b = useStore.getState().brokers[0]
    useStore.getState().setBrokerStage(b.id, 'won')
    expect(useStore.getState().brokers.find(x => x.id === b.id)?.stage).toBe('won')
  })

  it('toggles webinar checklist items', () => {
    const w = useStore.getState().webinars[0]
    const before = w.checklist.reminder_sent
    useStore.getState().toggleWebinarChecklist(w.id, 'reminder_sent')
    expect(useStore.getState().webinars.find(x => x.id === w.id)?.checklist.reminder_sent).toBe(!before)
  })

  it('increments snippet use count', () => {
    const s = useStore.getState().snippets[0]
    const before = s.use_count
    useStore.getState().incrementSnippetUse(s.id)
    expect(useStore.getState().snippets.find(x => x.id === s.id)?.use_count).toBe(before + 1)
  })

  it('persists to localStorage on mutation', () => {
    const b = useStore.getState().brokers[0]
    useStore.getState().updateBroker(b.id, { notes: 'persisted note' })
    const raw = localStorage.getItem('mlstoolkit:state:v1')
    expect(raw).toContain('persisted note')
  })
})
