"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import CardSelection from "@/components/binder/CardSelection";
import type { CardPileEntry } from "@/components/binder/CardSelection/CardSelection";
import LayoutModeToggle, {
  type LayoutMode,
} from "@/components/binder/LayoutModeToggle";
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
  onAddToBulkBox?: (items: CardPileEntry[]) => void | Promise<void>;
  triggerVariant?: "pill" | "icon";
  onTriggerClick?: () => void;
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  forcedLayoutMode?: LayoutMode;
  hideLayoutToggle?: boolean;
  showMobileBulkBoxCta?: boolean;
};

export default function AddCardsModal({
  maxCardsInPile,
  onAddCards,
  onAddToBulkBox,
  triggerVariant = "pill",
  onTriggerClick,
  hideTrigger = false,
  open: openProp,
  onOpenChange,
  forcedLayoutMode,
  hideLayoutToggle = false,
  showMobileBulkBoxCta = false,
}: AddCardsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectionKey, setSelectionKey] = useState(0);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");
  const [language, setLanguage] = useState<"us" | "jp">("us");
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const effectiveLayoutMode = forcedLayoutMode ?? layoutMode;

  const setOpenState = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpenState(nextOpen);
    if (!nextOpen) {
      setSelectionKey((prev) => prev + 1);
      setLanguage("us");
    }
  };

  const handleAddCards = async (items: CardPileEntry[]) => {
    if (!onAddCards || items.length === 0) return;
    await onAddCards(items);
    setOpenState(false);
    setSelectionKey((prev) => prev + 1);
  };

  const handleAddToBulkBox = async (items: CardPileEntry[]) => {
    if (!onAddToBulkBox || items.length === 0) return;
    await onAddToBulkBox(items);
    setOpenState(false);
    setSelectionKey((prev) => prev + 1);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger ? (
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
              className="group relative flex h-12 items-center overflow-hidden rounded-full border border-accent bg-accent px-4 text-sm font-nunito font-medium text-white shadow-lg transition-all duration-300 hover:pr-5 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-accent dark:bg-accent dark:text-white dark:hover:bg-accent/90">
              <Plus className="relative z-10 h-4 w-4 shrink-0" />
              <span className="relative z-10 max-w-0 overflow-hidden whitespace-nowrap pl-0 transition-all duration-300 group-hover:max-w-20 group-hover:pl-2">
                Add card
              </span>
            </button>
          )}
        </DialogTrigger>
      ) : null}
      <DialogContent className="flex h-[calc(100vh-25px)] max-h-[calc(100vh-25px)] max-w-[calc(100vw-25px)] flex-col rounded-2xl border border-zinc-200 bg-white/90 p-0 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="flex h-full flex-col">
          <DialogHeader className="relative border-b border-zinc-200 px-6 py-4 pr-36 dark:border-zinc-800">
            <DialogTitle className="text-left">Add Card</DialogTitle>
            <div className="absolute right-12 top-1/2 flex -translate-y-1/2 items-center gap-2">
              <div
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
                role="group"
                aria-label="Card language toggle">
                <button
                  type="button"
                  onClick={() => {
                    if (language === "us") return;
                    setLanguage("us");
                    setSelectionKey((prev) => prev + 1);
                  }}
                  aria-pressed={language === "us"}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent ${
                    language === "us"
                      ? "border-accent bg-accent text-white"
                      : "border-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}>
                  <span aria-hidden="true">🇺🇸</span>
                  <span className="sr-only">English cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (language === "jp") return;
                    setLanguage("jp");
                    setSelectionKey((prev) => prev + 1);
                  }}
                  aria-pressed={language === "jp"}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent ${
                    language === "jp"
                      ? "border-accent bg-accent text-white"
                      : "border-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}>
                  <span aria-hidden="true">🇯🇵</span>
                  <span className="sr-only">Japanese cards</span>
                </button>
              </div>
              {!forcedLayoutMode && !hideLayoutToggle ? (
                <LayoutModeToggle
                  value={effectiveLayoutMode}
                  onChange={setLayoutMode}
                />
              ) : null}
            </div>
          </DialogHeader>
          <div
            className={`flex-1 min-h-0 p-4 ${
              showMobileBulkBoxCta ? "pb-20 sm:pb-4" : ""
            }`}>
            <CardSelection
              key={selectionKey}
              language={language}
              maxCardsInPile={maxCardsInPile}
              onAddCards={handleAddCards}
              onAddToBulkBox={handleAddToBulkBox}
              layoutMode={effectiveLayoutMode}
              showMobileBulkBoxCta={showMobileBulkBoxCta}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
