"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SearchCheck, SearchX, X } from "lucide-react";
import type { BinderCard } from "@/lib/firebase/services/binderService";

type SlotItemProps = {
  id: string;
  label: string;
  card: BinderCard | null;
  aspectClassName?: string;
  sizeClassName?: string;
  onAddCard?: () => void;
  onDeleteCard?: () => void;
  onToggleMissing?: () => void;
  isEditMode?: boolean;
};

export default function SlotItem({
  id,
  label,
  card,
  aspectClassName = "aspect-[2/3]",
  sizeClassName = "w-full",
  onAddCard,
  onDeleteCard,
  onToggleMissing,
  isEditMode = false,
}: SlotItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const isDragging = transform !== null;
  const imageSrc = card?.image?.small ?? card?.image?.large;
  const isDraggable = Boolean(card) && !isEditMode;
  const isMissing = (card?.collectionStatus ?? "collected") === "missing";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const cursorClassName = imageSrc
    ? "cursor-grab active:cursor-grabbing"
    : "cursor-default";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDraggable ? attributes : {})}
      {...(isDraggable ? listeners : {})}
      className={`group relative flex ${aspectClassName} ${sizeClassName} ${cursorClassName} items-center justify-center overflow-visible rounded-lg border border-zinc-300 bg-gray-50 text-xs font-exo text-zinc-700 shadow-sm dark:border-zinc-500 dark:bg-zinc-900/25 dark:text-slate-100 ${
        isDragging ? "border-dashed opacity-40" : ""
      }`}>
      <div className="relative h-full w-full overflow-hidden rounded-lg">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={card?.name ?? label}
            className={`h-full w-full object-cover ${isMissing ? "grayscale brightness-75" : ""}`}
            loading="lazy"
          />
        ) : (
          <>
            {card?.name ? (
              <div className="px-2 text-center">{card.name}</div>
            ) : null}
            {onAddCard ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onAddCard();
                }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border border-zinc-300 bg-slate-200 px-2 py-0.5 text-[10px] font-exo font-medium text-zinc-700 opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100">
                Add Card
              </button>
            ) : null}
          </>
        )}
      </div>
      {isEditMode && card && onDeleteCard ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDeleteCard();
          }}
          className="absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-red-500 bg-red-500 text-white shadow-sm transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent">
          <X className="h-3 w-3" />
          <span className="sr-only">Remove card</span>
        </button>
      ) : null}
      {isEditMode && card && onToggleMissing ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleMissing();
          }}
          title={isMissing ? "Mark as collected" : "Mark as missing"}
          aria-label={isMissing ? "Mark as collected" : "Mark as missing"}
          className={`absolute -right-2 top-4 z-10 flex h-5 w-5 items-center justify-center rounded-full border shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent ${
            isMissing
              ? "border-emerald-600 bg-emerald-500 text-white hover:bg-emerald-600"
              : "border-zinc-300 bg-slate-200 text-zinc-700 hover:bg-slate-300 dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600"
          }`}>
          {isMissing ? (
            <SearchCheck className="h-3 w-3" />
          ) : (
            <SearchX className="h-3 w-3" />
          )}
          <span className="sr-only">
            {isMissing ? "Mark as collected" : "Mark as missing"}
          </span>
        </button>
      ) : null}
    </div>
  );
}
