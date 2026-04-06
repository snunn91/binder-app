"use client";

type BinderValueProps = {
  binderTotalUsd?: number;
};

export default function BinderValue({ binderTotalUsd = 0 }: BinderValueProps) {
  const formattedBinderTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.max(0, binderTotalUsd));

  return (
    <section className="mt-1">
      <div className="mb-2 flex items-center justify-between text-xs font-nunito font-medium text-zinc-700 dark:text-slate-100">
        <div className="flex items-center gap-1.5">
          <h3 className="text-lg font-semibold">Binder value</h3>
          <span className="group relative inline-flex">
            <sup
              aria-label="Pricing info"
              className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-zinc-400 text-[10px] font-semibold text-zinc-600 dark:border-zinc-500 dark:text-zinc-300">
              i
            </sup>
            <p
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-[11px] font-normal leading-4 text-zinc-700 opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200">
              Prices are shown in USD and may not be 100% accurate. Check
              TCGPlayer for the most accurate pricing.
            </p>
          </span>
        </div>
        <span className="font-semibold">
          {formattedBinderTotal} <span>usd</span>
        </span>
      </div>
    </section>
  );
}
