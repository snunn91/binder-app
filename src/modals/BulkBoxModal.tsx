"use client";

import { LayoutList } from "lucide-react";
import type { BinderCard } from "@/lib/services/binderService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BulkBoxModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCards: () => void;
  cards: BinderCard[];
  capacity: number;
  gridColumns: number;
  canAddToBinder: boolean;
  onAddCardToBinder: (cardIndex: number) => void;
  onEmptyBox: () => void;
};

export default function BulkBoxModal({
  open,
  onOpenChange,
  onAddCards,
  cards,
  capacity,
  gridColumns,
  canAddToBinder,
  onAddCardToBinder,
  onEmptyBox,
}: BulkBoxModalProps) {
  const visibleCards = cards.slice(0, capacity);
  const hasCards = visibleCards.length > 0;
  const cardAspectClassName =
    gridColumns === 2
      ? "aspect-[73/100]"
      : gridColumns === 4
        ? "aspect-[3/4]"
        : "aspect-[7/10]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border border-zinc-200 bg-white p-0 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col">
          <DialogHeader className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <DialogTitle className="text-left">Bulk Box</DialogTitle>
          </DialogHeader>

          <div className="p-4">
            {hasCards ? (
              <div className="space-y-3">
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onEmptyBox}
                      className="text-xs font-exo font-medium text-zinc-600 transition hover:text-zinc-800 dark:text-zinc-300 dark:hover:text-slate-100">
                      Empty box
                    </button>
                    <p className="text-xs font-exo text-zinc-500 dark:text-slate-400">
                      {visibleCards.length}/{capacity}
                    </p>
                  </div>
                </div>
                <div
                  className="mx-auto grid w-full max-w-[420px] gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                  }}>
                  {visibleCards.map((card, index) => {
                    const imageSrc = card.image?.small ?? card.image?.large;
                    return (
                      <button
                        type="button"
                        key={`${card.id}-${index}`}
                        disabled={!canAddToBinder}
                        onClick={() => onAddCardToBinder(index)}
                        className={`overflow-hidden rounded-md border border-zinc-200 bg-white text-left transition dark:border-zinc-700 dark:bg-zinc-900 ${
                          canAddToBinder
                            ? "hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent"
                            : "cursor-not-allowed opacity-55 grayscale"
                        }`}>
                        <div className={`${cardAspectClassName} w-full`}>
                          {imageSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageSrc}
                              alt={card.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-zinc-100 px-2 text-center text-[11px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                              {card.name}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {!canAddToBinder ? (
                  <p className="text-center text-xs font-exo text-zinc-600 dark:text-slate-300">
                    Free up binder space to add cards from Bulk Box.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50/70 px-4 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
                <LayoutList className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
                <p className="mt-3 text-sm font-exo font-semibold text-zinc-700 dark:text-slate-100">
                  Bulk Box is empty
                </p>
                <p className="mt-1 text-xs font-exo text-zinc-600 dark:text-slate-300">
                  Add cards here to hold them until you are ready to place them
                  in your binder.
                </p>
                <p className="mt-2 text-[11px] font-exo text-zinc-500 dark:text-slate-400">
                  Capacity: up to {capacity} cards.
                </p>
                <button
                  type="button"
                  onClick={onAddCards}
                  className="mt-4 rounded-full border border-accent bg-accent px-4 py-2 text-sm font-exo font-medium text-white transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent">
                  Add cards
                </button>
              </div>
            )}
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
