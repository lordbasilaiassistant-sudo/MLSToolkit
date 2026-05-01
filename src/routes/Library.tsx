import { useState, useMemo } from 'react'
import { Plus, Star, Copy, Check, Trash2, Pencil, Search } from 'lucide-react'
import { useStore } from '@/lib/store'
import { SNIPPET_CATEGORIES, SNIPPET_CATEGORY_LABELS } from '@/lib/constants'
import type { Snippet, SnippetCategory } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { cn, formatRelative } from '@/lib/utils'

export function Library() {
  const snippets = useStore(s => s.snippets)
  const updateSnippet = useStore(s => s.updateSnippet)
  const removeSnippet = useStore(s => s.removeSnippet)
  const incrementSnippetUse = useStore(s => s.incrementSnippetUse)
  const addSnippet = useStore(s => s.addSnippet)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<SnippetCategory | 'all'>('all')
  const [editing, setEditing] = useState<Snippet | null>(null)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return snippets
      .filter(s => category === 'all' || s.category === category)
      .filter(s => !q || s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q))
      .sort((a, b) => Number(b.starred) - Number(a.starred) || b.use_count - a.use_count)
  }, [snippets, search, category])

  const copy = async (s: Snippet) => {
    try {
      await navigator.clipboard.writeText(s.body)
      incrementSnippetUse(s.id)
      setCopiedId(s.id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch (err) {
      console.error('clipboard failed', err)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="text-2xl font-bold leading-tight">Content library</h1>
          <p className="text-sm text-muted-foreground">Forwardable snippets your brokers can cascade to their agents. {filtered.length} of {snippets.length} shown.</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Snippet</Button>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-64" placeholder="Search title or body…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Chip active={category === 'all'} onClick={() => setCategory('all')}>All</Chip>
          {SNIPPET_CATEGORIES.map(c => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{SNIPPET_CATEGORY_LABELS[c]}</Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="italic mb-3">No snippets match the current filter.</p>
          <Button variant="outline" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Create your first snippet</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(s => (
            <Card key={s.id} className="flex flex-col">
              <CardContent className="pt-4 flex-1 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-secondary text-foreground text-[10px]">{SNIPPET_CATEGORY_LABELS[s.category]}</Badge>
                      {s.use_count > 0 && <span className="text-[10px] text-muted-foreground">used {s.use_count}×</span>}
                    </div>
                    <h3 className="font-semibold leading-tight line-clamp-2">{s.title}</h3>
                  </div>
                  <button
                    type="button"
                    aria-label={s.starred ? 'Unstar' : 'Star'}
                    onClick={() => updateSnippet(s.id, { starred: !s.starred })}
                    className={cn('p-1 rounded hover:bg-secondary shrink-0', s.starred ? 'text-amber-500' : 'text-muted-foreground')}
                  >
                    <Star className="h-4 w-4" fill={s.starred ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-5 flex-1 leading-relaxed">{s.body}</p>
                <div className="flex items-center gap-1 pt-2 border-t border-border">
                  <Button size="sm" variant="primary" onClick={() => copy(s)} className="flex-1">
                    {copiedId === s.id ? <><Check className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(s)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => removeSnippet(s.id)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="text-[10px] text-muted-foreground/70">added {formatRelative(s.created_at)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SnippetForm
        open={creating || editing !== null}
        onOpenChange={open => { if (!open) { setCreating(false); setEditing(null) } }}
        snippet={editing}
        onSubmit={(payload) => {
          if (editing) updateSnippet(editing.id, payload)
          else addSnippet({ ...payload, starred: payload.starred ?? false })
          setCreating(false); setEditing(null)
        }}
      />
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 px-3 text-xs rounded-md font-medium border transition-colors',
        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:bg-secondary',
      )}
    >
      {children}
    </button>
  )
}

function SnippetForm({ open, onOpenChange, snippet, onSubmit }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  snippet: Snippet | null
  onSubmit: (s: { title: string; category: SnippetCategory; body: string; starred?: boolean }) => void
}) {
  const [form, setForm] = useState({ title: '', category: 'general' as SnippetCategory, body: '', starred: false })
  useState(() => {
    if (snippet) setForm({ title: snippet.title, category: snippet.category, body: snippet.body, starred: snippet.starred })
  })
  // Re-init when snippet changes
  useMemo(() => {
    if (snippet) setForm({ title: snippet.title, category: snippet.category, body: snippet.body, starred: snippet.starred })
    else if (open) setForm({ title: '', category: 'general', body: '', starred: false })
  }, [snippet, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={snippet ? 'Edit snippet' : 'New snippet'} size="lg">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
          <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Q2 Market Beat (general)" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
          <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as SnippetCategory })}>
            {SNIPPET_CATEGORIES.map(c => <option key={c} value={c}>{SNIPPET_CATEGORY_LABELS[c]}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Body</label>
          <Textarea rows={10} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Use {{first_name}} or other placeholders. Plain text — agents copy and forward as-is." />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={() => onSubmit(form)} disabled={!form.title.trim() || !form.body.trim()}>{snippet ? 'Save' : 'Create'}</Button>
      </div>
    </Dialog>
  )
}
