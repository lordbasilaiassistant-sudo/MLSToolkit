import { DataSourceBar } from '../DataSourceBar'
import { ThemeToggle } from '../ThemeToggle'

export function TopBar() {
  return (
    <header className="border-b border-border px-4 md:px-6 py-3 flex items-center gap-3 justify-between bg-card/40 backdrop-blur sticky top-0 z-20">
      <DataSourceBar />
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />
      </div>
    </header>
  )
}
