import { Component, type ReactNode } from 'react'
import { dbg, exportBundle } from '@/lib/debug'
import { Button } from './ui/Button'
import { downloadFile } from '@/lib/utils'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    dbg.error('react', `ErrorBoundary caught: ${error.message}`, {
      stack: error.stack,
      componentStack: info.componentStack ?? undefined,
    })
  }

  reset = () => this.setState({ error: null })

  exportBundle = () => {
    downloadFile(`mlstoolkit-debug-${Date.now()}.json`, exportBundle({
      crash: {
        message: this.state.error?.message,
        stack: this.state.error?.stack,
      },
    }), 'application/json')
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-full grid place-items-center p-6 bg-background text-foreground">
          <div className="max-w-lg space-y-4 rounded-lg border border-red-500/40 bg-card p-6 shadow-lg">
            <div>
              <div className="text-2xl font-bold text-red-500">Something broke</div>
              <p className="text-sm text-muted-foreground mt-1">An unexpected error stopped the page from rendering. Your data is still safe in localStorage.</p>
            </div>
            <pre className="text-xs bg-secondary rounded-md p-3 overflow-auto max-h-40 scrollbar-thin font-mono">
{this.state.error.message}
{this.state.error.stack ? '\n\n' + this.state.error.stack.split('\n').slice(0, 6).join('\n') : ''}
            </pre>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={this.reset}>Try again</Button>
              <Button variant="outline" onClick={() => location.reload()}>Reload page</Button>
              <Button variant="ghost" onClick={this.exportBundle}>Export debug bundle</Button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
