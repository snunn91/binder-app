"use client";

import { Layers } from "lucide-react";

type FilterListProps = {
  expanded: boolean;
  mode: "cards" | "sets";
  onModeChange: (mode: "cards" | "sets") => void;
  setsEnabled?: boolean;
};

export default function FilterList({
  expanded,
  mode,
  onModeChange,
  setsEnabled = false,
}: FilterListProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="Filter mode"
          className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-slate-200 dark:text-slate-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
        >
          <Layers className="h-4 w-4 shrink-0" />
          <span className="sr-only">Mode</span>
        </button>

        {expanded ? (
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            <button
              type="button"
              role="radio"
              aria-checked={mode === "cards"}
              onClick={() => onModeChange("cards")}
              className={`rounded-lg border px-2 py-1.5 text-xs font-exo font-medium transition ${
                mode === "cards"
                  ? "border-zinc-300 bg-zinc-700 text-slate-100 dark:border-zinc-500 dark:bg-slate-100 dark:text-zinc-700"
                  : "border-zinc-300 bg-slate-200 text-zinc-700 hover:bg-slate-300 dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600"
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={mode === "sets"}
              onClick={() => onModeChange("sets")}
              disabled={!setsEnabled}
              className={`rounded-lg border px-2 py-1.5 text-xs font-exo font-medium transition ${
                mode === "sets"
                  ? "border-zinc-300 bg-zinc-700 text-slate-100 dark:border-zinc-500 dark:bg-slate-100 dark:text-zinc-700"
                  : "border-zinc-300 bg-slate-200 text-zinc-700 hover:bg-slate-300 dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600"
              } ${setsEnabled ? "" : "cursor-not-allowed opacity-60"}`}
            >
              Sets
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
