"use client";

import { Grid3X3, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type LayoutMode = "grid" | "list";

type LayoutModeToggleProps = {
  value: LayoutMode;
  onChange: (mode: LayoutMode) => void;
  className?: string;
};

export default function LayoutModeToggle({
  value,
  onChange,
  className,
}: LayoutModeToggleProps) {
  const baseButtonClassName =
    "flex h-8 w-8 items-center justify-center rounded-md border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900",
        className,
      )}
      role="group"
      aria-label="Layout mode toggle">
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={value === "grid"}
        className={cn(
          baseButtonClassName,
          value === "grid"
            ? "border-accent bg-accent text-white"
            : "border-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
        )}>
        <Grid3X3 className="h-4 w-4" />
        <span className="sr-only">Grid view</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={value === "list"}
        className={cn(
          baseButtonClassName,
          value === "list"
            ? "border-accent bg-accent text-white"
            : "border-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
        )}>
        <List className="h-4 w-4" />
        <span className="sr-only">List view</span>
      </button>
    </div>
  );
}
