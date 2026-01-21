"use client";

import * as React from "react";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  loading: boolean;
  mode: "cards" | "sets";
  onModeChange: (mode: "cards" | "sets") => void;
  placeholder?: string;
};

const placeholders: Record<SearchBarProps["mode"], string> = {
  cards: "Search cards",
  sets: "Search sets",
};

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  loading,
  mode,
  onModeChange,
  placeholder,
}: SearchBarProps) {
  return (
    <form onSubmit={onSubmit} className="w-full">
    <div className="flex w-full items-center gap-2 rounded-full border border-zinc-300 bg-white px-3 py-2 shadow-sm transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/50 dark:border-zinc-600 dark:bg-zinc-900">
        <Select value={mode} onValueChange={onModeChange}>
          <SelectTrigger
            aria-label="Search type"
            className="w-auto px-4 py-1.5 text-sm font-exo font-medium">
            <SelectValue placeholder="Cards" />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="cards">Cards</SelectItem>
            <SelectItem value="sets">Sets</SelectItem>
          </SelectContent>
        </Select>

        <Search
          aria-hidden="true"
          className="h-5 w-5 text-zinc-500 dark:text-zinc-400"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? placeholders[mode]}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
        />

        <button
          type="submit"
          disabled={loading}
          className="relative flex items-center overflow-hidden rounded-full border border-zinc-300 bg-slate-200 px-4 py-1.5 text-sm font-exo font-medium text-zinc-700 disabled:text-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 before:transition-all before:duration-500 hover:text-slate-100 hover:before:w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:before:w-0 disabled:before:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:disabled:text-slate-100 dark:before:bg-slate-100 dark:hover:text-zinc-700">
          <span className="relative z-10">Search</span>
        </button>
      </div>
    </form>
  );
}
