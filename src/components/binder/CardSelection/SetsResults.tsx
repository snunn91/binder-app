"use client";

import * as React from "react";
import type {
  SetSearchPreview,
  CardSearchPreview,
} from "@/lib/scrydex/useSetSearch";

type SetsResultsProps = {
  view: "sets" | "setCards";
  selectedSet: SetSearchPreview | null;

  results: Array<SetSearchPreview | CardSearchPreview>;
  totalCount?: number;
  loading: boolean;
  error: string | null;

  page: number;
  pageSize: number;
  hasPrev: boolean;
  hasNext: boolean;
  startIndex: number;
  endIndex: number;

  onPrev: () => void;
  onNext: () => void;

  onSelectSet: (set: SetSearchPreview) => void;
  onBackToSets: () => void;

  onSelectCard: (card: CardSearchPreview) => void;
};

export default function SetsResults({
  view,
  selectedSet,
  results,
  totalCount,
  loading,
  error,
  page,
  hasPrev,
  hasNext,
  startIndex,
  endIndex,
  onPrev,
  onNext,
  onSelectSet,
  onBackToSets,
  onSelectCard,
}: SetsResultsProps) {
  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {view === "setCards" && selectedSet ? (
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Viewing cards from {selectedSet.name}.</span>
          <button
            type="button"
            onClick={onBackToSets}
            className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-600 dark:bg-zinc-900 dark:text-slate-200 dark:hover:bg-zinc-800">
            Back to sets
          </button>
        </div>
      ) : null}

      <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300">
        <div>
          {view === "sets" ? (
            <span className="font-medium text-zinc-900 dark:text-white">
              Sets
            </span>
          ) : (
            <>
              Cards in{" "}
              <span className="font-medium text-zinc-900 dark:text-white">
                {selectedSet?.name ?? "Set"}
              </span>
            </>
          )}

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

      <div className="rounded-xl border border-zinc-200 bg-white/80 p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        {loading ? <div className="text-sm text-zinc-500">Loading…</div> : null}

        {!loading && results.length === 0 && !error ? (
          <div className="text-sm text-zinc-500">No results.</div>
        ) : null}

        {results.length > 0 ? (
          <>
            <div className="max-h-[calc(100vh-268px)] overflow-y-auto overflow-x-hidden pr-1">
              {view === "sets" ? (
                <div className="grid grid-cols-4 gap-2">
                  {(results as SetSearchPreview[]).map((set) => (
                    <button
                      key={set.id}
                      type="button"
                      onClick={() => onSelectSet(set)}
                      className="flex flex-col items-start gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-700 shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100">
                      <div className="font-medium">{set.name}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {set.releaseYear ?? "—"}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 min-w-0">
                  {(results as CardSearchPreview[]).map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => onSelectCard(card)}
                      className="w-full overflow-hidden rounded-lg border border-zinc-200 bg-white text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-700 dark:bg-zinc-900">
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

                      <div className="space-y-0.5 p-1.5">
                        <div className="truncate text-xs font-medium text-zinc-900 dark:text-white">
                          {card.name}
                        </div>
                        <div className="truncate text-[11px] text-zinc-500">
                          {card.expansion?.name ?? "Unknown set"}
                          {card.number ? ` • #${card.number}` : ""}
                          {card.rarity ? ` • ${card.rarity}` : ""}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onPrev}
                disabled={!hasPrev || loading}
                className="rounded-md border border-zinc-300 bg-slate-200 px-3 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-600 dark:bg-zinc-800 dark:text-slate-100">
                Prev
              </button>

              <div className="text-sm text-zinc-600 dark:text-zinc-300">
                Page <span className="font-medium">{page}</span>
              </div>

              <button
                type="button"
                onClick={onNext}
                disabled={!hasNext || loading}
                className="rounded-md border border-zinc-300 bg-slate-200 px-3 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-600 dark:bg-zinc-800 dark:text-slate-100">
                Next
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
