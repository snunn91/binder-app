"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/lib/store/storeHooks";
import {
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arraySwap } from "@dnd-kit/sortable";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addCardsToBinder,
  type BinderCard,
  fetchBinderById,
  fetchBinderPages,
  layoutToSlots,
  updateBinderPageCardOrder,
} from "@/lib/firebase/services/binderService";
import InsideCover from "@/components/binder/InsideCover";
import PagePanel from "@/components/binder/PagePanel";
import AddCardsModal from "@/modals/AddCardsModal";
import type { CardPileEntry } from "@/components/binder/CardSelection/CardSelection";

type BinderPage = {
  id: string;
  index: number;
  slots: number;
  cardOrder: (BinderCard | null)[];
};

export default function BinderDetailPage() {
  const params = useParams<{ binderId: string }>();
  const binderId = params?.binderId;
  const user = useAppSelector((state) => state.auth.user);

  const [binder, setBinder] = useState<{
    id: string;
    name: string;
    layout: string;
    theme: string;
  } | null>(null);

  const [pages, setPages] = useState<BinderPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [addCardsError, setAddCardsError] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [spreadIndex, setSpreadIndex] = useState(0);

  const sensors = useSensors(useSensor(PointerSensor));

  const layoutColumns = useMemo(() => {
    if (binder?.layout === "2x2") return 2;
    if (binder?.layout === "4x4") return 4;
    return 3;
  }, [binder?.layout]);

  const pagesSorted = useMemo(
    () => [...pages].sort((a, b) => a.index - b.index),
    [pages]
  );

  const [firstPage, secondPage, thirdPage] = pagesSorted;
  const leftPage = spreadIndex === 0 ? null : secondPage ?? null;
  const rightPage = spreadIndex === 0 ? firstPage ?? null : thirdPage ?? null;

  useEffect(() => {
    if (!user || !binderId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);

      const [binderData, pagesData] = await Promise.all([
        fetchBinderById(user.uid, binderId),
        fetchBinderPages(user.uid, binderId),
      ]);

      if (!mounted) return;

      setBinder(binderData);
      setPages(pagesData);

      setSpreadIndex(0);
      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [binderId, user]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (pageId: string) => (event: DragEndEvent) => {
    if (
      !event.over ||
      !event.over?.id ||
      String(event.active.id) === String(event.over?.id)
    ) {
      setActiveId(null);
      return;
    }

    setPages((prev) => {
      const page = prev.find((item) => item.id === pageId);
      if (!page) return prev;

      const items = Array.from(
        { length: page.slots },
        (_, index) => `${page.id}-slot-${index + 1}`
      );
      const oldIndex = items.indexOf(String(event.active.id));
      const newIndex = items.indexOf(String(event.over?.id));
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return prev;

      const nextPages = prev.map((item) => {
        if (item.id !== pageId) return item;
        return {
          ...item,
          cardOrder: arraySwap(item.cardOrder ?? [], oldIndex, newIndex),
        };
      });

      const updatedPage = nextPages.find((item) => item.id === pageId);
      if (updatedPage && user && binderId) {
        void updateBinderPageCardOrder(
          user.uid,
          binderId,
          pageId,
          updatedPage.cardOrder
        );
      }

      return nextPages;
    });

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-h))] items-center justify-center">
        <div className="w-full max-w-3xl px-6 py-10 text-center bg-gray-50 border border-zinc-300 rounded-xl shadow-xl backdrop-blur-sm dark:bg-zinc-900/25 dark:border-zinc-500">
          <p className="text-base font-exo font-medium text-zinc-700 dark:text-slate-100">
            Please sign in to view this binder.
          </p>
        </div>
      </div>
    );
  }

  const handleAddCards = async (items: CardPileEntry[]) => {
    if (!user || !binderId || items.length === 0) return;

    const cardsToAdd = items.flatMap(({ card, quantity }) =>
      Array.from({ length: quantity }, () => ({
        id: card.id,
        name: card.name,
        number: card.number,
        rarity: card.rarity,
        expansion: card.expansion,
        image: card.image,
      }))
    );

    if (cardsToAdd.length === 0) return;

    setAddCardsError(null);

    try {
      const result = await addCardsToBinder(user.uid, binderId, cardsToAdd);
      setPages(result.pages);
      if (result.remainingCount > 0) {
        setAddCardsError(
          `Only ${result.addedCount} card(s) were added because the binder is full.`
        );
      }
    } catch {
      setAddCardsError("Failed to add cards to binder.");
      throw new Error("Failed to add cards.");
    }
  };

  return (
    <div className="w-full py-4">
      <div className="mb-4 flex justify-end">
        <AddCardsModal
          maxCardsInPile={binder ? layoutToSlots(binder.layout) : undefined}
          onAddCards={handleAddCards}
        />
      </div>
      {addCardsError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {addCardsError}
        </div>
      ) : null}
      <div>
        {loading && (
          <div className="p-4 text-sm font-exo text-zinc-700 dark:text-slate-100">
            Loading pages...
          </div>
        )}

        {!loading && (
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setSpreadIndex((prev) => Math.max(prev - 1, 0))}
              disabled={spreadIndex === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-gray-50 text-zinc-700 shadow-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-900/25 dark:text-slate-100">
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="grid w-full grid-cols-2 gap-4">
              {spreadIndex === 0 ? (
                <InsideCover />
              ) : (
                <PagePanel
                  page={leftPage}
                  layoutColumns={layoutColumns}
                  sensors={sensors}
                  activeId={activeId}
                  onDragStart={handleDragStart}
                  onDragEnd={leftPage ? handleDragEnd(leftPage.id) : () => {}}
                  onDragCancel={handleDragCancel}
                />
              )}

              <PagePanel
                page={rightPage}
                layoutColumns={layoutColumns}
                sensors={sensors}
                activeId={activeId}
                onDragStart={handleDragStart}
                onDragEnd={rightPage ? handleDragEnd(rightPage.id) : () => {}}
                onDragCancel={handleDragCancel}
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setSpreadIndex((prev) =>
                  Math.min(prev + 1, pagesSorted.length > 1 ? 1 : 0)
                )
              }
              disabled={pagesSorted.length <= 1 || spreadIndex === 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-gray-50 text-zinc-700 shadow-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-900/25 dark:text-slate-100">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
