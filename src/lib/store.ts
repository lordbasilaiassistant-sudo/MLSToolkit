import { create } from 'zustand'
import type { AppState, Broker, EngagementEntry, Snippet, Webinar, Stage, DataSourceMode } from './types'
import { getInitialState, saveToLocalStorage, saveTheme, pickFolder, writeEngagementLog, disconnectFolder } from './storage'
import { uid, isoDate } from './utils'
import { seedBrokers, seedLog, seedSnippets, seedWebinars } from './seed'
import { dbg } from './debug'

interface StoreActions {
  addBroker: (b: Omit<Broker, 'id' | 'created_at'>) => Broker
  updateBroker: (id: string, patch: Partial<Broker>) => void
  removeBroker: (id: string) => void
  setBrokerStage: (id: string, stage: Stage) => void

  addLogEntry: (e: Omit<EngagementEntry, 'id'>) => EngagementEntry
  updateLogEntry: (id: string, patch: Partial<EngagementEntry>) => void
  removeLogEntry: (id: string) => void
  importLog: (entries: EngagementEntry[]) => void

  addSnippet: (s: Omit<Snippet, 'id' | 'created_at' | 'use_count'>) => Snippet
  updateSnippet: (id: string, patch: Partial<Snippet>) => void
  removeSnippet: (id: string) => void
  incrementSnippetUse: (id: string) => void

  addWebinar: (w: Omit<Webinar, 'id' | 'created_at'>) => Webinar
  updateWebinar: (id: string, patch: Partial<Webinar>) => void
  toggleWebinarChecklist: (id: string, key: keyof Webinar['checklist']) => void
  removeWebinar: (id: string) => void

  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void

  connectFolder: () => Promise<void>
  disconnectFolder: () => void
  resetToDemoSeed: () => void
  setDataSource: (mode: DataSourceMode, folderName?: string | null) => void
}

export type Store = AppState & StoreActions

const initial = getInitialState()

export const useStore = create<Store>((set, get) => {
  const persist = () => {
    const s = get()
    saveToLocalStorage({
      brokers: s.brokers,
      log: s.log,
      snippets: s.snippets,
      webinars: s.webinars,
      dataSource: s.dataSource,
      folderName: s.folderName,
    })
    if (s.dataSource === 'folder') {
      writeEngagementLog(s.log).catch(err => {
        dbg.error('storage', `folder sync failed: ${err instanceof Error ? err.message : String(err)}`, err)
      })
    }
  }


  return {
    ...initial,

    addBroker(input) {
      const broker: Broker = { id: uid('b_'), created_at: new Date().toISOString(), ...input }
      set(s => ({ brokers: [broker, ...s.brokers] }))
      persist()
      return broker
    },
    updateBroker(id, patch) {
      set(s => ({ brokers: s.brokers.map(b => b.id === id ? { ...b, ...patch } : b) }))
      persist()
    },
    removeBroker(id) {
      set(s => ({ brokers: s.brokers.filter(b => b.id !== id) }))
      persist()
    },
    setBrokerStage(id, stage) {
      get().updateBroker(id, { stage })
    },

    addLogEntry(input) {
      const entry: EngagementEntry = { id: uid('e_'), ...input }
      set(s => ({ log: [entry, ...s.log] }))
      persist()
      return entry
    },
    updateLogEntry(id, patch) {
      set(s => ({ log: s.log.map(e => e.id === id ? { ...e, ...patch } : e) }))
      persist()
    },
    removeLogEntry(id) {
      set(s => ({ log: s.log.filter(e => e.id !== id) }))
      persist()
    },
    importLog(entries) {
      set({ log: entries })
      persist()
    },

    addSnippet(input) {
      const snippet: Snippet = { id: uid('s_'), created_at: new Date().toISOString(), use_count: 0, ...input }
      set(s => ({ snippets: [snippet, ...s.snippets] }))
      persist()
      return snippet
    },
    updateSnippet(id, patch) {
      set(s => ({ snippets: s.snippets.map(sn => sn.id === id ? { ...sn, ...patch } : sn) }))
      persist()
    },
    removeSnippet(id) {
      set(s => ({ snippets: s.snippets.filter(sn => sn.id !== id) }))
      persist()
    },
    incrementSnippetUse(id) {
      set(s => ({ snippets: s.snippets.map(sn => sn.id === id ? { ...sn, use_count: sn.use_count + 1 } : sn) }))
      persist()
    },

    addWebinar(input) {
      const w: Webinar = { id: uid('w_'), created_at: new Date().toISOString(), ...input }
      set(s => ({ webinars: [w, ...s.webinars] }))
      persist()
      return w
    },
    updateWebinar(id, patch) {
      set(s => ({ webinars: s.webinars.map(w => w.id === id ? { ...w, ...patch } : w) }))
      persist()
    },
    toggleWebinarChecklist(id, key) {
      set(s => ({
        webinars: s.webinars.map(w => w.id === id
          ? { ...w, checklist: { ...w.checklist, [key]: !w.checklist[key] } }
          : w),
      }))
      persist()
    },
    removeWebinar(id) {
      set(s => ({ webinars: s.webinars.filter(w => w.id !== id) }))
      persist()
    },

    setTheme(theme) {
      set({ theme })
      saveTheme(theme)
      document.documentElement.classList.toggle('dark', theme === 'dark')
    },
    toggleTheme() {
      const next = get().theme === 'dark' ? 'light' : 'dark'
      get().setTheme(next)
    },

    async connectFolder() {
      const result = await pickFolder()
      if (!result) return
      set({ dataSource: 'folder', folderName: result.name })
      if (result.entries.length > 0) {
        set({ log: result.entries })
      } else {
        // initial sync — write current log to the folder
        await writeEngagementLog(get().log)
      }
      persist()
    },
    disconnectFolder() {
      disconnectFolder()
      set({ dataSource: 'local-storage', folderName: null })
      persist()
    },
    resetToDemoSeed() {
      set({
        brokers: seedBrokers,
        log: seedLog,
        snippets: seedSnippets,
        webinars: seedWebinars,
        dataSource: 'demo',
        folderName: null,
      })
      persist()
    },
    setDataSource(mode, folderName = null) {
      set({ dataSource: mode, folderName })
      persist()
    },
  }
})

// Diff-based logger: any state change goes to the debug bus
let prevSnapshot = useStore.getState()
useStore.subscribe(state => {
  const diff: Record<string, { from: number; to: number }> = {}
  if (state.brokers !== prevSnapshot.brokers && state.brokers.length !== prevSnapshot.brokers.length) {
    diff.brokers = { from: prevSnapshot.brokers.length, to: state.brokers.length }
  }
  if (state.log !== prevSnapshot.log && state.log.length !== prevSnapshot.log.length) {
    diff.log = { from: prevSnapshot.log.length, to: state.log.length }
  }
  if (state.snippets !== prevSnapshot.snippets && state.snippets.length !== prevSnapshot.snippets.length) {
    diff.snippets = { from: prevSnapshot.snippets.length, to: state.snippets.length }
  }
  if (state.webinars !== prevSnapshot.webinars && state.webinars.length !== prevSnapshot.webinars.length) {
    diff.webinars = { from: prevSnapshot.webinars.length, to: state.webinars.length }
  }
  if (state.theme !== prevSnapshot.theme) {
    dbg.action('store', `theme → ${state.theme}`)
  }
  if (state.dataSource !== prevSnapshot.dataSource) {
    dbg.action('store', `dataSource → ${state.dataSource}`, { folderName: state.folderName })
  }
  if (Object.keys(diff).length > 0) {
    dbg.action('store', 'mutation', diff)
  }
  prevSnapshot = state
})

// touched to silence unused-import linter for isoDate; kept for future extensions
void isoDate
