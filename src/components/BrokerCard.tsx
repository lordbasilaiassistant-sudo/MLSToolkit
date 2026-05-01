import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Users, Calendar, GripVertical } from 'lucide-react'
import type { Broker, EngagementEntry } from '@/lib/types'
import { Badge } from './ui/Badge'
import { cn, daysSince, stalenessTone, stalenessClasses, formatRelative } from '@/lib/utils'

interface Props {
  broker: Broker
  log: EngagementEntry[]
  onClick: () => void
  isOverlay?: boolean
}

export function BrokerCard({ broker, log, onClick, isOverlay = false }: Props) {
  const sortable = useSortable({ id: broker.id, data: { type: 'broker', broker } })
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable

  const lastEntry = log
    .filter(e => e.broker_name === broker.name && e.brokerage === broker.brokerage)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  const days = daysSince(lastEntry?.date)
  const tone = stalenessTone(days)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-md border border-border bg-card p-3 pl-7 shadow-sm hover:shadow-md hover:border-primary/40 transition-all',
        isDragging && 'opacity-30',
        isOverlay && 'shadow-xl ring-2 ring-primary scale-105',
      )}
    >
      <button
        type="button"
        aria-label={`Drag ${broker.name}`}
        title="Drag to move stage"
        className={cn(
          'absolute left-0 top-0 bottom-0 w-6 grid place-items-center text-muted-foreground/40 hover:text-primary hover:bg-secondary/60 rounded-l-md',
          'cursor-grab active:cursor-grabbing touch-none',
          isOverlay && 'cursor-grabbing text-primary',
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left focus:outline-none"
      >
        <div className="min-w-0">
          <div className="font-medium text-sm leading-tight truncate">{broker.name}</div>
          <div className="text-xs text-muted-foreground truncate">{broker.brokerage}</div>
        </div>

        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {broker.agent_count !== undefined && (
            <Badge className="bg-secondary text-foreground">
              <Users className="h-3 w-3" />
              {broker.agent_count}
            </Badge>
          )}
          {days !== null && (
            <Badge className={stalenessClasses(tone)}>
              <Calendar className="h-3 w-3" />
              {formatRelative(lastEntry?.date)}
            </Badge>
          )}
        </div>

        {broker.next_action && (
          <div className="mt-2 pt-2 border-t border-border/60 text-xs text-muted-foreground line-clamp-2">
            <span className="font-medium text-foreground">Next:</span> {broker.next_action}
          </div>
        )}
      </button>
    </div>
  )
}
