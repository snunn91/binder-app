"use client";

import SortByFilter from "@/components/filters/SortByFilter";
import RarityFilter from "@/components/filters/RarityFilter";
import TypeFilter from "@/components/filters/TypeFilter";
import QuickJumpSets from "@/components/filters/QuickJumpSets";
import type { SearchSortOption, SortScope } from "@/lib/scrydex/sort";

type FilterListProps = {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  showLabels: boolean;
  sortScope: SortScope;
  sortBy: SearchSortOption;
  onSortChange: (sort: SearchSortOption) => void;
  selectedRarities: string[];
  onSelectedRaritiesChange: (rarities: string[]) => void;
  selectedTypes: string[];
  onSelectedTypesChange: (types: string[]) => void;
  showRarityFilter?: boolean;
  showTypeFilter?: boolean;
  showSortFilter?: boolean;
  quickJumpSets?: Array<{ id: string; name: string }>;
  onQuickJumpSet?: (setId: string) => void;
};

export default function FilterList({
  expanded,
  onExpandedChange,
  showLabels,
  sortScope,
  sortBy,
  onSortChange,
  selectedRarities,
  onSelectedRaritiesChange,
  selectedTypes,
  onSelectedTypesChange,
  showRarityFilter = true,
  showTypeFilter = true,
  showSortFilter = true,
  quickJumpSets = [],
  onQuickJumpSet,
}: FilterListProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-y-3">
      {showSortFilter ? (
        <SortByFilter
          expanded={expanded}
          onExpandedChange={onExpandedChange}
          showLabels={showLabels}
          sortScope={sortScope}
          sortBy={sortBy}
          onSortChange={onSortChange}
        />
      ) : null}
      {showSortFilter && quickJumpSets.length > 0 && onQuickJumpSet ? (
        <>
          <div className="w-full border-t border-zinc-300 dark:border-zinc-600" />
          <QuickJumpSets sets={quickJumpSets} onJump={onQuickJumpSet} />
        </>
      ) : null}
      {showRarityFilter ? (
        <RarityFilter
          expanded={expanded}
          onExpandedChange={onExpandedChange}
          showLabels={showLabels}
          selectedRarities={selectedRarities}
          onSelectedRaritiesChange={onSelectedRaritiesChange}
        />
      ) : null}
      {showTypeFilter ? (
        <TypeFilter
          expanded={expanded}
          onExpandedChange={onExpandedChange}
          showLabels={showLabels}
          selectedTypes={selectedTypes}
          onSelectedTypesChange={onSelectedTypesChange}
        />
      ) : null}
    </div>
  );
}
