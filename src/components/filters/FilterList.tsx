"use client";

import SortByFilter from "@/components/filters/SortByFilter";
import RarityFilter from "@/components/filters/RarityFilter";
import TypeFilter from "@/components/filters/TypeFilter";
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
