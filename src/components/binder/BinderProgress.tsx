"use client";

type BinderProgressProps = {
  filledSlots?: number;
  totalSlots?: number;
};

export default function BinderProgress({
  filledSlots = 0,
  totalSlots = 0,
}: BinderProgressProps) {
  const safeFilledSlots = Math.max(0, filledSlots);
  const safeTotalSlots = Math.max(0, totalSlots);
  const progressPercent =
    safeTotalSlots === 0
      ? 0
      : Math.min(100, Math.round((safeFilledSlots / safeTotalSlots) * 100));

  return (
    <section className="mt-4">
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
    </section>
  );
}
