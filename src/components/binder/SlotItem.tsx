"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SlotItemProps = {
  id: string;
  label: string;
};

export default function SlotItem({ id, label }: SlotItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const isDragging = transform !== null;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex aspect-[2/3] items-center justify-center rounded-lg border border-zinc-300 bg-gray-50 text-xs font-exo text-zinc-700 shadow-sm dark:border-zinc-500 dark:bg-zinc-900/25 dark:text-slate-100 ${
        isDragging ? "border-dashed opacity-40" : ""
      }`}>
      {label}
    </div>
  );
}
