"use client";

import SortByFilter from "@/components/filters/SortByFilter";
import RarityFilter from "@/components/filters/RarityFilter";

type FilterListProps = {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  showLabels: boolean;
};

export default function FilterList({
  expanded,
  onExpandedChange,
  showLabels,
}: FilterListProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-y-3">
      <SortByFilter
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        showLabels={showLabels}
      />
      <RarityFilter
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        showLabels={showLabels}
      />
    </div>
  );
}
