import { useState } from 'react'
import { FolderOpen, FolderSync, Database, AlertCircle, Download, Upload } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { useStore } from '@/lib/store'
import { hasFileSystemAccess } from '@/lib/storage'
import { stringifyLog, parseLog } from '@/lib/csv'
import { downloadFile } from '@/lib/utils'

export function DataSourceBar() {
  const dataSource = useStore(s => s.dataSource)
  const folderName = useStore(s => s.folderName)
  const log = useStore(s => s.log)
  const importLog = useStore(s => s.importLog)
  const connectFolder = useStore(s => s.connectFolder)
  const disconnect = useStore(s => s.disconnectFolder)
  const [error, setError] = useState<string | null>(null)
  const supportsFolder = hasFileSystemAccess()

  const handleConnect = async () => {
    setError(null)
    try {
      await connectFolder()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect folder')
    }
  }

  const handleExport = () => {
    downloadFile('engagement-log.csv', stringifyLog(log), 'text/csv')
  }

  const handleImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = parseLog(String(reader.result))
        importLog(parsed)
      } catch (err) {
        setError('Failed to parse CSV: ' + (err instanceof Error ? err.message : 'unknown'))
      }
    }
    reader.readAsText(file)
  }

  const sourceLabel = () => {
    switch (dataSource) {
      case 'demo': return 'Demo data'
      case 'local-storage': return 'Browser storage'
      case 'folder': return folderName ? `Folder: ${folderName}` : 'Folder connected'
    }
  }

  const sourceColor = () => {
    switch (dataSource) {
      case 'demo': return 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
      case 'local-storage': return 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
      case 'folder': return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge className={sourceColor()}>
        <Database className="h-3 w-3" />
        {sourceLabel()}
      </Badge>

      {supportsFolder && dataSource !== 'folder' && (
        <Button size="sm" variant="outline" onClick={handleConnect}>
          <FolderOpen className="h-3.5 w-3.5" />
          Connect ~/alisa-mls/
        </Button>
      )}
      {dataSource === 'folder' && (
        <Button size="sm" variant="outline" onClick={disconnect}>
          <FolderSync className="h-3.5 w-3.5" />
          Disconnect
        </Button>
      )}

      <Button size="sm" variant="ghost" onClick={handleExport} title="Export engagement-log.csv">
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>

      <label className="inline-flex items-center cursor-pointer">
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleImport(file)
            e.target.value = ''
          }}
        />
        <span className="inline-flex items-center gap-2 h-8 px-3 text-xs rounded-md hover:bg-secondary text-foreground">
          <Upload className="h-3.5 w-3.5" />
          Import
        </span>
      </label>

      {error && (
        <span className="inline-flex items-center gap-1 text-xs text-red-500" role="alert">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </span>
      )}
    </div>
  )
}
