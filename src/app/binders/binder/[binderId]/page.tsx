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
  fetchBinderById,
  fetchBinderPages,
} from "@/lib/firebase/services/binderService";
import InsideCover from "@/components/binder/InsideCover";
import PagePanel from "@/components/binder/PagePanel";
import AddCardsModal from "@/modals/AddCardsModal";

type BinderPage = {
  id: string;
  index: number;
  slots: number;
  cardOrder: (string | null)[];
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

  const [pageSlotOrders, setPageSlotOrders] = useState<
    Record<string, string[]>
  >({});

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

      setPageSlotOrders(
        pagesData.reduce<Record<string, string[]>>((acc, page) => {
          const slots = page.slots ?? page.cardOrder?.length ?? 0;
          acc[page.id] = Array.from(
            { length: slots },
            (_, index) => `${page.id}-slot-${index + 1}`
          );
          return acc;
        }, {})
      );

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

    setPageSlotOrders((prev) => {
      const items = prev[pageId] ?? [];
      const oldIndex = items.indexOf(String(event.active.id));
      const newIndex = items.indexOf(String(event.over?.id));
      if (oldIndex < 0 || newIndex < 0) return prev;

      return {
        ...prev,
        [pageId]: arraySwap(items, oldIndex, newIndex),
      };
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

  return (
    <div className="w-full py-4">
      <div className="mb-4 flex justify-end">
        <AddCardsModal />
      </div>
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
                  slotOrder={leftPage ? pageSlotOrders[leftPage.id] ?? [] : []}
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
                slotOrder={rightPage ? pageSlotOrders[rightPage.id] ?? [] : []}
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
