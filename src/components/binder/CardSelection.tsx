"use client";

import SearchBar from "@/components/binder/SearchBar";
import useCardSearch, { type CardSearchPreview } from "@/lib/scrydex/useCardSearch";

type CardSelectionProps = {
  onSelect?: (card: CardSearchPreview) => void;
};

export default function CardSelection({ onSelect }: CardSelectionProps) {
  const {
    input,
    setInput,
    query,
    page,
    results,
    totalCount,
    loading,
    error,
    onSubmit,
    onPrev,
    onNext,
    pageSize,
  } = useCardSearch(20);

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = (page - 1) * pageSize + results.length;
  const hasPrev = page > 1;
  const hasNext =
    totalCount === undefined
      ? results.length === pageSize
      : endIndex < totalCount;

  return (
    <div className="space-y-4">
      <SearchBar
        value={input}
        onChange={setInput}
        onSubmit={onSubmit}
        loading={loading}
        mode="cards"
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {query ? (
        <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300">
          <div>
            Results for{" "}
            <span className="font-medium text-zinc-900 dark:text-white">
              {query}
            </span>
            {totalCount !== undefined ? (
              <span className="ml-2 text-zinc-500 dark:text-zinc-400">
                ({totalCount.toLocaleString()} total)
              </span>
            ) : null}
          </div>

          <div className="text-zinc-500 dark:text-zinc-400">
            {results.length > 0 ? (
              <span>
                {startIndex}–{endIndex}
              </span>
            ) : (
              <span>—</span>
            )}
          </div>
        </div>
      ) : null}

      {loading ? <div className="text-sm text-zinc-500">Searching…</div> : null}

      {!loading && query && results.length === 0 && !error ? (
        <div className="text-sm text-zinc-500">No results.</div>
      ) : null}

      {results.length > 0 ? (
        <>
          <div className="max-h-[55vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onSelect?.(card)}
                  className="overflow-hidden rounded-lg border border-zinc-200 bg-white text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="aspect-[63/88] w-full bg-zinc-100 dark:bg-zinc-800">
                    {card.image?.small ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={card.image.small}
                        alt={card.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5 p-2">
                    <div className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                      {card.name}
                    </div>
                    <div className="truncate text-xs text-zinc-500">
                      {card.expansion?.name ?? "Unknown set"}
                      {card.number ? ` • #${card.number}` : ""}
                      {card.rarity ? ` • ${card.rarity}` : ""}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onPrev}
              disabled={!hasPrev || loading}
              className="rounded-md border border-zinc-300 bg-slate-200 px-3 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-slate-100">
              Prev
            </button>

            <div className="text-sm text-zinc-600 dark:text-zinc-300">
              Page <span className="font-medium">{page}</span>
            </div>

            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext || loading}
              className="rounded-md border border-zinc-300 bg-slate-200 px-3 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-slate-100">
              Next
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
