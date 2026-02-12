"use client";

import SortByFilter from "@/components/filters/SortByFilter";
import RarityFilter from "@/components/filters/RarityFilter";
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
  showRarityFilter?: boolean;
  showSortFilter?: boolean;
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
  showRarityFilter = true,
  showSortFilter = true,
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
      {showRarityFilter ? (
        <RarityFilter
          expanded={expanded}
          onExpandedChange={onExpandedChange}
          showLabels={showLabels}
          selectedRarities={selectedRarities}
          onSelectedRaritiesChange={onSelectedRaritiesChange}
        />
      ) : null}
    </div>
  );
}
