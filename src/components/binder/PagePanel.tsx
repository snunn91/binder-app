"use client";

import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type SensorDescriptor,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import DraggedSlot from "@/components/binder/DraggedSlot";
import SlotItem from "@/components/binder/SlotItem";

type BinderPage = {
  id: string;
  index: number;
  slots: number;
  cardOrder: (string | null)[];
};

type PagePanelProps = {
  page: BinderPage | null;
  slotOrder: string[];
  layoutColumns: number;
  sensors: SensorDescriptor<Record<string, unknown>>[];
  activeId: string | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: () => void;
};

export default function PagePanel({
  page,
  slotOrder,
  layoutColumns,
  sensors,
  activeId,
  onDragStart,
  onDragEnd,
  onDragCancel,
}: PagePanelProps) {
  if (!page) return null;

  const activeIndex = activeId ? slotOrder.indexOf(activeId) : -1;
  const activeLabel = activeIndex >= 0 ? `Slot ${activeIndex + 1}` : "";

  return (
    <div className="p-4 bg-gray-50 border border-zinc-300 rounded-xl shadow-lg dark:bg-zinc-900/25 dark:border-zinc-500">
      <p className="text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
        Page {page.index}
      </p>

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}>
        <SortableContext items={slotOrder} strategy={rectSortingStrategy}>
          <div
            className="mt-4 grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${layoutColumns}, minmax(0, 1fr))`,
            }}>
            {slotOrder.map((id, index) => (
              <SlotItem key={id} id={id} label={`Slot ${index + 1}`} />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId && slotOrder.includes(activeId) ? (
            <div className="rotate-[20deg]">
              <DraggedSlot label={activeLabel} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
