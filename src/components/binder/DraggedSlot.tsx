"use client";

import type { BinderCard } from "@/lib/firebase/services/binderService";

type DraggedSlotProps = {
  label: string;
  card: BinderCard | null;
};

export default function DraggedSlot({ label, card }: DraggedSlotProps) {
  const imageSrc = card?.image?.small ?? card?.image?.large;

  return (
    <div className="relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-lg border border-zinc-300 bg-gray-50 text-xs font-exo text-zinc-700 shadow-sm dark:border-zinc-500 dark:bg-zinc-900/25 dark:text-slate-100">
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={card?.name ?? label}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="px-2 text-center">{card?.name ?? label}</span>
      )}
    </div>
  );
}
