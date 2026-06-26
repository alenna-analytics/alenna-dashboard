import { useCallback, useState, type ReactNode } from 'react'
import { GripVertical } from 'lucide-react'

import type { HomeV2KpiCardId } from '@/pages/dashboard/home-v2-kpi-card-order'
import { isHomeV2KpiCardId, reorderHomeV2KpiCards } from '@/pages/dashboard/home-v2-kpi-card-order'
import { cn } from '@/lib/utils'

const KPI_DRAG_MIME = 'application/x-alenna-home-v2-kpi-id'

export type HomeV2KpiSortableGridProps = {
  order: HomeV2KpiCardId[]
  onOrderChange: (next: HomeV2KpiCardId[]) => void
  dragHandleAriaLabel: string
  renderCard: (id: HomeV2KpiCardId, dragHandle: ReactNode) => ReactNode
  className?: string
}

function readDraggedCardId(dataTransfer: DataTransfer): HomeV2KpiCardId | null {
  const raw =
    dataTransfer.getData(KPI_DRAG_MIME) || dataTransfer.getData('text/plain')
  return isHomeV2KpiCardId(raw) ? raw : null
}

export function HomeV2KpiSortableGrid({
  order,
  onOrderChange,
  dragHandleAriaLabel,
  renderCard,
  className,
}: HomeV2KpiSortableGridProps) {
  const [draggingId, setDraggingId] = useState<HomeV2KpiCardId | null>(null)
  const [overId, setOverId] = useState<HomeV2KpiCardId | null>(null)

  const finishDrag = useCallback(() => {
    setDraggingId(null)
    setOverId(null)
  }, [])

  const handleDragOver = useCallback(
    (id: HomeV2KpiCardId) => (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      setOverId(id)
    },
    [],
  )

  const handleDrop = useCallback(
    (id: HomeV2KpiCardId) => (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const activeId = readDraggedCardId(event.dataTransfer)
      finishDrag()
      if (!activeId || activeId === id) return
      onOrderChange(reorderHomeV2KpiCards(order, activeId, id))
    },
    [finishDrag, onOrderChange, order],
  )

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4',
        className,
      )}
      onDragOver={(event) => event.preventDefault()}
    >
      {order.map((id) => {
        const dragHandle = (
          <span
            data-kpi-drag-handle
            draggable
            role="button"
            tabIndex={0}
            aria-label={dragHandleAriaLabel}
            className="inline-flex shrink-0 touch-none cursor-grab select-none items-center justify-center rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-text-secondary active:cursor-grabbing"
            onDragStart={(event) => {
              event.stopPropagation()
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData(KPI_DRAG_MIME, id)
              event.dataTransfer.setData('text/plain', id)
              const shell = event.currentTarget.closest('[data-kpi-card-shell]')
              if (shell instanceof HTMLElement && event.dataTransfer.setDragImage) {
                event.dataTransfer.setDragImage(shell, 24, 24)
              }
              setDraggingId(id)
              setOverId(id)
            }}
            onDragEnd={finishDrag}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <GripVertical
              className="pointer-events-none size-3.5"
              strokeWidth={2.5}
              aria-hidden
            />
          </span>
        )

        return (
          <div
            key={id}
            data-kpi-card-slot={id}
            onDragEnter={(event) => {
              event.preventDefault()
              setOverId(id)
            }}
            onDragOver={handleDragOver(id)}
            onDrop={handleDrop(id)}
            className={cn(
              'min-w-0 transition-shadow',
              draggingId === id && 'opacity-60',
              overId === id &&
                draggingId &&
                draggingId !== id &&
                'rounded-md ring-2 ring-ring/45 ring-offset-2 ring-offset-white',
            )}
          >
            {renderCard(id, dragHandle)}
          </div>
        )
      })}
    </div>
  )
}
