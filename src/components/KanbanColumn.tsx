import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Broker, EngagementEntry, Stage } from '@/lib/types'
import { STAGE_COLORS, STAGE_LABELS } from '@/lib/constants'
import { BrokerCard } from './BrokerCard'
import { cn } from '@/lib/utils'

interface Props {
  stage: Stage
  brokers: Broker[]
  log: EngagementEntry[]
  onCardClick: (b: Broker) => void
}

export function KanbanColumn({ stage, brokers, log, onCardClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage, data: { type: 'column', stage } })
  const palette = STAGE_COLORS[stage]
  return (
    <div className="flex flex-col min-w-[260px] w-[280px] shrink-0">
      <div className={cn('rounded-t-md px-3 py-2 flex items-center justify-between text-sm font-semibold', palette.bg, palette.text)}>
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', palette.bar)} />
          {STAGE_LABELS[stage]}
        </div>
        <span className="text-xs font-normal opacity-70">{brokers.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[200px] rounded-b-md border border-t-0 border-border p-2 space-y-2 transition-colors',
          isOver && 'bg-primary/5 ring-1 ring-primary/30',
        )}
      >
        <SortableContext items={brokers.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {brokers.map(broker => (
            <BrokerCard key={broker.id} broker={broker} log={log} onClick={() => onCardClick(broker)} />
          ))}
        </SortableContext>
        {brokers.length === 0 && (
          <div className="h-full grid place-items-center text-xs text-muted-foreground/60 italic py-8">
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}
