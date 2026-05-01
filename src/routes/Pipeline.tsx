import { useState, useMemo } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor,
  useSensor, useSensors, closestCorners,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { Broker, Stage } from '@/lib/types'
import { useStore } from '@/lib/store'
import { STAGES, STAGE_DESCRIPTIONS } from '@/lib/constants'
import { KanbanColumn } from '@/components/KanbanColumn'
import { BrokerCard } from '@/components/BrokerCard'
import { BrokerDetailPanel } from '@/components/BrokerDetailPanel'
import { BrokerForm } from '@/components/BrokerForm'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function Pipeline() {
  const brokers = useStore(s => s.brokers)
  const log = useStore(s => s.log)
  const setBrokerStage = useStore(s => s.setBrokerStage)

  const [activeBroker, setActiveBroker] = useState<Broker | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const visibleBrokers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return brokers
    return brokers.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.brokerage.toLowerCase().includes(q) ||
      b.tags.some(t => t.toLowerCase().includes(q)) ||
      b.notes.toLowerCase().includes(q),
    )
  }, [brokers, search])

  const byStage = useMemo(() => {
    const result: Record<Stage, Broker[]> = { cold: [], warm: [], active: [], hot: [], won: [] }
    for (const b of visibleBrokers) result[b.stage].push(b)
    return result
  }, [visibleBrokers])

  const draggingBroker = activeId ? brokers.find(b => b.id === activeId) ?? null : null

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const activeBrokerId = String(active.id)
    const overData = over.data.current as { type?: string; stage?: Stage; broker?: Broker } | undefined
    let targetStage: Stage | undefined
    if (overData?.type === 'column') targetStage = overData.stage
    else if (overData?.type === 'broker' && overData.broker) targetStage = overData.broker.stage
    if (!targetStage) return
    const moving = brokers.find(b => b.id === activeBrokerId)
    if (moving && moving.stage !== targetStage) {
      setBrokerStage(activeBrokerId, targetStage)
    }
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="text-2xl font-bold leading-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">Drag broker cards between stages. {brokers.length} broker{brokers.length === 1 ? '' : 's'} total.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search name, brokerage, tag…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-56"
          />
          <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Broker</Button>
        </div>
      </div>

      {brokers.length === 0 ? (
        <EmptyState onAdd={() => setAdding(true)} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
            {STAGES.map(stage => (
              <div key={stage} className="flex flex-col gap-1.5">
                <KanbanColumn
                  stage={stage}
                  brokers={byStage[stage]}
                  log={log}
                  onCardClick={b => setActiveBroker(b)}
                />
                <p className="px-1 text-[10px] text-muted-foreground/70 max-w-[280px]">{STAGE_DESCRIPTIONS[stage]}</p>
              </div>
            ))}
          </div>
          <DragOverlay>
            {draggingBroker && (
              <BrokerCard broker={draggingBroker} log={log} onClick={() => {}} isOverlay />
            )}
          </DragOverlay>
        </DndContext>
      )}

      <BrokerDetailPanel broker={activeBroker} onClose={() => setActiveBroker(null)} />
      <BrokerForm open={adding} onOpenChange={setAdding} />
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex-1 grid place-items-center text-center">
      <div className="max-w-sm space-y-3">
        <div className="text-4xl">📥</div>
        <h2 className="text-lg font-semibold">No brokers in your pipeline yet</h2>
        <p className="text-sm text-muted-foreground">Add your first broker, or import an engagement-log.csv from the toolbar above.</p>
        <Button onClick={onAdd}><Plus className="h-4 w-4" />Add a broker</Button>
      </div>
    </div>
  )
}
