"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BinderCard } from "@/lib/services/binderService";

type CardGeneratorModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emptySlots: number;
  language: "en" | "jp";
  onCardsGenerated: (cards: BinderCard[]) => void;
};

export default function CardGeneratorModal({
  open,
  onOpenChange,
  emptySlots,
  language,
  onCardsGenerated,
}: CardGeneratorModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPrompt("");
      setError(null);
      setIsLoading(false);
    }
    onOpenChange(nextOpen);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading || emptySlots === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          emptySlots,
          language,
        }),
      });

      const data = (await res.json()) as {
        cards?: BinderCard[];
        error?: string;
      };

      if (!res.ok || !data.cards) {
        setError(data.error ?? "Failed to generate cards. Please try again.");
        return;
      }

      if (data.cards.length === 0) {
        setError(
          "No cards matched your request. Try a different prompt or broaden your criteria.",
        );
        return;
      }

      onCardsGenerated(data.cards);
      handleOpenChange(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border border-zinc-200 bg-white p-0 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col">
          <DialogHeader className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <DialogTitle className="flex items-center gap-2 text-left">
              <Sparkles className="h-4 w-4 text-accent" />
              AI Card Generator
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-4">
            <p className="text-sm font-exo text-zinc-500 dark:text-zinc-400">
              Describe the cards you want to add to the current spread. For
              example:{" "}
              <span className="italic">
                &quot;SIR cards from Scarlet and Violet era&quot;
              </span>{" "}
              or{" "}
              <span className="italic">
                &quot;Charizard cards pre 2010&quot;
              </span>
              .
            </p>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleGenerate();
                }
              }}
              placeholder="Describe the cards you want..."
              rows={3}
              maxLength={500}
              disabled={isLoading || emptySlots === 0}
              className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-exo text-zinc-700 shadow-sm transition-colors focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-slate-100"
            />

            {emptySlots === 0 && (
              <p className="text-sm font-exo text-amber-600 dark:text-amber-400">
                The current spread has no empty slots. Navigate to a spread with
                available space before generating.
              </p>
            )}

            {error && (
              <p className="text-sm font-exo text-red-500">{error}</p>
            )}

            {emptySlots > 0 && (
              <p className="text-xs font-exo text-zinc-400 dark:text-zinc-500">
                Will fill up to {emptySlots} empty slot
                {emptySlots !== 1 ? "s" : ""} on the current spread.
              </p>
            )}
          </div>

          <DialogFooter className="border-t border-zinc-200 px-4 py-4 sm:justify-end dark:border-zinc-800">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
              className="rounded-full border border-zinc-300 bg-slate-200 px-4 py-2 text-sm font-exo font-medium text-zinc-700 transition hover:bg-slate-300 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={isLoading || !prompt.trim() || emptySlots === 0}
              className="rounded-full border border-accent bg-accent px-4 py-2 text-sm font-exo font-medium text-white transition hover:bg-accent/90 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-60">
              {isLoading ? "Generating..." : "Generate"}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
