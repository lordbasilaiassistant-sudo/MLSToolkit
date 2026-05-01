import { NavLink } from 'react-router-dom'
import { Kanban, Users, Activity, Library, CalendarClock, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Pipeline',  icon: Kanban,        end: true  },
  { to: '/directory', label: 'Directory', icon: Users },
  { to: '/activity',  label: 'Activity',  icon: Activity },
  { to: '/library',   label: 'Library',   icon: Library },
  { to: '/webinars',  label: 'Webinars',  icon: CalendarClock },
]

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card/40 hidden md:flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold leading-tight">MLS Toolkit</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">broker cockpit</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 text-[10px] text-muted-foreground border-t border-border">
        Pairs with the Cowork skills toolkit. Both read/write the same engagement-log.csv.
      </div>
    </aside>
  )
}

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 px-2 py-1.5 flex items-center justify-around">
      {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[10px] font-medium',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          <link.icon className="h-4 w-4" />
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}
