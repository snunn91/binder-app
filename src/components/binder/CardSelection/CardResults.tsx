import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Tilt from "react-parallax-tilt";
import type { CardSearchPreview } from "@/lib/scrydex/useCardSearch";
import CardItem from "@/components/binder/CardSelection/CardItem";
import type { LayoutMode } from "@/components/binder/LayoutModeToggle";

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
  selectedCardIds: Set<string>;
  selectionLocked: boolean;
  layoutMode: LayoutMode;
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
  selectedCardIds,
  selectionLocked,
  layoutMode,
}: CardResultsProps) {
  const skeletons = React.useMemo(
    () => Array.from({ length: pageSize }, (_, index) => index),
    [pageSize],
  );
  const appButtonClassName =
    "relative flex items-center overflow-hidden rounded-full border border-zinc-300 bg-slate-200 px-4 py-2 text-sm font-exo font-medium text-zinc-700 disabled:text-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 before:transition-all before:duration-500 hover:text-slate-100 hover:before:w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:before:w-0 disabled:before:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:disabled:text-slate-100 dark:before:bg-slate-100 dark:hover:text-zinc-700";

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
          <div className="max-h-[calc(100vh-265px)] overflow-y-auto overflow-x-hidden pr-1 mb-1">
            <div
              className={
                layoutMode === "grid"
                  ? "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 min-w-0"
                  : "space-y-2"
              }>
              {skeletons.map((key) => (
                <div
                  key={key}
                  className={
                    layoutMode === "grid"
                      ? "w-full overflow-hidden rounded-lg border border-zinc-200 bg-white text-left shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                      : "w-full rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                  }>
                  {layoutMode === "grid" ? (
                    <>
                      <Skeleton className="aspect-[63/88] w-full" />
                      <div className="space-y-1 p-1.5">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  )}
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
            <div className="max-h-[calc(100vh-265px)] overflow-y-auto overflow-x-hidden mb-1">
              <div
                className={
                  layoutMode === "grid"
                    ? "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 min-w-0 pr-4"
                    : "space-y-2 pr-4"
                }>
                {results.map((card) => {
                  const isSelected = selectedCardIds.has(card.id);
                  const isDisabled = selectionLocked && !isSelected;
                  return layoutMode === "grid" ? (
                    <Tilt
                      key={card.id}
                      tiltMaxAngleX={8}
                      tiltMaxAngleY={8}
                      glareEnable
                      glareMaxOpacity={0.2}
                      className="w-full">
                      <button
                        type="button"
                        disabled={isDisabled}
                        onClick={() => onSelectCard(card)}
                        className={`w-full overflow-hidden rounded-lg bg-white text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:ring-2 active:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900 ${
                          isSelected
                            ? "border-[3px] border-accent"
                            : "border border-zinc-200 dark:border-zinc-700"
                        }`}>
                        <CardItem card={card} />
                      </button>
                    </Tilt>
                  ) : (
                    <button
                      key={card.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => onSelectCard(card)}
                      className={`w-full rounded-lg bg-white p-2 text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:ring-2 active:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900 ${
                        isSelected
                          ? "border-2 border-accent"
                          : "border border-zinc-200 dark:border-zinc-700"
                      }`}>
                      <div className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                        {card.name}
                      </div>
                      <div className="truncate text-xs text-zinc-500 dark:text-zinc-300">
                        {card.expansion?.name ?? "Unknown set"}
                        {card.number ? ` • #${card.number}` : ""}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onPrev}
                disabled={!hasPrev || loading}
                className={appButtonClassName}>
                <span className="relative z-10">Prev</span>
              </button>

              <div className="text-sm text-zinc-600 dark:text-zinc-300">
                Page <span className="font-medium">{page}</span>
              </div>

              <button
                type="button"
                onClick={onNext}
                disabled={!hasNext || loading}
                className={appButtonClassName}>
                <span className="relative z-10">Next</span>
              </button>
            </div>
          </>
        ) : null}
      </>
    </div>
  );
}
