import { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Send, RotateCcw, Loader2 } from 'lucide-react'
import { generate, getStatus, SYSTEM_PROMPT, type AIMessage, type AIStatus } from '@/lib/ai'
import { useStore } from '@/lib/store'
import { Button } from './ui/Button'
import { Textarea } from './ui/Input'
import { Badge } from './ui/Badge'
import { cn } from '@/lib/utils'
import { dbg } from '@/lib/debug'

interface UIMessage extends AIMessage {
  id: string
  ts: number
  error?: boolean
}

const SUGGESTED_PROMPTS = [
  'Which 3 brokers should I touch this week?',
  'Draft a re-engagement email for my coldest broker.',
  'What patterns are in my reply rates lately?',
  'Suggest a market-beat snippet for May.',
]

export function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const state = useStore()

  useEffect(() => {
    if (open && !status) {
      getStatus().then(setStatus).catch(err => {
        dbg.error('ai', 'getStatus failed', err)
        setStatus({ backend: 'unavailable', ready: false, reason: String(err) })
      })
    }
  }, [open, status])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, busy])

  const buildContext = (): string => {
    const stages = state.brokers.reduce<Record<string, number>>((acc, b) => { acc[b.stage] = (acc[b.stage] ?? 0) + 1; return acc }, {})
    const recent = state.log.slice(-10).map(e => `${e.date} ${e.broker_name} (${e.brokerage}) — ${e.type} → ${e.status}`).join('\n')
    const brokerList = state.brokers.map(b => `- ${b.name} (${b.brokerage}) [${b.stage}] ${b.next_action ? `→ next: ${b.next_action}` : ''}`).join('\n')
    return `Current state of Alisa's pipeline:
Brokers by stage: ${JSON.stringify(stages)}
Total touchpoints in log: ${state.log.length}

Brokers:
${brokerList}

Recent touchpoints (last 10):
${recent || '(none)'}`
  }

  const ask = async (text: string) => {
    if (!text.trim() || busy) return
    const userMsg: UIMessage = { id: crypto.randomUUID(), role: 'user', content: text.trim(), ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setBusy(true)
    setStatusMsg(null)
    abortRef.current = new AbortController()
    try {
      const history: AIMessage[] = messages
        .filter(m => !m.error)
        .map(m => ({ role: m.role, content: m.content }))
      const out = await generate({
        system: SYSTEM_PROMPT + '\n\nCONTEXT (read-only — describes Alisa\'s current pipeline state):\n' + buildContext(),
        user: text.trim(),
        messages: history,
        signal: abortRef.current.signal,
        onStatus: setStatusMsg,
      })
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: out, ts: Date.now() }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${msg}`, ts: Date.now(), error: true }])
    } finally {
      setBusy(false)
      setStatusMsg(null)
      abortRef.current = null
    }
  }

  const stop = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setBusy(false)
  }

  const reset = () => {
    setMessages([])
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-40 h-12 px-4 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center gap-2 text-sm font-medium hover:bg-primary/90 transition-colors md:bottom-3 md:right-3"
        aria-label="Open AI assistant"
      >
        <Sparkles className="h-4 w-4" />
        Ask AI
      </button>
    )
  }

  return (
    <div className="fixed inset-y-3 right-3 z-40 w-[420px] max-w-[calc(100vw-1.5rem)] rounded-lg border border-border bg-card shadow-2xl flex flex-col text-sm">
      <header className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          AI assistant
          {status && (
            <Badge className={cn('text-[10px] uppercase', status.ready ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300')}>
              {status.backend === 'window-ai' ? 'on-device' : status.backend === 'pollinations' ? 'free cloud' : 'offline'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button type="button" onClick={reset} className="p-1 rounded hover:bg-secondary text-muted-foreground" aria-label="Reset conversation" title="Reset conversation">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          <button type="button" onClick={() => setOpen(false)} className="p-1 rounded hover:bg-secondary text-muted-foreground" aria-label="Close AI assistant">
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              I can see your current pipeline ({state.brokers.length} brokers, {state.log.length} touchpoints) and help draft, plan, or analyze.
            </p>
            {status?.reason && (
              <p className="text-[10px] text-muted-foreground italic border-l-2 border-border pl-2">{status.reason}</p>
            )}
            <div className="space-y-1.5">
              {SUGGESTED_PROMPTS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => ask(p)}
                  className="block w-full text-left text-xs rounded-md border border-border bg-secondary/40 hover:bg-secondary px-2.5 py-2 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed',
                m.role === 'user' ? 'bg-primary text-primary-foreground' : m.error ? 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30' : 'bg-secondary text-foreground',
              )}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-lg px-3 py-2 bg-secondary text-muted-foreground inline-flex items-center gap-2 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {statusMsg ?? 'Thinking…'}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-border p-2">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                ask(input)
              }
            }}
            rows={2}
            placeholder="Ask anything about your pipeline…"
            className="text-sm min-h-[60px] resize-none"
            disabled={busy}
          />
          {busy ? (
            <Button size="icon" variant="outline" onClick={stop} aria-label="Stop"><X className="h-4 w-4" /></Button>
          ) : (
            <Button size="icon" onClick={() => ask(input)} disabled={!input.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">⌘/Ctrl-Enter to send · Shift-Enter for new line</p>
      </footer>
    </div>
  )
}
