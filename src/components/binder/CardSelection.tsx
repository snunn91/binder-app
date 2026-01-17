"use client";

import * as React from "react";
import { Filter } from "lucide-react";
import CollapsiblePanel from "@/components/binder/CollapsiblePanel";
import FilterList from "@/components/binder/FilterList";
import SearchBar from "@/components/binder/SearchBar";
import useCardSearch, {
  type CardSearchPreview,
} from "@/lib/scrydex/useCardSearch";

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

  const [selectedCard, setSelectedCard] =
    React.useState<CardSearchPreview | null>(null);

  const [searchMode, setSearchMode] =
    React.useState<"cards" | "sets">("cards");

  return (
    <div className="w-full h-full overflow-hidden">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start min-w-0">
        <CollapsiblePanel
          title="Filters"
          triggerIcon={Filter}
          expandedWidth="w-48"
          collapsedWidth="w-14"
        >
          {(expanded) => (
            <FilterList
              expanded={expanded}
              mode={searchMode}
              onModeChange={setSearchMode}
              setsEnabled={false}
            />
          )}
        </CollapsiblePanel>

        <div className="flex-1 space-y-4 min-w-0">
          <SearchBar
            value={input}
            onChange={setInput}
            onSubmit={onSubmit}
            loading={loading}
            mode={searchMode}
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

          {loading ? (
            <div className="text-sm text-zinc-500">Searching…</div>
          ) : null}

          {!loading && query && results.length === 0 && !error ? (
            <div className="text-sm text-zinc-500">No results.</div>
          ) : null}

          {results.length > 0 ? (
            <>
              <div className="max-h-[calc(100vh-244px)] overflow-y-auto overflow-x-hidden pr-1">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 min-w-0">
                  {results.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => {
                        setSelectedCard(card);
                        onSelect?.(card);
                      }}
                      className="w-full overflow-hidden rounded-lg border border-zinc-200 bg-white text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
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

        <div className="w-full rounded-xl border border-zinc-300 bg-gray-50 p-4 shadow-sm dark:border-zinc-500 dark:bg-zinc-900/25 lg:w-80">
          <div className="text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
            Card Pile
          </div>
          {selectedCard ? (
            <div className="mt-4 space-y-3">
              <div className="aspect-[63/88] w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                {selectedCard.image?.large || selectedCard.image?.small ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      selectedCard.image?.large ??
                      selectedCard.image?.small ??
                      ""
                    }
                    alt={selectedCard.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                    No image
                  </div>
                )}
              </div>
              <div className="text-sm font-exo font-medium text-zinc-900 dark:text-white">
                {selectedCard.name}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-300">
                {selectedCard.expansion?.name ?? "Unknown set"}
                {selectedCard.number ? ` • #${selectedCard.number}` : ""}
                {selectedCard.rarity ? ` • ${selectedCard.rarity}` : ""}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm font-exo text-zinc-700 dark:text-slate-100">
              Select a card to preview it here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
