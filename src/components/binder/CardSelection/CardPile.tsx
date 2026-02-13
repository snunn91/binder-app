"use client";

import { LayoutList } from "lucide-react";
import CardItem from "@/components/binder/CardSelection/CardItem";
import type { CardSearchPreview } from "@/lib/scrydex/useCardSearch";

type CardPileEntry = {
  card: CardSearchPreview;
  quantity: number;
};

type CardPileProps = {
  items: CardPileEntry[];
  totalCardsInPile: number;
  pileLimit: number;
  isPileAtLimit: boolean;
  onIncrementCard: (card: CardSearchPreview) => void;
  onDecrementCard: (cardId: string) => void;
  onClearAll: () => void;
  onAddCards: () => void;
};

export default function CardPile({
  items,
  totalCardsInPile,
  pileLimit,
  isPileAtLimit,
  onIncrementCard,
  onDecrementCard,
  onClearAll,
  onAddCards,
}: CardPileProps) {
  const hasCards = totalCardsInPile > 0;
  const appButtonClassName =
    "relative flex items-center overflow-hidden rounded-full border border-zinc-300 bg-slate-200 px-3 py-1 text-xs font-exo font-medium text-zinc-700 disabled:text-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 before:transition-all before:duration-500 hover:text-slate-100 hover:before:w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:before:w-0 disabled:before:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:disabled:text-slate-100 dark:before:bg-slate-100 dark:hover:text-zinc-700";

  return (
    <div className="w-full p-3 lg:w-80">
      <div className="flex items-center justify-between">
        <div className="text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
          Card Pile
          <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-300">
            ({totalCardsInPile}
            {Number.isFinite(pileLimit) ? `/${pileLimit}` : ""})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClearAll}
            disabled={!hasCards}
            className={appButtonClassName}>
            <span className="relative z-10">Clear all</span>
          </button>
          <button
            type="button"
            onClick={onAddCards}
            disabled={!hasCards}
            className={appButtonClassName}>
            <span className="relative z-10">Add cards</span>
          </button>
        </div>
      </div>

      {Number.isFinite(pileLimit) && isPileAtLimit ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-300">
          Max cards reached for this binder size.
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-4 max-h-[calc(100vh-192px)] space-y-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={item.card.id}
              className="flex w-full items-start gap-2 rounded-md border border-zinc-200 bg-white p-2 text-left dark:border-zinc-700 dark:bg-zinc-900">
              <CardItem card={item.card} imageSize="extraSmall">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onDecrementCard(item.card.id)}
                    className="flex h-6 w-6 items-center justify-center rounded border border-zinc-300 bg-slate-200 text-xs font-semibold text-zinc-800 transition hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-600 dark:bg-zinc-800 dark:text-slate-100 dark:hover:bg-zinc-700">
                    -
                  </button>
                  <span className="w-6 text-center text-xs font-semibold text-zinc-700 dark:text-slate-100">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onIncrementCard(item.card)}
                    disabled={isPileAtLimit}
                    className="flex h-6 w-6 items-center justify-center rounded border border-zinc-300 bg-slate-200 text-xs font-semibold text-zinc-800 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-600 dark:bg-zinc-800 dark:text-slate-100 dark:hover:bg-zinc-700">
                    +
                  </button>
                </div>
              </CardItem>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex h-[calc(100vh-192px)] items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50/70 dark:border-zinc-700 dark:bg-zinc-900/30">
          <LayoutList className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
        </div>
      )}
    </div>
  );
}
