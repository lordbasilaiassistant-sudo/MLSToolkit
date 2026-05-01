import { useState, useMemo } from 'react'
import { Plus, Search, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react'
import { useStore } from '@/lib/store'
import { STAGES, STAGE_LABELS, STAGE_COLORS } from '@/lib/constants'
import type { Broker, Stage } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { BrokerDetailPanel } from '@/components/BrokerDetailPanel'
import { BrokerForm } from '@/components/BrokerForm'
import { cn, daysSince, stalenessClasses, stalenessTone, formatRelative } from '@/lib/utils'

type SortKey = 'name' | 'brokerage' | 'stage' | 'agent_count' | 'last_touch' | 'next_action_date'
type SortDir = 'asc' | 'desc'

export function Directory() {
  const brokers = useStore(s => s.brokers)
  const log = useStore(s => s.log)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<Stage | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('last_touch')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [active, setActive] = useState<Broker | null>(null)
  const [adding, setAdding] = useState(false)

  const lastTouchByBroker = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of log) {
      const key = e.broker_name + '|' + e.brokerage
      const prev = map.get(key)
      if (!prev || e.date > prev) map.set(key, e.date)
    }
    return map
  }, [log])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return brokers.filter(b => {
      if (stageFilter !== 'all' && b.stage !== stageFilter) return false
      if (!q) return true
      return (
        b.name.toLowerCase().includes(q) ||
        b.brokerage.toLowerCase().includes(q) ||
        b.tags.some(t => t.toLowerCase().includes(q)) ||
        (b.email?.toLowerCase().includes(q) ?? false) ||
        b.notes.toLowerCase().includes(q)
      )
    })
  }, [brokers, search, stageFilter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'name': return a.name.localeCompare(b.name) * dir
        case 'brokerage': return a.brokerage.localeCompare(b.brokerage) * dir
        case 'stage': return (STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage)) * dir
        case 'agent_count': return ((a.agent_count ?? 0) - (b.agent_count ?? 0)) * dir
        case 'next_action_date': return ((a.next_action_date ?? '9999').localeCompare(b.next_action_date ?? '9999')) * dir
        case 'last_touch': {
          const al = lastTouchByBroker.get(a.name + '|' + a.brokerage) ?? ''
          const bl = lastTouchByBroker.get(b.name + '|' + b.brokerage) ?? ''
          return al.localeCompare(bl) * dir
        }
      }
    })
    return arr
  }, [filtered, sortKey, sortDir, lastTouchByBroker])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3 inline ml-1" /> : <ArrowDown className="h-3 w-3 inline ml-1" />)
      : <ArrowUpDown className="h-3 w-3 inline ml-1 opacity-30" />

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="text-2xl font-bold leading-tight">Directory</h1>
          <p className="text-sm text-muted-foreground">{sorted.length} of {brokers.length} brokers</p>
        </div>
        <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Broker</Button>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 w-64"
            placeholder="Search brokers, brokerages, tags…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <FilterChip active={stageFilter === 'all'} onClick={() => setStageFilter('all')}>All</FilterChip>
          {STAGES.map(s => (
            <FilterChip key={s} active={stageFilter === s} onClick={() => setStageFilter(s)} stage={s}>
              {STAGE_LABELS[s]}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th onClick={() => toggleSort('name')}>Name <SortIcon k="name" /></Th>
                <Th onClick={() => toggleSort('brokerage')}>Brokerage <SortIcon k="brokerage" /></Th>
                <Th onClick={() => toggleSort('stage')}>Stage <SortIcon k="stage" /></Th>
                <Th onClick={() => toggleSort('agent_count')} className="text-right">Agents <SortIcon k="agent_count" /></Th>
                <Th onClick={() => toggleSort('last_touch')}>Last touch <SortIcon k="last_touch" /></Th>
                <Th onClick={() => toggleSort('next_action_date')}>Next action <SortIcon k="next_action_date" /></Th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground italic">No brokers match the current filters.</td></tr>
              ) : sorted.map(b => {
                const last = lastTouchByBroker.get(b.name + '|' + b.brokerage)
                const days = daysSince(last)
                const tone = stalenessTone(days)
                const palette = STAGE_COLORS[b.stage]
                return (
                  <tr
                    key={b.id}
                    className="border-t border-border hover:bg-secondary/40 cursor-pointer transition-colors"
                    onClick={() => setActive(b)}
                  >
                    <td className="px-3 py-2.5 font-medium">{b.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{b.brokerage}</td>
                    <td className="px-3 py-2.5">
                      <Badge className={cn(palette.bg, palette.text)}>{STAGE_LABELS[b.stage]}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{b.agent_count ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      <Badge className={stalenessClasses(tone)}>{formatRelative(last)}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground max-w-xs truncate" title={b.next_action ?? ''}>{b.next_action ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <BrokerDetailPanel broker={active} onClose={() => setActive(null)} />
      <BrokerForm open={adding} onOpenChange={setAdding} />
    </div>
  )
}

function Th({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <th onClick={onClick} className={cn('px-3 py-2 text-left font-medium select-none cursor-pointer hover:text-foreground', className)}>
      {children}
    </th>
  )
}

function FilterChip({ active, onClick, stage, children }: { active: boolean; onClick: () => void; stage?: Stage; children: React.ReactNode }) {
  const palette = stage ? STAGE_COLORS[stage] : null
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 px-3 text-xs rounded-md font-medium transition-colors border',
        active
          ? palette
            ? cn(palette.bg, palette.text, 'border-transparent ring-1 ring-current/40')
            : 'bg-primary text-primary-foreground border-primary'
          : 'bg-transparent text-muted-foreground border-border hover:bg-secondary',
      )}
    >
      {children}
    </button>
  )
}
