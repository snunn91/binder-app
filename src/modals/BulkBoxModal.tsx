"use client";

import { LayoutList } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BulkBoxModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCards: () => void;
};

export default function BulkBoxModal({
  open,
  onOpenChange,
  onAddCards,
}: BulkBoxModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border border-zinc-200 bg-white p-0 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col">
          <DialogHeader className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <DialogTitle className="text-left">Bulk Box</DialogTitle>
            <DialogDescription className="text-left">
              Your tray for holding cards before adding them to the binder.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4">
            <div className="flex h-64 flex-col items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50/70 px-4 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
              <LayoutList className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
              <p className="mt-3 text-sm font-exo font-semibold text-zinc-700 dark:text-slate-100">
                Bulk Box is empty
              </p>
              <p className="mt-1 text-xs font-exo text-zinc-600 dark:text-slate-300">
                Add cards here to hold them until you are ready to place them in your binder.
              </p>
              <p className="mt-2 text-[11px] font-exo text-zinc-500 dark:text-slate-400">
                Capacity: up to 9 cards.
              </p>
              <button
                type="button"
                onClick={onAddCards}
                className="mt-4 rounded-full border border-accent bg-accent px-4 py-2 text-sm font-exo font-medium text-white transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent">
                Add cards
              </button>
            </div>
          </div>

          <div className="border-t border-zinc-200 px-4 py-4 sm:flex sm:justify-end dark:border-zinc-800">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-zinc-300 bg-slate-200 px-4 py-2 text-sm font-exo font-medium text-zinc-700 transition hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600">
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
