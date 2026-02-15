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
import type { BinderCard } from "@/lib/firebase/services/binderService";

type BinderPage = {
  id: string;
  index: number;
  slots: number;
  cardOrder: (BinderCard | null)[];
};

type PagePanelProps = {
  page: BinderPage | null;
  layoutColumns: number;
  sensors: SensorDescriptor<Record<string, unknown>>[];
  activeId: string | null;
  colorScheme?: string;
  onAddCard?: () => void;
  onDeleteCard?: (pageId: string, slotIndex: number) => void;
  onToggleMissing?: (pageId: string, slotIndex: number) => void;
  isEditMode?: boolean;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: () => void;
};

export default function PagePanel({
  page,
  layoutColumns,
  sensors,
  activeId,
  colorScheme = "default",
  onAddCard,
  onDeleteCard,
  onToggleMissing,
  isEditMode = false,
  onDragStart,
  onDragEnd,
  onDragCancel,
}: PagePanelProps) {
  if (!page) return null;

  const slotOrder = Array.from(
    { length: page.slots },
    (_, index) => `${page.id}-slot-${index + 1}`,
  );
  const isTwoByTwoLayout = layoutColumns === 2;
  const isFourByFourLayout = layoutColumns === 4;
  const isThreeByThreeLayout = layoutColumns === 3;
  const activeIndex = activeId ? slotOrder.indexOf(activeId) : -1;
  const activeLabel = activeIndex >= 0 ? `Slot ${activeIndex + 1}` : "";
  const activeCard =
    activeIndex >= 0 ? (page.cardOrder?.[activeIndex] ?? null) : null;
  const panelPaddingClassName = isFourByFourLayout ? "p-2" : "p-3";
  const gridGapClassName = isTwoByTwoLayout
    ? "gap-x-2 gap-y-7"
    : isFourByFourLayout
      ? "gap-2"
      : "gap-2";
  const slotAspectClassName = isFourByFourLayout
    ? "aspect-[3/4]"
    : isTwoByTwoLayout
      ? "aspect-[73/100]"
      : isThreeByThreeLayout
        ? "aspect-[7/10]"
        : "aspect-[2/3]";
  const slotSizeClassName = isTwoByTwoLayout
    ? "w-[84%] justify-self-center"
    : isFourByFourLayout
      ? "w-[92%] justify-self-center"
      : isThreeByThreeLayout
        ? "w-[84%] justify-self-center"
        : "w-full";
  const panelColorSchemeClassName =
    {
      default:
        "bg-gray-50 border-zinc-300 dark:bg-zinc-900/25 dark:border-zinc-500",
      red: "bg-red-950/25 border-transparent",
      blue: "bg-blue-950/25 border-transparent",
      green: "bg-green-950/25 border-transparent",
      yellow: "bg-yellow-950/25 border-transparent",
    }[colorScheme] ??
    "bg-gray-50 border-zinc-300 dark:bg-zinc-900/25 dark:border-zinc-500";

  return (
    <div
      className={`${panelPaddingClassName} ${panelColorSchemeClassName} rounded-xl border shadow-lg`}>
      {/* <p className="text-xs font-exo font-medium text-zinc-700 dark:text-slate-100">
        Page {page.index}
      </p> */}

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}>
        <SortableContext items={slotOrder} strategy={rectSortingStrategy}>
          <div
            className={`${isFourByFourLayout ? "mt-2" : "mt-3"} grid ${gridGapClassName}`}
            style={{
              gridTemplateColumns: `repeat(${layoutColumns}, minmax(0, 1fr))`,
            }}>
            {slotOrder.map((id, index) => (
              <SlotItem
                key={id}
                id={id}
                label={`Slot ${index + 1}`}
                card={page.cardOrder?.[index] ?? null}
                aspectClassName={slotAspectClassName}
                sizeClassName={slotSizeClassName}
                onAddCard={page.cardOrder?.[index] ? undefined : onAddCard}
                onDeleteCard={
                  page.cardOrder?.[index]
                    ? () => onDeleteCard?.(page.id, index)
                    : undefined
                }
                onToggleMissing={
                  page.cardOrder?.[index]
                    ? () => onToggleMissing?.(page.id, index)
                    : undefined
                }
                isEditMode={isEditMode}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId && slotOrder.includes(activeId) ? (
            <div className="rotate-[20deg]">
              <DraggedSlot
                label={activeLabel}
                card={activeCard}
                aspectClassName={slotAspectClassName}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
