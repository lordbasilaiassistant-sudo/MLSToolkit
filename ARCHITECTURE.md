# Architecture

## Principle

**Static, single-page, offline-first.** Every feature works in a browser with no network connection (except the initial page load and the optional Google Fonts stylesheet). The app reads and writes its own data exclusively from `localStorage` or a user-granted local folder via the File System Access API. There is no backend.

## Module layout

```
src/
├── lib/                     ← all data + business logic. Components import from here.
│   ├── types.ts             Domain types (Broker, EngagementEntry, Webinar, Snippet)
│   ├── constants.ts         Stages, types, status, color palettes, storage keys
│   ├── csv.ts               PapaParse wrapper. parseLog ⇄ stringifyLog.
│   ├── storage.ts           localStorage + File System Access API adapter
│   ├── store.ts             Zustand store. ALL components mutate state through here.
│   ├── seed.ts              Demo data (12 brokers, ~60 log entries, 6 snippets, 3 webinars)
│   └── utils.ts             cn(), date helpers, staleness coloring, file download
│
├── components/
│   ├── ui/                  Self-contained primitives (Button, Card, Input, Dialog, Drawer…)
│   ├── layout/              AppShell, Sidebar, TopBar, MobileNav
│   ├── BrokerCard.tsx       Kanban card (sortable via @dnd-kit)
│   ├── BrokerDetailPanel.tsx  Slide-over drawer with full history + log entry form
│   ├── BrokerForm.tsx       Add/edit dialog
│   ├── KanbanColumn.tsx     Droppable stage column
│   ├── DataSourceBar.tsx    Demo / localStorage / folder mode + import/export
│   └── ThemeToggle.tsx
│
├── routes/                  One per top-level page. Lazy-loaded from App.tsx.
│   ├── Pipeline.tsx         Hero — Kanban
│   ├── Directory.tsx        Sortable filterable table
│   ├── Activity.tsx         Recharts + going-cold alerts + recent timeline
│   ├── Library.tsx          Snippet grid + copy-to-clipboard
│   └── Webinars.tsx         Upcoming + past with cadence checklists
│
└── tests/                   Vitest. Data-layer focus.
    ├── csv.test.ts          parse/stringify roundtrip + edge cases
    └── store.test.ts        store mutations + persistence
```

### Hard rule: components never import from `lib/csv.ts` or `lib/storage.ts` directly. All persistence runs through `lib/store.ts`. This keeps the data layer swappable.

## Data flow

```
User action ─→ component callback ─→ store action ─→ set new state
                                          │
                                          ├─→ saveToLocalStorage()
                                          └─→ if dataSource === 'folder': writeEngagementLog()
                                                                                │
                                                                                ▼
                                                                  ~/alisa-mls/engagement-log.csv
                                                                                ▲
                                                                                │
                                                          (Cowork skills append rows here too)
```

Reads on app boot (`getInitialState()`):
1. localStorage hit? → use persisted state
2. Otherwise → seed data (demo mode banner shows in TopBar)

The `connectFolder()` action prompts for a directory, reads the CSV if present, and from then on every store mutation that touches `log` writes back to disk.

## Why these choices

| Decision | Why |
|---|---|
| Hash router | Works on GH Pages without server-side rewrites |
| Zustand over Redux | 1KB. State is small. Redux ceremony unjustified. |
| @dnd-kit over react-beautiful-dnd | Maintained, accessible (keyboard drag), tiny |
| PapaParse | Battle-tested CSV. Browser + Node. |
| localStorage as default | Zero setup for the user. No "connect first" friction. |
| File System Access API | The bridge to the Cowork skills' filesystem-resident CSV |
| No backend | Free hosting, zero ops, audience-of-one project |

## Adding a feature

- **A new page**: create `src/routes/Foo.tsx`, add a `<Route>` in `App.tsx` and a `<NavLink>` in `Sidebar.tsx`. Lazy-load it.
- **A new domain type**: add to `lib/types.ts`, add to the `AppState` interface, seed it in `lib/seed.ts`, add CRUD actions in `lib/store.ts`, persist in `loadFromLocalStorage`/`saveToLocalStorage`.
- **A new engagement type or stage**: edit `lib/constants.ts` and the relevant union in `lib/types.ts`. The CSV parser falls back to `follow_up` for unknown types — adjust `csv.ts:asType` if needed.

## Testing

Run `npm test`. Vitest runs in jsdom. Data-layer tests cover the boundary that breaks the hardest (CSV interop with the Cowork skills). UI is intentionally lightweight on tests — the visual smoke test is the `npm run dev` workflow.
