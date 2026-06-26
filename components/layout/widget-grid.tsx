"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "dashboard-widgets"

interface SavedState {
  order?: string[]
  collapsed?: string[]
}

function loadSavedState(): SavedState {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveState(order: string[], collapsed: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ order, collapsed }))
}

export interface WidgetConfig {
  id: string
}

interface WidgetGridProps {
  items: WidgetConfig[]
  className?: string
  renderWidget: (id: string) => React.ReactNode
  onOrderChange?: (ids: string[]) => void
}

export function WidgetGrid({
  items: configItems,
  className,
  renderWidget,
  onOrderChange,
}: WidgetGridProps) {
  const defaultOrder = configItems.map((w) => w.id)

  const [items, setItems] = useState<string[]>(() => {
    const saved = loadSavedState()
    return saved.order && saved.order.length === configItems.length
      ? saved.order
      : defaultOrder
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setItems((prev) => {
        const oldIndex = prev.indexOf(active.id as string)
        const newIndex = prev.indexOf(over.id as string)
        const newOrder = arrayMove(prev, oldIndex, newIndex)
        saveState(newOrder, [])
        onOrderChange?.(newOrder)
        return newOrder
      })
    },
    [onOrderChange]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <div className={cn("grid gap-4", className)}>
          {items.map((id) => (
            <SortableWidget key={id} id={id}>
              <div className="relative">
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <div />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 cursor-grab active:cursor-grabbing"
                    aria-label="Arrastar widget"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <div className="px-5 pb-5">{renderWidget(id)}</div>
              </div>
            </SortableWidget>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

interface SortableWidgetProps {
  id: string
  children: React.ReactNode
}

function SortableWidget({ id, children }: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div
        className={cn(
          "rounded-lg border bg-card transition-shadow",
          "hover:shadow-md hover:border-indigo-200/50"
        )}
      >
        {children}
      </div>
    </div>
  )
}
