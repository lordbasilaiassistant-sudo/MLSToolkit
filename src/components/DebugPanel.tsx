import { useEffect, useRef, useState } from 'react'
import { Bug, X, Trash2, Download, ChevronDown, ChevronRight } from 'lucide-react'
import { dbg, exportBundle, type LogEntry } from '@/lib/debug'
import { useStore } from '@/lib/store'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { cn, downloadFile } from '@/lib/utils'

const LEVEL_COLORS: Record<LogEntry['level'], string> = {
  info:   'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  warn:   'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  error:  'bg-red-500/15 text-red-700 dark:text-red-300',
  action: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  ai:     'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  fs:     'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
}

export function DebugPanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'logs' | 'state' | 'env'>('logs')
  const [filter, setFilter] = useState<'all' | LogEntry['level']>('all')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const state = useStore()
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLogs(dbg.snapshot())
    return dbg.subscribe(() => {
      setLogs(dbg.snapshot())
    })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'D' && e.shiftKey && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open || tab !== 'logs') return
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs, open, tab])

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-3 left-3 z-40 h-9 w-9 rounded-full bg-card border border-border shadow-lg grid place-items-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors md:bottom-3"
        title="Debug panel (Ctrl+Shift+D)"
        aria-label="Open debug panel"
      >
        <Bug className="h-4 w-4" />
      </button>
    )
  }

  const filtered = filter === 'all' ? logs : logs.filter(l => l.level === filter)

  return (
    <div className="fixed inset-y-3 left-3 z-40 w-[420px] max-w-[calc(100vw-1.5rem)] rounded-lg border border-border bg-card shadow-2xl flex flex-col text-xs">
      <header className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 font-semibold">
          <Bug className="h-3.5 w-3.5 text-primary" />
          Debug Panel
          <Badge className="bg-secondary text-muted-foreground text-[10px]">⌘⇧D</Badge>
        </div>
        <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-secondary" aria-label="Close debug panel">
          <X className="h-3.5 w-3.5" />
        </button>
      </header>
      <nav className="flex border-b border-border">
        {(['logs','state','env'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'px-3 py-1.5 text-[11px] uppercase tracking-wide font-medium border-b-2 transition-colors',
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto scrollbar-thin" ref={listRef}>
        {tab === 'logs' && (
          <div>
            <div className="sticky top-0 bg-card border-b border-border px-2 py-1.5 flex items-center gap-1 flex-wrap">
              {(['all','info','action','ai','warn','error','fs'] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setFilter(l)}
                  className={cn(
                    'px-2 py-0.5 text-[10px] uppercase rounded font-semibold tracking-wide',
                    filter === l ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground',
                  )}
                >
                  {l}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { dbg.clear(); setLogs([]) }}
                className="ml-auto p-1 rounded hover:bg-secondary text-muted-foreground"
                aria-label="Clear logs"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {filtered.length === 0 ? (
              <p className="text-muted-foreground italic text-center py-6">No log entries{filter !== 'all' ? ` for ${filter}` : ''}.</p>
            ) : (
              <ol className="divide-y divide-border/60">
                {filtered.map(entry => <LogRow key={entry.id} entry={entry} />)}
              </ol>
            )}
          </div>
        )}
        {tab === 'state' && (
          <div className="p-2">
            <pre className="text-[10px] font-mono whitespace-pre-wrap break-all">
{JSON.stringify({
  brokers: state.brokers.length,
  log: state.log.length,
  snippets: state.snippets.length,
  webinars: state.webinars.length,
  theme: state.theme,
  dataSource: state.dataSource,
  folderName: state.folderName,
}, null, 2)}
            </pre>
            <details className="mt-2">
              <summary className="cursor-pointer font-semibold text-[10px] uppercase tracking-wide text-muted-foreground">Brokers (first 3)</summary>
              <pre className="mt-1 text-[10px] font-mono whitespace-pre-wrap break-all">{JSON.stringify(state.brokers.slice(0, 3), null, 2)}</pre>
            </details>
            <details className="mt-2">
              <summary className="cursor-pointer font-semibold text-[10px] uppercase tracking-wide text-muted-foreground">Log (last 5)</summary>
              <pre className="mt-1 text-[10px] font-mono whitespace-pre-wrap break-all">{JSON.stringify(state.log.slice(-5), null, 2)}</pre>
            </details>
          </div>
        )}
        {tab === 'env' && <EnvTab />}
      </div>
      <footer className="border-t border-border p-2 flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => downloadFile(`mlstoolkit-debug-${Date.now()}.json`, exportBundle({ state: {
            brokers: state.brokers.length, log: state.log.length, snippets: state.snippets.length, webinars: state.webinars.length,
          } }), 'application/json')}
        >
          <Download className="h-3.5 w-3.5" />Export bundle
        </Button>
        <span className="text-[10px] text-muted-foreground ml-auto">{logs.length} entries</span>
      </footer>
    </div>
  )
}

function LogRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const hasData = entry.data !== undefined
  return (
    <li className="px-2 py-1.5 hover:bg-secondary/40">
      <div className="flex items-start gap-2">
        <span className="text-[9px] text-muted-foreground tabular-nums shrink-0 mt-0.5">{new Date(entry.ts).toLocaleTimeString(undefined, { hour12: false })}</span>
        <Badge className={cn(LEVEL_COLORS[entry.level], 'shrink-0 text-[9px] uppercase')}>{entry.level}</Badge>
        <span className="text-[10px] text-muted-foreground shrink-0">{entry.scope}</span>
        <button
          type="button"
          onClick={() => hasData && setExpanded(e => !e)}
          className={cn('text-left flex-1 min-w-0 break-words', hasData && 'cursor-pointer hover:text-primary')}
        >
          {hasData && (expanded ? <ChevronDown className="inline h-3 w-3 mr-0.5" /> : <ChevronRight className="inline h-3 w-3 mr-0.5" />)}
          {entry.message}
        </button>
      </div>
      {expanded && hasData && (
        <pre className="mt-1 ml-8 text-[10px] font-mono bg-secondary/40 rounded p-1.5 whitespace-pre-wrap break-all">{JSON.stringify(entry.data, null, 2)}</pre>
      )}
    </li>
  )
}

function EnvTab() {
  const env = {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a',
    language: typeof navigator !== 'undefined' ? navigator.language : 'n/a',
    online: typeof navigator !== 'undefined' ? navigator.onLine : 'n/a',
    fileSystemAPI: typeof window !== 'undefined' && typeof (window as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function',
    windowAI: typeof window !== 'undefined' && Boolean((window as { ai?: unknown }).ai),
    viewport: typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : 'n/a',
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 'n/a',
    storage: getStorageInfo(),
  }
  return (
    <div className="p-2">
      <pre className="text-[10px] font-mono whitespace-pre-wrap break-all">{JSON.stringify(env, null, 2)}</pre>
    </div>
  )
}

function getStorageInfo() {
  try {
    const raw = localStorage.getItem('mlstoolkit:state:v1')
    return { hasState: Boolean(raw), bytes: raw?.length ?? 0 }
  } catch {
    return { error: 'localStorage unavailable' }
  }
}
