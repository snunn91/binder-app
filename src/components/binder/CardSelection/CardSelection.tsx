"use client";

import * as React from "react";
import { Filter } from "lucide-react";
import FilterList from "@/components/filters/FilterList";
import SearchBar from "@/components/binder/SearchBar";
import useCardSearch, {
  type CardSearchPreview,
} from "@/lib/scrydex/useCardSearch";
import CardResults from "@/components/binder/CardSelection/CardResults";
import SetsResults from "@/components/binder/CardSelection/SetsResults";

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

  const [searchMode, setSearchMode] = React.useState<"cards" | "sets">("cards");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const handleFilterExpandedChange = React.useCallback(() => undefined, []);

  return (
    <div className="flex h-full w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="flex h-full min-w-0 flex-1 flex-col divide-y divide-zinc-200 dark:divide-zinc-800 lg:flex-row lg:divide-x lg:divide-y-0">
        <div className="flex flex-col gap-3 p-3">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 bg-slate-200 text-zinc-800 shadow-sm transition hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-600 dark:bg-zinc-800 dark:text-slate-100 dark:hover:bg-zinc-700"
            aria-expanded={filtersOpen}
            aria-controls="filter-list">
            <Filter className="h-4 w-4" />
            <span className="sr-only">
              {filtersOpen ? "Hide filters" : "Show filters"}
            </span>
          </button>

          {filtersOpen ? (
            <div id="filter-list" className="w-48 ">
              <FilterList
                expanded
                onExpandedChange={handleFilterExpandedChange}
                showLabels
              />
            </div>
          ) : null}
        </div>

        <div className="flex-1 min-w-0 p-3">
          <SearchBar
            value={input}
            onChange={setInput}
            onSubmit={onSubmit}
            loading={loading}
            mode={searchMode}
            onModeChange={setSearchMode}
          />

          {searchMode === "sets" ? (
            <SetsResults />
          ) : (
            <CardResults
              error={error}
              query={query}
              results={results}
              totalCount={totalCount}
              loading={loading}
              startIndex={startIndex}
              endIndex={endIndex}
              hasPrev={hasPrev}
              hasNext={hasNext}
              page={page}
              onPrev={onPrev}
              onNext={onNext}
              onSelectCard={(card) => {
                setSelectedCard(card);
                onSelect?.(card);
              }}
            />
          )}
        </div>

        <div className="w-full p-3 lg:w-80">
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
                {selectedCard.number ? ` - #${selectedCard.number}` : ""}
                {selectedCard.rarity ? ` - ${selectedCard.rarity}` : ""}
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
