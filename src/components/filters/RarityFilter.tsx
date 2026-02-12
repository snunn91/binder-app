"use client";

import * as React from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { RARITY_FILTER_OPTIONS } from "@/lib/scrydex/rarity";

type RarityFilterProps = {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  showLabels: boolean;
  selectedRarities: string[];
  onSelectedRaritiesChange: (rarities: string[]) => void;
};

export default function RarityFilter({
  expanded,
  onExpandedChange,
  showLabels,
  selectedRarities,
  onSelectedRaritiesChange,
}: RarityFilterProps) {
  const [rarityOpen, setRarityOpen] = React.useState(false);
  const rarityOptions = RARITY_FILTER_OPTIONS;

  function toggleRarity(value: string) {
    const next = selectedRarities.includes(value)
      ? selectedRarities.filter((item) => item !== value)
      : [...selectedRarities, value];
    onSelectedRaritiesChange(next);
  }

  return expanded ? (
    <Popover open={rarityOpen} onOpenChange={setRarityOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={() => {
            if (!expanded) {
              onExpandedChange(true);
              setRarityOpen(true);
            }
          }}
          className="flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-slate-200 px-2 py-2 text-sm text-zinc-700 transition hover:bg-slate-300 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:border-accent active:ring-2 active:ring-accent/40 data-[state=open]:border-accent data-[state=open]:ring-2 data-[state=open]:ring-accent/50 dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600"
          aria-label="Rarity filter"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span
              className={`whitespace-nowrap text-sm font-exo font-medium transition-opacity duration-200 ${
                showLabels ? "opacity-100" : "opacity-0"
              }`}
            >
              Rarity
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-300" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command>
          <CommandInput placeholder="Search rarity..." />
          <CommandList>
            <CommandEmpty>No rarities found.</CommandEmpty>
            <CommandGroup>
              {rarityOptions.map((option) => {
                const selected = selectedRarities.includes(option);
                return (
                  <CommandItem
                    key={option}
                    onSelect={() => toggleRarity(option)}
                    className="flex items-center gap-2"
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        selected
                          ? "border-zinc-300 bg-zinc-200 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-slate-100"
                          : "border-zinc-300 text-transparent dark:border-zinc-600"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-sm">{option}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  ) : (
    <button
      type="button"
      aria-label="Rarity filter"
      onClick={() => {
        onExpandedChange(true);
        setRarityOpen(true);
      }}
      className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:ring-2 active:ring-accent/40 active:border-accent dark:text-slate-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
    >
      <Sparkles className="h-4 w-4 shrink-0" />
      <span className="sr-only">Rarity</span>
    </button>
  );
}
