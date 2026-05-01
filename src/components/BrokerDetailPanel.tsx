import { useState } from 'react'
import type { Broker, EngagementType, EngagementStatus } from '@/lib/types'
import { Drawer } from './ui/Drawer'
import { Button } from './ui/Button'
import { Input, Textarea } from './ui/Input'
import { Select } from './ui/Select'
import { Badge } from './ui/Badge'
import { useStore } from '@/lib/store'
import {
  STAGE_COLORS, STAGE_LABELS, STAGES,
  ENGAGEMENT_TYPES, ENGAGEMENT_TYPE_LABELS,
  ENGAGEMENT_STATUSES, STATUS_COLORS,
} from '@/lib/constants'
import { Mail, Phone, Users, Plus, Trash2, Pencil, ExternalLink } from 'lucide-react'
import { formatDate, formatRelative, isoDate, cn } from '@/lib/utils'
import { BrokerForm } from './BrokerForm'

interface Props {
  broker: Broker | null
  onClose: () => void
}

export function BrokerDetailPanel({ broker, onClose }: Props) {
  const log = useStore(s => s.log)
  const updateBroker = useStore(s => s.updateBroker)
  const removeBroker = useStore(s => s.removeBroker)
  const addLogEntry = useStore(s => s.addLogEntry)
  const removeLogEntry = useStore(s => s.removeLogEntry)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [newEntry, setNewEntry] = useState({
    type: 'follow_up' as EngagementType,
    ask: '',
    status: 'sent' as EngagementStatus,
    notes: '',
    date: isoDate(),
  })

  if (!broker) return null

  const history = log
    .filter(e => e.broker_name === broker.name && e.brokerage === broker.brokerage)
    .sort((a, b) => b.date.localeCompare(a.date))

  const palette = STAGE_COLORS[broker.stage]

  const handleAddEntry = () => {
    if (!newEntry.ask.trim()) return
    addLogEntry({
      broker_name: broker.name,
      brokerage: broker.brokerage,
      ...newEntry,
    })
    setNewEntry({ type: 'follow_up', ask: '', status: 'sent', notes: '', date: isoDate() })
  }

  const handleDelete = () => {
    if (confirmDelete) {
      removeBroker(broker.id)
      onClose()
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3500)
    }
  }

  return (
    <>
      <Drawer open={broker !== null} onOpenChange={open => { if (!open) onClose() }} width="max-w-2xl">
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold leading-tight">{broker.name}</h2>
              <p className="text-sm text-muted-foreground">{broker.brokerage}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge className={cn(palette.bg, palette.text)}>{STAGE_LABELS[broker.stage]}</Badge>
                <Select
                  className="h-7 w-32 text-xs"
                  value={broker.stage}
                  onChange={e => updateBroker(broker.id, { stage: e.target.value as Broker['stage'] })}
                  aria-label="Change stage"
                >
                  {STAGES.map(s => <option key={s} value={s}>Move to {STAGE_LABELS[s]}</option>)}
                </Select>
                {broker.agent_count !== undefined && (
                  <Badge className="bg-secondary text-foreground"><Users className="h-3 w-3" />{broker.agent_count} agents</Badge>
                )}
              </div>
              {broker.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {broker.tags.map(t => <Badge key={t} className="bg-secondary text-muted-foreground text-[10px]">#{t}</Badge>)}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
              <Button size="sm" variant={confirmDelete ? 'danger' : 'ghost'} onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5" />{confirmDelete ? 'Confirm?' : 'Delete'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
            {broker.email && (
              <a href={`mailto:${broker.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{broker.email}</span><ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
              </a>
            )}
            {broker.phone && (
              <a href={`tel:${broker.phone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary">
                <Phone className="h-3.5 w-3.5 shrink-0" /><span>{broker.phone}</span>
              </a>
            )}
          </div>

          {(broker.next_action || broker.next_action_date) && (
            <div className="mt-3 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-2 text-xs">
              <span className="font-semibold">Next action: </span>
              {broker.next_action ?? '—'}
              {broker.next_action_date && <span className="ml-2 opacity-70">· due {formatDate(broker.next_action_date)}</span>}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-b border-border">
          <label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2 block">Notes</label>
          <Textarea
            rows={3}
            value={broker.notes}
            onChange={e => updateBroker(broker.id, { notes: e.target.value })}
            placeholder="Context, history, what to remember about this relationship…"
          />
        </div>

        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">Log a touchpoint</h3>
          <div className="grid grid-cols-2 gap-2">
            <Select className="h-8 text-xs col-span-1" value={newEntry.type} onChange={e => setNewEntry({ ...newEntry, type: e.target.value as EngagementType })}>
              {ENGAGEMENT_TYPES.map(t => <option key={t} value={t}>{ENGAGEMENT_TYPE_LABELS[t]}</option>)}
            </Select>
            <Select className="h-8 text-xs col-span-1" value={newEntry.status} onChange={e => setNewEntry({ ...newEntry, status: e.target.value as EngagementStatus })}>
              {ENGAGEMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input className="h-8 text-xs col-span-1" placeholder="ask (e.g. demo_schedule)" value={newEntry.ask} onChange={e => setNewEntry({ ...newEntry, ask: e.target.value })} />
            <Input className="h-8 text-xs col-span-1" type="date" value={newEntry.date} onChange={e => setNewEntry({ ...newEntry, date: e.target.value })} />
            <Input className="h-8 text-xs col-span-2" placeholder="notes (optional)" value={newEntry.notes} onChange={e => setNewEntry({ ...newEntry, notes: e.target.value })} />
          </div>
          <div className="mt-2 flex justify-end">
            <Button size="sm" onClick={handleAddEntry} disabled={!newEntry.ask.trim()}><Plus className="h-3.5 w-3.5" />Log</Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
            Engagement history <span className="opacity-60 normal-case">({history.length})</span>
          </h3>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No touchpoints logged yet. Add the first one above.</p>
          ) : (
            <ol className="space-y-2">
              {history.map(entry => (
                <li key={entry.id} className="group rounded-md border border-border bg-card p-2.5">
                  <div className="flex items-start gap-3">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground w-20 shrink-0 pt-0.5">
                      {formatRelative(entry.date)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{ENGAGEMENT_TYPE_LABELS[entry.type]}</span>
                        <Badge className={STATUS_COLORS[entry.status]}>{entry.status}</Badge>
                        {entry.ask && <span className="text-xs text-muted-foreground">→ {entry.ask}</span>}
                      </div>
                      {entry.notes && <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>}
                    </div>
                    <button
                      type="button"
                      aria-label="Delete entry"
                      onClick={() => removeLogEntry(entry.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary text-muted-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </Drawer>
      <BrokerForm open={editing} onOpenChange={setEditing} broker={broker} />
    </>
  )
}
