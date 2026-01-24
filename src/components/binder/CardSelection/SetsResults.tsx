"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
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
  pageSize,
}: SetsResultsProps) {
  const skeletons = React.useMemo(
    () => Array.from({ length: pageSize }, (_, index) => index),
    [pageSize],
  );
  const groupedSets = React.useMemo(() => {
    if (view !== "sets") return [];
    const groups = new Map<string, SetSearchPreview[]>();
    (results as SetSearchPreview[]).forEach((set) => {
      const key = set.series?.trim() || "Other";
      const group = groups.get(key);
      if (group) {
        group.push(set);
      } else {
        groups.set(key, [set]);
      }
    });
    return Array.from(groups.entries());
  }, [results, view]);

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
          {/* {view === "sets" ? (
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
          )} */}

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
        {loading ? (
          <div className="max-h-[calc(100vh-268px)] overflow-y-auto overflow-x-hidden pr-1">
            {view === "sets" ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 min-w-0">
                {skeletons.map((key) => (
                  <div
                    key={key}
                    className="flex h-44 flex-col rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="flex h-16 items-center justify-center">
                      <Skeleton className="h-10 w-24" />
                    </div>
                    <div className="mt-2 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="mt-3 border-t border-zinc-200 pt-2 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-10" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 min-w-0">
                {skeletons.map((key) => (
                  <div
                    key={key}
                    className="w-full overflow-hidden rounded-lg border border-zinc-200 bg-white text-left shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                    <Skeleton className="aspect-[63/88] w-full" />
                    <div className="space-y-1 p-1.5">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {!loading && results.length === 0 && !error ? (
          <div className="text-sm text-zinc-500">No results.</div>
        ) : null}

        {!loading && results.length > 0 ? (
          <>
            <div className="max-h-[calc(100vh-268px)] overflow-y-auto overflow-x-hidden pr-1">
              {view === "sets" ? (
                <div className="space-y-4">
                  {groupedSets.map(([series, sets]) => (
                    <div key={series} className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        {series}
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 min-w-0">
                        {sets.map((set) => (
                          <button
                            key={set.id}
                            type="button"
                            onClick={() => onSelectSet(set)}
                            className="flex h-44 flex-col rounded-lg border border-zinc-200 bg-white p-3 text-left text-sm text-zinc-700 shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100">
                            <div className="flex h-16 items-center justify-center">
                              {set.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={set.logo}
                                  alt={`${set.name} logo`}
                                  className="h-10 w-auto object-contain"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="h-10 w-24 rounded-md bg-zinc-100 dark:bg-zinc-800" />
                              )}
                            </div>
                            <div className="mt-2">
                              <div className="line-clamp-2 text-sm font-medium text-zinc-900 dark:text-white">
                                {set.name}
                              </div>
                              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                {set.series ?? "—"}
                              </div>
                            </div>
                            <div className="mt-3 border-t border-zinc-200 pt-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                              <div className="flex items-center justify-between">
                                <span>
                                  {set.total !== undefined
                                    ? `${set.total} cards`
                                    : "— cards"}
                                </span>
                                <span>{set.releaseYear ?? "—"}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 min-w-0">
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
