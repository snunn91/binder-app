"use client";

import { useState } from "react";
import { LayoutList } from "lucide-react";
import LayoutModeToggle, {
  type LayoutMode,
} from "@/components/binder/LayoutModeToggle";
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
  canMoveCardsToBinder?: boolean;
  forcedLayoutMode?: LayoutMode;
  hideLayoutToggle?: boolean;
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
  canMoveCardsToBinder = true,
  forcedLayoutMode,
  hideLayoutToggle = false,
}: BulkBoxModalProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");
  const effectiveLayoutMode = forcedLayoutMode ?? layoutMode;
  const canAddCardFromBulkBox = canMoveCardsToBinder && canAddToBinder;
  const isMobileMode = !canMoveCardsToBinder;

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
      <DialogContent
        className={
          isMobileMode
            ? "w-full max-w-[calc(100vw-25px)] rounded-2xl border border-zinc-200 bg-white p-0 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            : "max-w-xl rounded-2xl border border-zinc-200 bg-white p-0 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        }>
        <div className="flex flex-col">
          <DialogHeader className="relative border-b border-zinc-200 px-6 py-4 pr-24 dark:border-zinc-800">
            <DialogTitle className="text-left">Bulk Box</DialogTitle>
            {!forcedLayoutMode && !hideLayoutToggle ? (
              <LayoutModeToggle
                value={effectiveLayoutMode}
                onChange={setLayoutMode}
                className="absolute right-12 top-1/2 -translate-y-1/2"
              />
            ) : null}
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
                <div className="max-h-[calc(100vh-480px)] overflow-y-auto pr-1">
                  <div
                    className={
                      effectiveLayoutMode === "grid"
                        ? "mx-auto grid w-full max-w-[420px] gap-2"
                        : isMobileMode
                          ? "grid w-full grid-cols-1 gap-2"
                          : "mx-auto grid w-full max-w-[520px] grid-cols-1 gap-2"
                    }
                    style={
                      effectiveLayoutMode === "grid"
                        ? {
                            gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                          }
                        : undefined
                    }>
                    {visibleCards.map((card, index) => {
                      const imageSrc = card.image?.small ?? card.image?.large;
                      return (
                        <button
                          type="button"
                          key={`${card.id}-${index}`}
                          disabled={!canAddCardFromBulkBox}
                          onClick={() => onAddCardToBinder(index)}
                          className={`overflow-hidden rounded-md border border-zinc-200 bg-white text-left transition dark:border-zinc-700 dark:bg-zinc-900 ${
                            canAddCardFromBulkBox
                              ? "hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent"
                              : "cursor-not-allowed opacity-55 grayscale"
                          }`}>
                          {effectiveLayoutMode === "grid" ? (
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
                          ) : (
                            <div className="p-3">
                              <div className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                                {card.name}
                              </div>
                              <div className="truncate text-xs text-zinc-500 dark:text-zinc-300">
                                {card.expansion?.name ?? "Unknown set"}
                                {card.number ? ` • #${card.number}` : ""}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {!canMoveCardsToBinder ? (
                  <p className="text-center text-xs font-exo text-zinc-600 dark:text-slate-300">
                    Mobile mode only supports adding cards to Bulk Box. Move
                    cards into binder slots on tablet or desktop.
                  </p>
                ) : null}
                {canMoveCardsToBinder && !canAddToBinder ? (
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
