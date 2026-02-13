"use client";

import * as React from "react";
import { Check, ChevronDown, Shapes } from "lucide-react";
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
import { CARD_TYPE_FILTER_OPTIONS } from "@/lib/scrydex/type";

type TypeFilterProps = {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  showLabels: boolean;
  selectedTypes: string[];
  onSelectedTypesChange: (types: string[]) => void;
};

const TYPE_FILTER_ITEMS = CARD_TYPE_FILTER_OPTIONS.map((value) => ({
  value,
  label: value === "Fairy" ? "Fairy (discontinued in 2020)" : value,
}));

export default function TypeFilter({
  expanded,
  onExpandedChange,
  showLabels,
  selectedTypes,
  onSelectedTypesChange,
}: TypeFilterProps) {
  const [typeOpen, setTypeOpen] = React.useState(false);

  function toggleType(value: string) {
    const next = selectedTypes.includes(value)
      ? selectedTypes.filter((item) => item !== value)
      : [...selectedTypes, value];
    onSelectedTypesChange(next);
  }

  return expanded ? (
    <Popover open={typeOpen} onOpenChange={setTypeOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={() => {
            if (!expanded) {
              onExpandedChange(true);
              setTypeOpen(true);
            }
          }}
          className="flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-slate-200 px-2 py-2 text-sm text-zinc-700 transition hover:bg-slate-300 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:border-accent active:ring-2 active:ring-accent/40 data-[state=open]:border-accent data-[state=open]:ring-2 data-[state=open]:ring-accent/50 dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600"
          aria-label="Type filter">
          <div className="flex items-center gap-2">
            <Shapes className="h-4 w-4 shrink-0" />
            <span
              className={`whitespace-nowrap text-sm font-exo font-medium transition-opacity duration-200 ${
                showLabels ? "opacity-100" : "opacity-0"
              }`}>
              Type
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-300" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search type..." />
          <CommandList>
            <CommandEmpty>No types found.</CommandEmpty>
            <CommandGroup>
              {TYPE_FILTER_ITEMS.map((option) => {
                const selected = selectedTypes.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => toggleType(option.value)}
                    className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        selected
                          ? "border-zinc-300 bg-zinc-200 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-slate-100"
                          : "border-zinc-300 text-transparent dark:border-zinc-600"
                      }`}>
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-sm">{option.label}</span>
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
      aria-label="Type filter"
      onClick={() => {
        onExpandedChange(true);
        setTypeOpen(true);
      }}
      className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:ring-2 active:ring-accent/40 active:border-accent dark:text-slate-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800">
      <Shapes className="h-4 w-4 shrink-0" />
      <span className="sr-only">Type</span>
    </button>
  );
}
