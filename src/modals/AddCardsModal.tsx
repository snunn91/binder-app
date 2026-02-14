"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import CardSelection from "@/components/binder/CardSelection";
import type { CardPileEntry } from "@/components/binder/CardSelection/CardSelection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AddCardsModalProps = {
  maxCardsInPile?: number;
  onAddCards?: (items: CardPileEntry[]) => void | Promise<void>;
  triggerVariant?: "pill" | "icon";
  onTriggerClick?: () => void;
};

export default function AddCardsModal({
  maxCardsInPile,
  onAddCards,
  triggerVariant = "pill",
  onTriggerClick,
}: AddCardsModalProps) {
  const [open, setOpen] = useState(false);
  const [selectionKey, setSelectionKey] = useState(0);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSelectionKey((prev) => prev + 1);
    }
  };

  const handleAddCards = async (items: CardPileEntry[]) => {
    if (!onAddCards || items.length === 0) return;
    await onAddCards(items);
    setOpen(false);
    setSelectionKey((prev) => prev + 1);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerVariant === "icon" ? (
          <button
            type="button"
            onClick={onTriggerClick}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-accent text-white shadow-lg transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-accent dark:bg-accent dark:text-white dark:hover:bg-accent/90">
            <Plus className="h-3.5 w-3.5" />
            <span className="sr-only">Add card</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onTriggerClick}
            className="group relative flex h-12 items-center overflow-hidden rounded-full border border-accent bg-accent px-4 text-sm font-exo font-medium text-white shadow-lg transition-all duration-300 hover:pr-5 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-accent dark:bg-accent dark:text-white dark:hover:bg-accent/90">
            <Plus className="relative z-10 h-4 w-4 shrink-0" />
            <span className="relative z-10 max-w-0 overflow-hidden whitespace-nowrap pl-0 transition-all duration-300 group-hover:max-w-20 group-hover:pl-2">
              Add card
            </span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="flex h-[calc(100vh-25px)] max-h-[calc(100vh-25px)] max-w-[calc(100vw-25px)] flex-col rounded-2xl border border-zinc-200 bg-white/90 p-0 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="flex h-full flex-col">
          <DialogHeader className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <DialogTitle className="text-left">Add Card</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 p-4">
            <CardSelection
              key={selectionKey}
              maxCardsInPile={maxCardsInPile}
              onAddCards={handleAddCards}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
