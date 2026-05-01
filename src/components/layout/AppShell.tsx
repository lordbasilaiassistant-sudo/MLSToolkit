import type { ReactNode } from 'react'
import { Sidebar, MobileNav } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0 scrollbar-thin">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
