"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BinderCard } from "@/lib/firebase/services/binderService";

type SlotItemProps = {
  id: string;
  label: string;
  card: BinderCard | null;
  aspectClassName?: string;
  sizeClassName?: string;
};

export default function SlotItem({
  id,
  label,
  card,
  aspectClassName = "aspect-[2/3]",
  sizeClassName = "w-full",
}: SlotItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const isDragging = transform !== null;
  const imageSrc = card?.image?.small ?? card?.image?.large;

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
      className={`relative flex ${aspectClassName} ${sizeClassName} items-center justify-center overflow-hidden rounded-lg border border-zinc-300 bg-gray-50 text-xs font-exo text-zinc-700 shadow-sm dark:border-zinc-500 dark:bg-zinc-900/25 dark:text-slate-100 ${
        isDragging ? "border-dashed opacity-40" : ""
      }`}>
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={card?.name ?? label}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="px-2 text-center">{card?.name ?? label}</div>
      )}
    </div>
  );
}
