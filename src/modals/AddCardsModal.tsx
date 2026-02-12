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
          className="relative flex items-center overflow-hidden rounded-full border border-zinc-300 bg-slate-200 px-6 py-2 text-sm font-exo font-medium text-zinc-700 disabled:text-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 before:transition-all before:duration-500 hover:text-slate-100 hover:before:w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:before:w-0 disabled:before:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:disabled:text-slate-100 dark:before:bg-slate-100 dark:hover:text-zinc-700">
          <span className="relative z-10">Add Card</span>
        </button>
      </DialogTrigger>
      <DialogContent className="flex h-[calc(100vh-25px)] max-h-[calc(100vh-25px)] max-w-[calc(100vw-25px)] flex-col rounded-2xl border border-zinc-200 bg-white/90 p-0 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="flex h-full flex-col">
          <DialogHeader className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <DialogTitle className="text-left">Add Card</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 p-4">
            <CardSelection
              onSelect={(card) => {
                console.log("selected", card);
                // next step: show preview + choose binder slot
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
