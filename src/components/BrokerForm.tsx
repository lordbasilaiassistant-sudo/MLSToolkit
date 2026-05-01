import { useState, useEffect } from 'react'
import type { Broker, Stage } from '@/lib/types'
import { Dialog } from './ui/Dialog'
import { Button } from './ui/Button'
import { Input, Textarea } from './ui/Input'
import { Select } from './ui/Select'
import { STAGES, STAGE_LABELS } from '@/lib/constants'
import { useStore } from '@/lib/store'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  broker?: Broker
  defaultStage?: Stage
}

export function BrokerForm({ open, onOpenChange, broker, defaultStage = 'cold' }: Props) {
  const addBroker = useStore(s => s.addBroker)
  const updateBroker = useStore(s => s.updateBroker)

  const [form, setForm] = useState({
    name: '',
    brokerage: '',
    email: '',
    phone: '',
    agent_count: '',
    stage: defaultStage as Stage,
    tags: '',
    notes: '',
    next_action: '',
    next_action_date: '',
  })

  useEffect(() => {
    if (broker) {
      setForm({
        name: broker.name,
        brokerage: broker.brokerage,
        email: broker.email ?? '',
        phone: broker.phone ?? '',
        agent_count: broker.agent_count?.toString() ?? '',
        stage: broker.stage,
        tags: broker.tags.join(', '),
        notes: broker.notes,
        next_action: broker.next_action ?? '',
        next_action_date: broker.next_action_date ?? '',
      })
    } else {
      setForm({
        name: '', brokerage: '', email: '', phone: '', agent_count: '',
        stage: defaultStage, tags: '', notes: '', next_action: '', next_action_date: '',
      })
    }
  }, [broker, defaultStage, open])

  const submit = () => {
    if (!form.name.trim() || !form.brokerage.trim()) return
    const payload = {
      name: form.name.trim(),
      brokerage: form.brokerage.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      agent_count: form.agent_count ? Number(form.agent_count) : undefined,
      stage: form.stage,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: form.notes.trim(),
      next_action: form.next_action.trim() || undefined,
      next_action_date: form.next_action_date || undefined,
    }
    if (broker) {
      updateBroker(broker.id, payload)
    } else {
      addBroker(payload)
    }
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={broker ? 'Edit broker' : 'Add broker'}
      description="Brokers and brokerages drive your pipeline. The skills toolkit reads matching engagement-log entries."
      size="lg"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Name *">
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Brokerage *">
          <Input value={form.brokerage} onChange={e => setForm({ ...form, brokerage: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Agent count">
          <Input type="number" min="0" value={form.agent_count} onChange={e => setForm({ ...form, agent_count: e.target.value })} />
        </Field>
        <Field label="Stage">
          <Select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value as Stage })}>
            {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </Select>
        </Field>
        <Field label="Tags (comma separated)" full>
          <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="e.g. phoenix, luxury" />
        </Field>
        <Field label="Next action">
          <Input value={form.next_action} onChange={e => setForm({ ...form, next_action: e.target.value })} placeholder="e.g. Send Q2 market beat" />
        </Field>
        <Field label="Next action date">
          <Input type="date" value={form.next_action_date} onChange={e => setForm({ ...form, next_action_date: e.target.value })} />
        </Field>
        <Field label="Notes" full>
          <Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={submit} disabled={!form.name.trim() || !form.brokerage.trim()}>{broker ? 'Save changes' : 'Add broker'}</Button>
      </div>
    </Dialog>
  )
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  )
}
