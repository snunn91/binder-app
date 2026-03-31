"use client";

import { Sparkles } from "lucide-react";

type AiCardsConfirmationBarProps = {
  cardCount: number;
  isVisible: boolean;
  onKeep: () => void;
  onClear: () => void;
};

export default function AiCardsConfirmationBar({
  cardCount,
  isVisible,
  onKeep,
  onClear,
}: AiCardsConfirmationBarProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}>
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <Sparkles className="h-4 w-4 shrink-0 text-accent" />
        <p className="text-sm font-exo text-zinc-700 dark:text-slate-100">
          AI added{" "}
          <span className="font-semibold">
            {cardCount} card{cardCount !== 1 ? "s" : ""}
          </span>{" "}
          to this spread
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-zinc-300 bg-slate-200 px-3 py-1.5 text-sm font-exo font-medium text-zinc-700 transition hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-600 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600">
            Clear
          </button>
          <button
            type="button"
            onClick={onKeep}
            className="rounded-full border border-accent bg-accent px-3 py-1.5 text-sm font-exo font-medium text-white transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent">
            Keep
          </button>
        </div>
      </div>
    </div>
  );
}
