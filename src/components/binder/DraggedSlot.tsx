"use client";

export default function DraggedSlot({ label }: { label: string }) {
  return (
    <div className="flex aspect-[2/3] items-center justify-center rounded-lg border border-zinc-300 bg-gray-50 text-xs font-exo text-zinc-700 shadow-sm dark:border-zinc-500 dark:bg-zinc-900/25 dark:text-slate-100">
      {label}
    </div>
  );
}
