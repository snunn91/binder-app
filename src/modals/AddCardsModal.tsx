"use client";

import CardSelection from "@/components/binder/CardSelection";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AddCardsModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="relative flex items-center overflow-hidden rounded-full border border-zinc-300 bg-slate-200 px-6 py-2 text-sm font-exo font-medium text-zinc-700 disabled:text-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 before:transition-all before:duration-500 hover:text-slate-100 hover:before:w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:before:w-0 disabled:before:transition-none dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:disabled:text-slate-100 dark:before:bg-slate-100 dark:hover:text-zinc-700">
          <span className="relative z-10">Add Card</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-25px)]">
        <DialogHeader>
          <DialogTitle>Add Card</DialogTitle>
          <DialogDescription>
            Search for a card and choose where to place it.
          </DialogDescription>
        </DialogHeader>
        <CardSelection
          onSelect={(card) => {
            console.log("selected", card);
            // next step: show preview + choose binder slot
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
