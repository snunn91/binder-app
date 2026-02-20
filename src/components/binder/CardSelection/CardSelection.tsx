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
import CardPile from "@/components/binder/CardSelection/CardPile";
import {
  DEFAULT_CARD_SORT,
  sanitizeSortForScope,
  type SearchSortOption,
  type SortScope,
} from "@/lib/scrydex/sort";

type CardSelectionProps = {
  onSelect?: (card: GlobalCardPreview) => void;
  onAddCards?: (items: CardPileEntry[]) => void | Promise<void>;
  onAddToBulkBox?: (items: CardPileEntry[]) => void | Promise<void>;
  maxCardsInPile?: number;
};

export type CardPileEntry = {
  card: GlobalCardPreview;
  quantity: number;
};

export default function CardSelection({
  onSelect,
  onAddCards,
  onAddToBulkBox,
  maxCardsInPile,
}: CardSelectionProps) {
  const [sortBy, setSortBy] =
    React.useState<SearchSortOption>(DEFAULT_CARD_SORT);
  const [selectedRarities, setSelectedRarities] = React.useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
  const cardSearch = useCardSearch(24, selectedRarities, selectedTypes, sortBy);
  const setSearch = useSetSearch({
    setsPageSize: 15,
    cardsPageSize: 24,
    rarityFilters: selectedRarities,
    typeFilters: selectedTypes,
    sortBy,
  });

  const [searchMode, setSearchMode] = React.useState<"cards" | "sets">("cards");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const handleFilterExpandedChange = React.useCallback(() => undefined, []);

  const [pileItems, setPileItems] = React.useState<CardPileEntry[]>([]);
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
  const selectedCardIds = React.useMemo(
    () => new Set(pileItems.map((item) => item.card.id)),
    [pileItems],
  );
  const totalCardsInPile = React.useMemo(
    () => pileItems.reduce((sum, item) => sum + item.quantity, 0),
    [pileItems],
  );
  const pileLimit = maxCardsInPile ?? Number.POSITIVE_INFINITY;
  const isPileAtLimit = totalCardsInPile >= pileLimit;

  const incrementCardInPile = React.useCallback(
    (card: GlobalCardPreview) => {
      let added = false;
      setPileItems((prev) => {
        const total = prev.reduce((sum, item) => sum + item.quantity, 0);
        if (total >= pileLimit) return prev;

        const index = prev.findIndex((item) => item.card.id === card.id);
        if (index >= 0) {
          return prev.map((item, itemIndex) =>
            itemIndex === index
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          );
        }

        if (prev.length >= pileLimit) return prev;
        added = true;
        return [...prev, { card, quantity: 1 }];
      });
      if (added) onSelect?.(card);
    },
    [onSelect, pileLimit],
  );

  const toggleCardInPile = React.useCallback(
    (card: GlobalCardPreview) => {
      let added = false;
      setPileItems((prev) => {
        const index = prev.findIndex((item) => item.card.id === card.id);
        if (index >= 0) {
          return prev.filter((item) => item.card.id !== card.id);
        }

        const total = prev.reduce((sum, item) => sum + item.quantity, 0);
        if (total >= pileLimit) return prev;

        added = true;
        return [...prev, { card, quantity: 1 }];
      });
      if (added) onSelect?.(card);
    },
    [onSelect, pileLimit],
  );

  const decrementCardInPile = React.useCallback((cardId: string) => {
    setPileItems((prev) =>
      prev
        .map((item) =>
          item.card.id === cardId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

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
                selectedTypes={selectedTypes}
                onSelectedTypesChange={setSelectedTypes}
                showRarityFilter={
                  searchMode === "cards" || setSearch.view === "setCards"
                }
                showTypeFilter={
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
              selectedCardIds={selectedCardIds}
              selectionLocked={isPileAtLimit}
              onSelectCard={(card) => {
                toggleCardInPile(card as unknown as GlobalCardPreview);
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
              selectedCardIds={selectedCardIds}
              selectionLocked={isPileAtLimit}
              onSelectCard={(card) => {
                toggleCardInPile(card);
              }}
            />
          )}
        </div>

        <CardPile
          items={pileItems}
          totalCardsInPile={totalCardsInPile}
          pileLimit={pileLimit}
          isPileAtLimit={isPileAtLimit}
          onIncrementCard={incrementCardInPile}
          onDecrementCard={decrementCardInPile}
          onClearAll={() => setPileItems([])}
          onAddCards={() => void onAddCards?.(pileItems)}
          onAddToBulkBox={
            onAddToBulkBox
              ? () => void onAddToBulkBox(pileItems)
              : undefined
          }
        />
      </div>
    </div>
  );
}
