import type { AppState, Broker, EngagementEntry, Snippet, Webinar, DataSourceMode } from './types'
import { STORAGE_KEYS } from './constants'
import { parseLog, stringifyLog } from './csv'
import { seedBrokers, seedLog, seedSnippets, seedWebinars } from './seed'

export interface PersistedState {
  brokers: Broker[]
  log: EngagementEntry[]
  snippets: Snippet[]
  webinars: Webinar[]
  dataSource: DataSourceMode
  folderName: string | null
}

export function loadFromLocalStorage(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.state)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedState
    if (!parsed.brokers || !parsed.log) return null
    return parsed
  } catch {
    return null
  }
}

export function saveToLocalStorage(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(state))
  } catch (err) {
    console.error('saveToLocalStorage failed', err)
  }
}

export function loadTheme(): 'light' | 'dark' {
  const t = localStorage.getItem(STORAGE_KEYS.theme)
  if (t === 'light' || t === 'dark') return t
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function saveTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem(STORAGE_KEYS.theme, theme)
}

export function getInitialState(): AppState {
  const persisted = loadFromLocalStorage()
  if (persisted) {
    return {
      brokers: persisted.brokers,
      log: persisted.log,
      snippets: persisted.snippets ?? seedSnippets,
      webinars: persisted.webinars ?? seedWebinars,
      theme: loadTheme(),
      dataSource: persisted.dataSource ?? 'local-storage',
      folderName: persisted.folderName ?? null,
    }
  }
  return {
    brokers: seedBrokers,
    log: seedLog,
    snippets: seedSnippets,
    webinars: seedWebinars,
    theme: loadTheme(),
    dataSource: 'demo',
    folderName: null,
  }
}

declare global {
  interface Window {
    showDirectoryPicker?: (opts?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
  }
}

let folderHandle: FileSystemDirectoryHandle | null = null

export function hasFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
}

export async function pickFolder(): Promise<{ name: string; entries: EngagementEntry[] } | null> {
  if (!hasFileSystemAccess()) {
    throw new Error('File System Access API not supported in this browser. Use the import/export buttons instead.')
  }
  const handle = await window.showDirectoryPicker!({ mode: 'readwrite' })
  folderHandle = handle
  const entries = await readEngagementLog()
  return { name: handle.name, entries }
}

export async function readEngagementLog(): Promise<EngagementEntry[]> {
  if (!folderHandle) return []
  try {
    const fileHandle = await folderHandle.getFileHandle('engagement-log.csv', { create: false })
    const file = await fileHandle.getFile()
    const text = await file.text()
    return parseLog(text)
  } catch {
    return []
  }
}

export async function writeEngagementLog(entries: EngagementEntry[]): Promise<void> {
  if (!folderHandle) return
  const fileHandle = await folderHandle.getFileHandle('engagement-log.csv', { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(stringifyLog(entries))
  await writable.close()
}

export function disconnectFolder(): void {
  folderHandle = null
}
