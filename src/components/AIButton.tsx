import { useState } from 'react'
import { Sparkles, Loader2, Check, Copy, X } from 'lucide-react'
import { generate, SYSTEM_PROMPT } from '@/lib/ai'
import { Button } from './ui/Button'
import { cn } from '@/lib/utils'

interface Props {
  label?: string
  prompt: string
  context?: string
  className?: string
  size?: 'sm' | 'md'
  onResult?: (text: string) => void
}

/** Tiny ✨ button that runs a single AI generation and shows the result inline. */
export function AIButton({ label = 'AI suggest', prompt, context, className, size = 'sm', onResult }: Props) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const run = async () => {
    setBusy(true)
    setError(null)
    setResult(null)
    setStatusMsg(null)
    try {
      const out = await generate({
        system: SYSTEM_PROMPT + (context ? `\n\nCONTEXT:\n${context}` : ''),
        user: prompt,
        onStatus: setStatusMsg,
      })
      setResult(out)
      onResult?.(out)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
      setStatusMsg(null)
    }
  }

  const copy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {/* ignore */}
  }

  return (
    <div className={className}>
      {!result && !error && (
        <Button size={size} variant="outline" onClick={run} disabled={busy}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {busy ? (statusMsg ?? 'Thinking…') : label}
        </Button>
      )}
      {(result || error) && (
        <div className={cn('rounded-md border p-2.5 text-xs space-y-2', error ? 'border-red-500/30 bg-red-500/5' : 'border-primary/30 bg-primary/5')}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-[10px] uppercase tracking-wide text-muted-foreground">{error ? 'Error' : 'AI suggestion'}</span>
            <div className="flex items-center gap-1">
              {result && (
                <button type="button" onClick={copy} className="p-1 rounded hover:bg-secondary" aria-label="Copy">
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
              )}
              <button type="button" onClick={() => { setResult(null); setError(null) }} className="p-1 rounded hover:bg-secondary" aria-label="Dismiss">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed">{error ?? result}</p>
          {result && (
            <div className="flex justify-end pt-1">
              <Button size="sm" variant="ghost" onClick={run} disabled={busy}>
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Try again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
