"use client";

import * as React from "react";
import { FunnelPlus, FunnelX } from "lucide-react";
import FilterList from "@/components/filters/FilterList";
import SearchBar from "@/components/binder/SearchBar";

import useCardSearch, {
  type CardSearchPreview as GlobalCardPreview,
} from "@/lib/scrydex/useCardSearch";
import useSetSearch, {
  type CardSearchPreview as SetCardPreview,
  type SetSearchPreview,
} from "@/lib/scrydex/useSetSearch";

import CardResults from "@/components/binder/CardSelection/CardResults";
import SetsResults from "@/components/binder/CardSelection/SetsResults";
import {
  DEFAULT_CARD_SORT,
  sanitizeSortForScope,
  type SearchSortOption,
  type SortScope,
} from "@/lib/scrydex/sort";

type CardSelectionProps = {
  onSelect?: (card: GlobalCardPreview) => void;
};

export default function CardSelection({ onSelect }: CardSelectionProps) {
  const [sortBy, setSortBy] = React.useState<SearchSortOption>(DEFAULT_CARD_SORT);
  const [selectedRarities, setSelectedRarities] = React.useState<string[]>([]);
  const cardSearch = useCardSearch(24, selectedRarities, sortBy);
  const setSearch = useSetSearch({
    setsPageSize: 15,
    cardsPageSize: 24,
    rarityFilters: selectedRarities,
    sortBy,
  });

  const [searchMode, setSearchMode] = React.useState<"cards" | "sets">("cards");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const handleFilterExpandedChange = React.useCallback(() => undefined, []);

  const [selectedCard, setSelectedCard] =
    React.useState<GlobalCardPreview | null>(null);
  const sortScope: SortScope =
    searchMode === "sets" && setSearch.view === "sets" ? "sets" : "cards";

  React.useEffect(() => {
    setSortBy((prev) => sanitizeSortForScope(prev, sortScope));
  }, [sortScope]);

  // Active search state depends on mode (independent!)
  const active = searchMode === "cards" ? cardSearch : setSearch;

  // pagination display for whichever mode is active
  const startIndex = (active.page - 1) * active.pageSize + 1;
  const endIndex = (active.page - 1) * active.pageSize + active.results.length;
  const hasPrev = active.page > 1;
  const hasNext =
    active.totalCount === undefined
      ? active.results.length === active.pageSize
      : endIndex < active.totalCount;

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
            {filtersOpen ? (
              <FunnelX className="h-4 w-4" />
            ) : (
              <FunnelPlus className="h-4 w-4" />
            )}
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
                sortScope={sortScope}
                sortBy={sortBy}
                onSortChange={setSortBy}
                selectedRarities={selectedRarities}
                onSelectedRaritiesChange={setSelectedRarities}
                showRarityFilter={
                  searchMode === "cards" || setSearch.view === "setCards"
                }
              />
            </div>
          ) : null}
        </div>

        <div className="flex-1 min-w-0 p-3 space-y-4">
          <SearchBar
            key={searchMode}
            value={active.input}
            onChange={active.setInput}
            onSubmit={active.onSubmit}
            loading={active.loading}
            mode={searchMode}
            onModeChange={(mode) => {
              setSearchMode(mode);

              // When user goes back to Cards mode, reset to the default card page size.
              if (mode === "cards") {
                setSelectedCard(null);
                cardSearch.reset();
              }

              // When switching into Sets mode, default sets list is already handled by setSearch.
              // We DO NOT reset sets here because user might be mid-browse.
            }}
          />

          {searchMode === "sets" ? (
            <SetsResults
              view={setSearch.view}
              selectedSet={setSearch.selectedSet}
              results={
                setSearch.results as Array<SetSearchPreview | SetCardPreview>
              }
              totalCount={setSearch.totalCount}
              loading={setSearch.loading}
              error={setSearch.error}
              page={setSearch.page}
              pageSize={setSearch.pageSize}
              startIndex={startIndex}
              endIndex={endIndex}
              hasPrev={hasPrev}
              hasNext={hasNext}
              onPrev={setSearch.onPrev}
              onNext={setSearch.onNext}
              onSelectSet={(set) => setSearch.selectSet(set)}
              onBackToSets={() => setSearch.backToSets()}
              onSelectCard={(card) => {
                // selecting a card in Sets mode should still preview it on the right
                setSelectedCard(card as unknown as GlobalCardPreview);
                onSelect?.(card as unknown as GlobalCardPreview);
              }}
            />
          ) : (
            <CardResults
              error={cardSearch.error}
              query={cardSearch.query}
              results={cardSearch.results}
              totalCount={cardSearch.totalCount}
              loading={cardSearch.loading}
              startIndex={startIndex}
              endIndex={endIndex}
              hasPrev={hasPrev}
              hasNext={hasNext}
              page={cardSearch.page}
              pageSize={cardSearch.pageSize}
              onPrev={cardSearch.onPrev}
              onNext={cardSearch.onNext}
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
