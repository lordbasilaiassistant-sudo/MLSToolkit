# MLS Toolkit

A beautiful, free-to-host **broker engagement cockpit** for real estate partnership work — Kanban pipeline, broker directory, activity timeline, content library, and webinar planner. All in the browser, no backend, no fees.

Built to pair with the [Cowork skills toolkit](#pairs-with-cowork-skills) — both surfaces read and write the same `engagement-log.csv`.

[**→ Live demo**](https://drlordbasil.github.io/MLSToolkit/)

## What it does

- **Pipeline** — drag broker cards across 5 stages (Cold → Warm → Active → Hot → Won). Color-coded staleness chips show when a broker last heard from you.
- **Directory** — searchable sortable table of every broker with stage filters, last-touch dates, and the next action.
- **Activity** — 12-week chart of touchpoints + reply rate, type breakdown donut, recent timeline, and "going cold" alerts for active relationships drifting past 21 days quiet.
- **Content library** — copy-paste snippet grid (price drops, market beats, fraud-prevention 1-pagers, compliance nudges) categorized and starred by use frequency.
- **Webinar planner** — every webinar tracks a 5-step email cadence checklist (reg invite → reminder → handout → attendee follow-up → no-show follow-up).

## How your data is stored

By default, everything lives in your browser's localStorage — no server. Two upgrade paths:

- **Connect a folder** (Chromium browsers — Chrome, Edge, Brave): click *Connect ~/alisa-mls/* in the toolbar. The app reads/writes `engagement-log.csv` directly into the folder you choose. The Cowork skills toolkit reads/writes the same file.
- **Import / Export** (any browser): use the toolbar buttons to drop a CSV in or pull one out.

There is **no telemetry, no analytics, no third-party requests** beyond the Google Fonts stylesheet for Inter. Everything is static.

## Pairs with Cowork skills

If you're using the four-skill Cowork toolkit (`mls-broker-engagement`, `agent-blast-email`, `webinar-prep`, `engagement-pipeline-report`), point both at the same folder. Workflow:

1. Cowork drafts an email → it appends a row to `engagement-log.csv`
2. MLS Toolkit reads the CSV → the broker's history updates in the UI
3. You drag the broker card to a new stage → MLS Toolkit updates broker metadata
4. Tomorrow morning's brief reads the same CSV → notices the new touchpoint

The schema (`date,broker_name,brokerage,type,ask,status,notes`) is the contract. Both sides respect it.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173/MLSToolkit/
npm test         # run unit tests once
npm run build    # production build to dist/
```

## Deploying your own copy

Fork the repo. In repo Settings → Pages, set Source to **GitHub Actions**. Push to `main` — the included workflow tests, builds, and publishes to `https://<your-username>.github.io/MLSToolkit/`. If your fork has a different name, update `base` in `vite.config.ts` to match.

## Stack

Vite · React · TypeScript · Tailwind · Radix UI · @dnd-kit · Recharts · Zustand · PapaParse. Vitest for the data-layer tests. No backend.

See `ARCHITECTURE.md` for module layout and where to extend.

## License

MIT — use it, fork it, ship your own.
