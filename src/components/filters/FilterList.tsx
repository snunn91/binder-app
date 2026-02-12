"use client";

import SortByFilter from "@/components/filters/SortByFilter";
import RarityFilter from "@/components/filters/RarityFilter";

type FilterListProps = {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  showLabels: boolean;
  selectedRarities: string[];
  onSelectedRaritiesChange: (rarities: string[]) => void;
  showRarityFilter?: boolean;
};

export default function FilterList({
  expanded,
  onExpandedChange,
  showLabels,
  selectedRarities,
  onSelectedRaritiesChange,
  showRarityFilter = true,
}: FilterListProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-y-3">
      <SortByFilter
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        showLabels={showLabels}
      />
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
