"use client";

import * as React from "react";
import {
  ArrowDown01,
  ArrowDownAZ,
  ArrowUp01,
  ArrowUpAZ,
  Calendar,
  ChevronDown,
  Clock,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getSortGroups,
  type SearchSortOption,
  type SortScope,
} from "@/lib/scrydex/sort";

type SortByFilterProps = {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  showLabels: boolean;
  sortScope: SortScope;
  sortBy: SearchSortOption;
  onSortChange: (sort: SearchSortOption) => void;
};

const SORT_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Newest: Calendar,
  Oldest: Clock,
  "Name A-Z": ArrowDownAZ,
  "Name Z-A": ArrowUpAZ,
  "Number ASC": ArrowDown01,
  "Number DESC": ArrowUp01,
};

export default function SortByFilter({
  expanded,
  onExpandedChange,
  showLabels,
  sortScope,
  sortBy,
  onSortChange,
}: SortByFilterProps) {
  const [sortOpen, setSortOpen] = React.useState(false);
  const sortGroups = React.useMemo(() => getSortGroups(sortScope), [sortScope]);

  return expanded ? (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2 text-xs font-exo font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        <ArrowDownAZ className="h-3.5 w-3.5 shrink-0" />
        <span
          className={`transition-opacity duration-200 ${
            showLabels ? "opacity-100" : "opacity-0"
          }`}>
          Sort By
        </span>
      </div>

      <Popover open={sortOpen} onOpenChange={setSortOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={() => {
              if (!expanded) {
                onExpandedChange(true);
                setSortOpen(true);
              }
            }}
            className="flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-slate-200 px-2 py-2 text-sm text-zinc-700 transition hover:bg-slate-300 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:border-accent active:ring-2 active:ring-accent/40 data-[state=open]:border-accent data-[state=open]:ring-2 data-[state=open]:ring-accent/50 dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600"
            aria-label="Sort by">
            <span className="flex items-center gap-2 truncate text-sm font-exo font-medium">
              {React.createElement(SORT_ICON_MAP[sortBy], {
                className: "h-4 w-4 shrink-0",
              })}
              {sortBy}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-300" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-2">
          <div className="flex flex-col gap-2">
            {sortGroups.map((group, groupIndex) => (
              <div key={group.title} className="flex flex-col gap-1">
                <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {group.title}
                </div>
                {group.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onSortChange(option);
                      setSortOpen(false);
                    }}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:ring-2 active:ring-accent/40 ${
                      sortBy === option
                        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-slate-100"
                        : "text-zinc-700 hover:bg-slate-200 dark:text-slate-100 dark:hover:bg-zinc-800"
                    }`}>
                    {React.createElement(SORT_ICON_MAP[option], {
                      className: "h-4 w-4 shrink-0",
                    })}
                    <span>{option}</span>
                  </button>
                ))}
                {groupIndex < sortGroups.length - 1 ? (
                  <div className="mt-1 border-t border-zinc-200 dark:border-zinc-700" />
                ) : null}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ) : (
    <button
      type="button"
      aria-label="Sort by"
      onClick={() => {
        onExpandedChange(true);
        setSortOpen(true);
      }}
      className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:ring-2 active:ring-accent/40 active:border-accent dark:text-slate-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800">
      <ArrowDownAZ className="h-4 w-4 shrink-0" />
      <span className="sr-only">Sort By</span>
    </button>
  );
}
