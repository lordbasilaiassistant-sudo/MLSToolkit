import { useState, useMemo } from 'react'
import { Plus, Calendar, Users, CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import type { Webinar, WebinarChecklist } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { cn, formatDate, daysSince } from '@/lib/utils'

const CHECKLIST_LABELS: Record<keyof WebinarChecklist, string> = {
  reg_email_sent: 'Reg invite sent',
  reminder_sent: 'Reminder sent',
  handout_sent: 'Handout sent',
  attendee_followup_sent: 'Attendee follow-up',
  no_show_followup_sent: 'No-show follow-up',
}

export function Webinars() {
  const webinars = useStore(s => s.webinars)
  const toggleWebinarChecklist = useStore(s => s.toggleWebinarChecklist)
  const updateWebinar = useStore(s => s.updateWebinar)
  const removeWebinar = useStore(s => s.removeWebinar)
  const addWebinar = useStore(s => s.addWebinar)
  const [creating, setCreating] = useState(false)

  const sorted = useMemo(() => [...webinars].sort((a, b) => a.date.localeCompare(b.date)), [webinars])
  const upcoming = sorted.filter(w => (daysSince(w.date) ?? 0) <= 0)
  const past = sorted.filter(w => (daysSince(w.date) ?? 0) > 0).reverse()

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="text-2xl font-bold leading-tight">Webinars</h1>
          <p className="text-sm text-muted-foreground">{upcoming.length} upcoming · {past.length} completed</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Schedule</Button>
      </div>

      {webinars.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="italic mb-3">No webinars scheduled yet.</p>
          <Button variant="outline" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Schedule your first webinar</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <Section title="Upcoming">
              {upcoming.map(w => (
                <WebinarCard
                  key={w.id}
                  webinar={w}
                  onToggle={key => toggleWebinarChecklist(w.id, key)}
                  onUpdate={patch => updateWebinar(w.id, patch)}
                  onDelete={() => removeWebinar(w.id)}
                />
              ))}
            </Section>
          )}
          {past.length > 0 && (
            <Section title="Past">
              {past.map(w => (
                <WebinarCard
                  key={w.id}
                  webinar={w}
                  onToggle={key => toggleWebinarChecklist(w.id, key)}
                  onUpdate={patch => updateWebinar(w.id, patch)}
                  onDelete={() => removeWebinar(w.id)}
                  past
                />
              ))}
            </Section>
          )}
        </div>
      )}

      <WebinarForm open={creating} onOpenChange={setCreating} onCreate={(input) => { addWebinar(input); setCreating(false) }} />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function WebinarCard({ webinar, onToggle, onUpdate, onDelete, past }: {
  webinar: Webinar
  onToggle: (key: keyof WebinarChecklist) => void
  onUpdate: (patch: Partial<Webinar>) => void
  onDelete: () => void
  past?: boolean
}) {
  const items = Object.keys(webinar.checklist) as Array<keyof WebinarChecklist>
  const done = items.filter(k => webinar.checklist[k]).length
  const days = daysSince(webinar.date) ?? 0

  return (
    <Card className={cn(past && 'opacity-80')}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className="bg-primary/15 text-primary"><Calendar className="h-3 w-3" />{formatDate(webinar.date)}</Badge>
              {!past && days < 0 && <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">in {Math.abs(days)}d</Badge>}
              {past && <Badge className="bg-secondary text-muted-foreground">{Math.abs(days)}d ago</Badge>}
              {webinar.brokerage_focus && <Badge className="bg-secondary text-muted-foreground">{webinar.brokerage_focus}</Badge>}
            </div>
            <h3 className="font-semibold text-base">{webinar.title}</h3>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{webinar.registrants} reg{past ? `, ${webinar.attendees} attended` : ''}</span>
              <span>{done}/{items.length} cadence steps</span>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-1.5">
          {items.map(key => (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              className={cn(
                'flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs text-left transition-colors',
                webinar.checklist[key]
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-card border-border text-muted-foreground hover:bg-secondary',
              )}
            >
              {webinar.checklist[key] ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0" />}
              <span className="leading-tight">{CHECKLIST_LABELS[key]}</span>
            </button>
          ))}
        </div>

        {webinar.notes && (
          <div className="mt-3 text-xs text-muted-foreground bg-secondary/40 rounded-md px-3 py-2">
            {webinar.notes}
          </div>
        )}
        {past && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5 block">Registrants</label>
              <Input type="number" min={0} className="h-8 text-xs" value={webinar.registrants} onChange={e => onUpdate({ registrants: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-0.5 block">Attendees</label>
              <Input type="number" min={0} className="h-8 text-xs" value={webinar.attendees} onChange={e => onUpdate({ attendees: Number(e.target.value) })} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function WebinarForm({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (open: boolean) => void; onCreate: (w: Omit<Webinar, 'id' | 'created_at'>) => void }) {
  const [form, setForm] = useState({ title: '', date: '', brokerage_focus: '', registrants: 0, attendees: 0, notes: '' })

  const submit = () => {
    if (!form.title.trim() || !form.date) return
    onCreate({
      title: form.title.trim(),
      date: form.date,
      brokerage_focus: form.brokerage_focus.trim() || undefined,
      registrants: form.registrants,
      attendees: form.attendees,
      notes: form.notes.trim(),
      checklist: {
        reg_email_sent: false,
        reminder_sent: false,
        handout_sent: false,
        attendee_followup_sent: false,
        no_show_followup_sent: false,
      },
    })
    setForm({ title: '', date: '', brokerage_focus: '', registrants: 0, attendees: 0, notes: '' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Schedule webinar" size="md">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
          <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Spotting listing fraud before it goes live" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Date *</label>
          <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Audience focus</label>
          <Input value={form.brokerage_focus} onChange={e => setForm({ ...form, brokerage_focus: e.target.value })} placeholder="all brokers / mid-size brokerages / west coast" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
          <Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={() => { submit(); onOpenChange(false) }} disabled={!form.title.trim() || !form.date}>Schedule</Button>
      </div>
    </Dialog>
  )
}
