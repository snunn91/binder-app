"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toggle } from "@/components/ui/toggle";

type BinderSettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  binderName: string;
  onBinderNameChange: (value: string) => void;
  showGoals: boolean;
  onShowGoalsChange: (nextValue: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
};

export default function BinderSettingsModal({
  open,
  onOpenChange,
  binderName,
  onBinderNameChange,
  showGoals,
  onShowGoalsChange,
  isSaving,
  onSave,
}: BinderSettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border border-zinc-200 bg-white p-0 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col">
          <DialogHeader className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <DialogTitle className="text-left">Binder Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 p-4">
            <div className="space-y-2">
              <input
                id="binder-title"
                type="text"
                value={binderName}
                maxLength={80}
                onChange={(event) => onBinderNameChange(event.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-exo text-zinc-700 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-600 dark:bg-zinc-900 dark:text-slate-100"
              />
            </div>
            <div className="flex flex-col gap-y-4">
              <div className="flex items-center justify-between rounded-lg border border-zinc-300/70 bg-slate-50 px-3 py-3 dark:border-zinc-600/70 dark:bg-zinc-900/35">
                <div>
                  <p className="text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
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
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-200 px-4 py-4 sm:justify-end dark:border-zinc-800">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-zinc-300 bg-slate-200 px-4 py-2 text-sm font-exo font-medium text-zinc-700 transition hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600">
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={onSave}
              className="rounded-full border border-emerald-600 bg-emerald-500 px-4 py-2 text-sm font-exo font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500">
              {isSaving ? "Saving..." : "Save"}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
