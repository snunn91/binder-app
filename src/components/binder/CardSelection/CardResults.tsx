import * as React from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import Tilt from "react-parallax-tilt";
import type { CardSearchPreview } from "@/lib/scrydex/useCardSearch";

type CardResultsProps = {
  error: string | null;
  query: string;
  results: CardSearchPreview[];
  totalCount?: number;
  loading: boolean;
  startIndex: number;
  endIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
  page: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
  onSelectCard: (card: CardSearchPreview) => void;
};

export default function CardResults({
  error,
  query,
  results,
  totalCount,
  loading,
  startIndex,
  endIndex,
  hasPrev,
  hasNext,
  page,
  pageSize,
  onPrev,
  onNext,
  onSelectCard,
}: CardResultsProps) {
  const skeletons = React.useMemo(
    () => Array.from({ length: pageSize }, (_, index) => index),
    [pageSize],
  );

  return (
    <div className="flex flex-col gap-y-2">
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
                {startIndex}-{endIndex}
              </span>
            ) : (
              <span>-</span>
            )}
          </div>
        </div>
      ) : null}

      <>
        {loading ? (
          <div className="max-h-[calc(100vh-268px)] overflow-y-auto overflow-x-hidden pr-1 mb-1">
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
          </div>
        ) : null}

        {!loading && query && results.length === 0 && !error ? (
          <div className="text-sm text-zinc-500">No results.</div>
        ) : null}

        {!loading && results.length > 0 ? (
          <>
            <div className="max-h-[calc(100vh-268px)] overflow-y-auto overflow-x-hidden mb-1">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 min-w-0 pr-4">
                {results.map((card) => (
                  <Tilt
                    key={card.id}
                    tiltMaxAngleX={8}
                    tiltMaxAngleY={8}
                    glareEnable
                    glareMaxOpacity={0.2}
                    className="w-full">
                    <button
                      type="button"
                      onClick={() => onSelectCard(card)}
                      className="w-full overflow-hidden rounded-lg border border-zinc-200 bg-white text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-700 dark:bg-zinc-900">
                      <div className="relative aspect-[63/88] w-full bg-zinc-100 dark:bg-zinc-800">
                        {card.image?.small ? (
                          <Image
                            src={card.image.small}
                            alt={card.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            fill
                            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                            quality={90}
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
                          {card.number ? ` - #${card.number}` : ""}
                          {card.rarity ? ` - ${card.rarity}` : ""}
                        </div>
                      </div>
                    </button>
                  </Tilt>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onPrev}
                disabled={!hasPrev || loading}
                className="rounded-md border border-zinc-300 bg-slate-200 px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-slate-300 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-600 dark:bg-zinc-800 dark:text-slate-100 dark:hover:bg-zinc-700">
                Prev
              </button>

              <div className="text-sm text-zinc-600 dark:text-zinc-300">
                Page <span className="font-medium">{page}</span>
              </div>

              <button
                type="button"
                onClick={onNext}
                disabled={!hasNext || loading}
                className="rounded-md border border-zinc-300 bg-slate-200 px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-slate-300 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-600 dark:bg-zinc-800 dark:text-slate-100 dark:hover:bg-zinc-700">
                Next
              </button>
            </div>
          </>
        ) : null}
      </>
    </div>
  );
}
