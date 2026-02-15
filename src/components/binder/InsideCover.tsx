"use client";

import { getBinderColorSchemeClasses } from "@/config/binderColorSchemes";

type InsideCoverProps = {
  colorScheme?: string;
  binderName?: string;
  filledSlots?: number;
  totalSlots?: number;
};

export default function InsideCover({
  colorScheme = "default",
  binderName,
  filledSlots = 0,
  totalSlots = 0,
}: InsideCoverProps) {
  const coverColorSchemeClassName =
    getBinderColorSchemeClasses(colorScheme).panel;
  const safeFilledSlots = Math.max(0, filledSlots);
  const safeTotalSlots = Math.max(0, totalSlots);
  const progressPercent =
    safeTotalSlots === 0
      ? 0
      : Math.min(100, Math.round((safeFilledSlots / safeTotalSlots) * 100));

  return (
    <div
      className={`${coverColorSchemeClassName} flex flex-col justify-between rounded-xl border p-6 shadow-lg`}>
      <p className="text-center text-5xl font-exo font-semibold tracking-wide text-zinc-700 dark:text-slate-100">
        {binderName || "Binder"}
      </p>
      <div className="mx-auto mt-8 w-full max-w-md">
        <div className="mb-2 flex items-center justify-between text-xs font-exo font-medium text-zinc-700 dark:text-slate-100">
          <span>Binder progress</span>
          <span>
            {safeFilledSlots}/{safeTotalSlots}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-right text-xs font-exo font-medium text-zinc-600 dark:text-slate-200">
          {progressPercent}% filled
        </p>
      </div>
    </div>
  );
}
