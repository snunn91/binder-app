"use client";

import { useState } from "react";
import { CircleX, Save, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toggle } from "@/components/ui/toggle";
import type { CardSortOrder } from "@/app/binders/binder/[binderId]/binderPageUtils";

type LayoutOption = "2x2" | "3x3" | "4x4";

const LAYOUT_OPTIONS: { value: LayoutOption; label: string; cols: number; count: number }[] = [
  { value: "2x2", label: "2×2", cols: 2, count: 4 },
  { value: "3x3", label: "3×3", cols: 3, count: 9 },
  { value: "4x4", label: "4×4", cols: 4, count: 16 },
];

const SORT_OPTIONS: { value: CardSortOrder; label: string }[] = [
  { value: "none", label: "No change" },
  { value: "name-asc", label: "Name: A → Z" },
  { value: "name-desc", label: "Name: Z → A" },
  { value: "number-asc", label: "Card Number: Low → High" },
  { value: "number-desc", label: "Card Number: High → Low" },
  { value: "rarity-high", label: "Rarity: Highest → Lowest" },
  { value: "rarity-low", label: "Rarity: Lowest → Highest" },
  { value: "price-high", label: "Price: Highest → Lowest" },
  { value: "price-low", label: "Price: Lowest → Highest" },
  { value: "set-asc", label: "Set: A → Z" },
  { value: "set-desc", label: "Set: Z → A" },
  { value: "status-collected", label: "Status: Collected first" },
  { value: "status-missing", label: "Status: Missing first" },
];

type BinderSettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  binderName: string;
  onBinderNameChange: (value: string) => void;
  layout: string;
  onLayoutChange: (value: string) => void;
  cardSort: CardSortOrder;
  onCardSortChange: (value: CardSortOrder) => void;
  showGoals: boolean;
  onShowGoalsChange: (nextValue: boolean) => void;
  showStats: boolean;
  onShowStatsChange: (nextValue: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
  isDeleting: boolean;
  onDeleteBinder: () => void;
};

export default function BinderSettingsModal({
  open,
  onOpenChange,
  binderName,
  onBinderNameChange,
  layout,
  onLayoutChange,
  cardSort,
  onCardSortChange,
  showGoals,
  onShowGoalsChange,
  showStats,
  onShowStatsChange,
  isSaving,
  onSave,
  isDeleting,
  onDeleteBinder,
}: BinderSettingsModalProps) {
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setDeleteConfirmText("");
    onOpenChange(nextOpen);
  };

  const canDelete =
    deleteConfirmText.trim().toLowerCase() === binderName.trim().toLowerCase();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border border-zinc-200 bg-white p-0 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col max-h-[90vh]">
          <DialogHeader className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 shrink-0">
            <DialogTitle className="text-left">Binder Settings</DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto space-y-6 p-4">
            {/* Binder name */}
            <div className="space-y-2">
              <input
                id="binder-title"
                type="text"
                value={binderName}
                maxLength={80}
                onChange={(event) => onBinderNameChange(event.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-nunito text-zinc-700 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-600 dark:bg-zinc-900 dark:text-slate-100"
              />
            </div>

            {/* Grid layout */}
            <div className="space-y-3">
              <p className="text-sm font-nunito font-medium text-zinc-700 dark:text-slate-100">
                Grid Layout
              </p>
              <div className="flex gap-3">
                {LAYOUT_OPTIONS.map((option) => {
                  const isSelected = layout === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onLayoutChange(option.value)}
                      className={`flex flex-1 flex-col items-center gap-2 rounded-lg border px-3 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                        isSelected
                          ? "border-accent bg-accent/10 dark:bg-accent/20"
                          : "border-zinc-300 bg-slate-50 hover:bg-slate-100 dark:border-zinc-600 dark:bg-zinc-900/35 dark:hover:bg-zinc-800/50"
                      }`}>
                      <div
                        className="grid gap-[3px]"
                        style={{ gridTemplateColumns: `repeat(${option.cols}, 1fr)` }}>
                        {Array.from({ length: option.count }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-3 w-3 rounded-[2px] ${
                              isSelected
                                ? "bg-accent/60"
                                : "bg-zinc-300 dark:bg-zinc-600"
                            }`}
                          />
                        ))}
                      </div>
                      <span
                        className={`text-xs font-nunito font-medium ${
                          isSelected
                            ? "text-accent dark:text-accent"
                            : "text-zinc-600 dark:text-zinc-400"
                        }`}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card ordering */}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-nunito font-medium text-zinc-700 dark:text-slate-100">
                  Card Ordering
                </p>
                <p className="mt-0.5 text-xs font-nunito text-zinc-500 dark:text-zinc-400">
                  Physically reorders all cards across pages when saved.
                </p>
              </div>
              <select
                value={cardSort}
                onChange={(e) => onCardSortChange(e.target.value as CardSortOrder)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-nunito text-zinc-700 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-600 dark:bg-zinc-900 dark:text-slate-100">
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Visibility toggles */}
            <div className="flex flex-col gap-y-4">
              <div className="flex items-center justify-between rounded-lg border border-zinc-300/70 bg-slate-50 px-3 py-3 dark:border-zinc-600/70 dark:bg-zinc-900/35">
                <div>
                  <p className="text-sm font-nunito font-medium text-zinc-700 dark:text-slate-100">
                    Show Goals
                  </p>
                </div>
                <Toggle
                  variant="outline"
                  pressed={showGoals}
                  onPressedChange={onShowGoalsChange}>
                  {showGoals ? "On" : "Off"}
                </Toggle>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-300/70 bg-slate-50 px-3 py-3 dark:border-zinc-600/70 dark:bg-zinc-900/35">
                <div>
                  <p className="text-sm font-nunito font-medium text-zinc-700 dark:text-slate-100">
                    Show Binder Stats
                  </p>
                </div>
                <Toggle
                  variant="outline"
                  pressed={showStats}
                  onPressedChange={onShowStatsChange}>
                  {showStats ? "On" : "Off"}
                </Toggle>
              </div>
            </div>

            {/* Delete binder */}
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
              <p className="mb-3 text-sm font-nunito font-semibold text-red-700 dark:text-red-400">
                Delete Binder
              </p>
              <p className="mb-1 text-xs font-nunito text-zinc-500 dark:text-zinc-400">
                Type the binder name to confirm:
              </p>
              <p className="mb-3 text-xs font-nunito font-semibold text-zinc-700 dark:text-zinc-200">
                {binderName}
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Enter binder name"
                className="mb-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-nunito text-zinc-700 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:border-red-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-slate-100"
              />
              <button
                type="button"
                disabled={!canDelete || isDeleting}
                onClick={onDeleteBinder}
                className="inline-flex items-center gap-2 rounded-full border border-red-600 bg-red-500 px-4 py-2 text-sm font-nunito font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 dark:border-red-500 dark:bg-red-600 dark:hover:bg-red-500">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>{isDeleting ? "Deleting..." : "Delete Binder"}</span>
              </button>
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-200 px-4 py-4 sm:justify-end dark:border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-slate-200 px-4 py-2 text-sm font-nunito font-medium text-zinc-700 transition hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600">
              <CircleX className="h-4 w-4" aria-hidden="true" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={onSave}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-600 bg-emerald-500 px-4 py-2 text-sm font-nunito font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500">
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
