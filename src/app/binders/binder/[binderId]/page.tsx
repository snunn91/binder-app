"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAppSelector } from "@/lib/store/storeHooks";
import {
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arraySwap } from "@dnd-kit/sortable";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import {
  type BinderCard,
  fetchBinderById,
  fetchBinderPages,
  layoutToSlots,
  updateBinderPageCardOrders,
} from "@/lib/firebase/services/binderService";
import InsideCover from "@/components/binder/InsideCover";
import PagePanel from "@/components/binder/PagePanel";
import AddCardsModal from "@/modals/AddCardsModal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CardPileEntry } from "@/components/binder/CardSelection/CardSelection";

type BinderPage = {
  id: string;
  index: number;
  slots: number;
  cardOrder: (BinderCard | null)[];
};

function buildCardsToAddFromPile(items: CardPileEntry[]): BinderCard[] {
  const cardsToAdd: BinderCard[] = [];

  for (const { card, quantity } of items) {
    if (quantity <= 0) continue;

    // Keep card pile order exact, and place duplicates consecutively.
    for (let index = 0; index < quantity; index += 1) {
      cardsToAdd.push({
        id: card.id,
        name: card.name,
        number: card.number,
        rarity: card.rarity,
        expansion: card.expansion,
        image: card.image,
      });
    }
  }

  return cardsToAdd;
}

function addCardsToLocalPages(
  pages: BinderPage[],
  cards: BinderCard[],
): {
  nextPages: BinderPage[];
  changedPageIds: string[];
  addedCount: number;
  remainingCount: number;
} {
  const nextPages = pages.map((page) => ({
    ...page,
    cardOrder: [...(page.cardOrder ?? [])],
  }));
  const orderedPages = [...nextPages].sort((a, b) => a.index - b.index);
  const changedPageIds = new Set<string>();
  let cardIndex = 0;

  for (const page of orderedPages) {
    for (
      let slotIndex = 0;
      slotIndex < page.slots && cardIndex < cards.length;
      slotIndex += 1
    ) {
      if (page.cardOrder[slotIndex] !== null) continue;
      page.cardOrder[slotIndex] = cards[cardIndex];
      cardIndex += 1;
      changedPageIds.add(page.id);
    }

    if (cardIndex >= cards.length) break;
  }

  return {
    nextPages,
    changedPageIds: Array.from(changedPageIds),
    addedCount: cardIndex,
    remainingCount: cards.length - cardIndex,
  };
}

export default function BinderDetailPage() {
  const router = useRouter();
  const params = useParams<{ binderId: string }>();
  const binderId = params?.binderId;
  const user = useAppSelector((state) => state.auth.user);

  const [binder, setBinder] = useState<{
    id: string;
    name: string;
    layout: string;
    colorScheme: string;
  } | null>(null);

  const [pages, setPages] = useState<BinderPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [addCardsError, setAddCardsError] = useState<string | null>(null);
  const [dirtyPageIds, setDirtyPageIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const pendingNavigationRef = useRef<null | (() => void)>(null);
  const bypassUnsavedGuardRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);

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
    [pages],
  );

  const [firstPage, secondPage, thirdPage] = pagesSorted;
  const leftPage = spreadIndex === 0 ? null : (secondPage ?? null);
  const rightPage =
    spreadIndex === 0 ? (firstPage ?? null) : (thirdPage ?? null);
  const hasUnsavedChanges = dirtyPageIds.size > 0;
  const isTwoByTwoLayout = layoutColumns === 2;
  const isFourByFourLayout = layoutColumns === 4;

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

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
      setDirtyPageIds(new Set());
      setSaveError(null);

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

    let didChange = false;
    setPages((prev) => {
      const page = prev.find((item) => item.id === pageId);
      if (!page) return prev;

      const items = Array.from(
        { length: page.slots },
        (_, index) => `${page.id}-slot-${index + 1}`,
      );
      const oldIndex = items.indexOf(String(event.active.id));
      const newIndex = items.indexOf(String(event.over?.id));
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return prev;
      didChange = true;

      return prev.map((item) => {
        if (item.id !== pageId) return item;
        return {
          ...item,
          cardOrder: arraySwap(item.cardOrder ?? [], oldIndex, newIndex),
        };
      });
    });
    if (didChange) {
      setDirtyPageIds((prev) => {
        const next = new Set(prev);
        next.add(pageId);
        return next;
      });
      setSaveError(null);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleAddCards = async (items: CardPileEntry[]) => {
    if (items.length === 0) return;

    const cardsToAdd = buildCardsToAddFromPile(items);

    if (cardsToAdd.length === 0) return;

    setAddCardsError(null);
    setSaveError(null);

    const result = addCardsToLocalPages(pages, cardsToAdd);
    setPages(result.nextPages);
    if (result.changedPageIds.length > 0) {
      setDirtyPageIds((prev) => {
        const next = new Set(prev);
        for (const changedId of result.changedPageIds) {
          next.add(changedId);
        }
        return next;
      });
    }
    if (result.remainingCount > 0) {
      setAddCardsError(
        `Only ${result.addedCount} card(s) were added because the binder is full.`,
      );
    }
  };

  const handleSaveChanges = useCallback(async (): Promise<boolean> => {
    if (!user || !binderId || !hasUnsavedChanges || isSaving) return false;

    setIsSaving(true);
    setSaveError(null);

    try {
      const dirtyIds = new Set(dirtyPageIds);
      const updates = pages
        .filter((page) => dirtyIds.has(page.id))
        .map((page) => ({ pageId: page.id, cardOrder: page.cardOrder }));
      await updateBinderPageCardOrders(user.uid, binderId, updates);
      setDirtyPageIds(new Set());
      toast.success("your binder has been updated");
      return true;
    } catch {
      setSaveError("Failed to save changes.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [binderId, dirtyPageIds, hasUnsavedChanges, isSaving, pages, user]);

  const openLeaveModal = useCallback((navigationAction: () => void) => {
    pendingNavigationRef.current = navigationAction;
    setIsLeaveModalOpen(true);
  }, []);

  const continuePendingNavigation = useCallback(() => {
    const action = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setIsLeaveModalOpen(false);
    if (!action) return;
    bypassUnsavedGuardRef.current = true;
    action();
  }, []);

  const saveAndContinueNavigation = useCallback(async () => {
    const saved = await handleSaveChanges();
    if (!saved) return;
    continuePendingNavigation();
  }, [continuePendingNavigation, handleSaveChanges]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges || bypassUnsavedGuardRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!hasUnsavedChanges || bypassUnsavedGuardRef.current) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      const current =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      const next = nextUrl.pathname + nextUrl.search + nextUrl.hash;
      if (current === next) return;

      event.preventDefault();
      openLeaveModal(() => {
        router.push(next);
      });
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => {
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [hasUnsavedChanges, openLeaveModal, router]);

  useEffect(() => {
    window.history.pushState({ binderGuard: true }, "", window.location.href);

    const onPopState = () => {
      if (!hasUnsavedChangesRef.current || bypassUnsavedGuardRef.current)
        return;
      window.history.go(1);
      openLeaveModal(() => {
        window.history.back();
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [openLeaveModal]);

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
    <div className="flex h-full w-full flex-col overflow-hidden py-3">
      {addCardsError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {addCardsError}
        </div>
      ) : null}
      {saveError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {saveError}
        </div>
      ) : null}
      <div className="flex-1 min-h-0 pt-3 pb-20">
        {loading && (
          <div className="flex h-full min-w-0 items-center justify-center gap-4">
            <button
              type="button"
              disabled
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-gray-50 text-zinc-700 shadow-sm opacity-50 dark:border-zinc-500 dark:bg-zinc-900/25 dark:text-slate-100">
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div
              className={`grid min-w-0 grid-cols-2 ${
                isTwoByTwoLayout
                  ? "mx-auto w-full max-w-[68rem] flex-none gap-3"
                  : isFourByFourLayout
                    ? "mx-auto w-full max-w-[68rem] flex-none gap-2"
                    : "mx-auto w-full max-w-[68rem] flex-none gap-4"
              }`}>
              {[0, 1].map((panelIndex) => (
                <div
                  key={panelIndex}
                  className={`rounded-xl border border-zinc-300 bg-gray-50 shadow-lg dark:border-zinc-500 dark:bg-zinc-900/25 ${
                    isFourByFourLayout ? "p-1.5" : "p-3"
                  }`}>
                  <Skeleton className="h-4 w-20" />
                  <div
                    className={`${isFourByFourLayout ? "mt-2" : "mt-4"} grid ${
                      isTwoByTwoLayout
                        ? "gap-x-2 gap-y-7"
                        : isFourByFourLayout
                          ? "gap-1"
                          : "gap-2"
                    }`}
                    style={{
                      gridTemplateColumns: `repeat(${layoutColumns}, minmax(0, 1fr))`,
                    }}>
                    {Array.from({ length: layoutColumns * layoutColumns }).map(
                      (_, slotIndex) => (
                        <Skeleton
                          key={slotIndex}
                          className={`${
                            isTwoByTwoLayout
                              ? "aspect-[73/100] w-[84%] justify-self-center"
                              : isFourByFourLayout
                                ? "aspect-[3/4] w-[92%] justify-self-center"
                                : "aspect-[7/10] w-[84%] justify-self-center"
                          } rounded-lg`}
                        />
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-gray-50 text-zinc-700 shadow-sm opacity-50 dark:border-zinc-500 dark:bg-zinc-900/25 dark:text-slate-100">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {!loading && (
          <div className="flex h-full min-w-0 items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setSpreadIndex((prev) => Math.max(prev - 1, 0))}
              disabled={spreadIndex === 0}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-gray-50 text-zinc-700 shadow-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-900/25 dark:text-slate-100">
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div
              className={`grid min-w-0 grid-cols-2 ${
                isTwoByTwoLayout
                  ? "mx-auto w-full max-w-[68rem] flex-none gap-3"
                  : isFourByFourLayout
                    ? "mx-auto w-full max-w-[68rem] flex-none gap-2"
                    : "mx-auto w-full max-w-[68rem] flex-none gap-4"
              }`}>
              {spreadIndex === 0 ? (
                <InsideCover colorScheme={binder?.colorScheme} />
              ) : (
                <PagePanel
                  page={leftPage}
                  layoutColumns={layoutColumns}
                  sensors={sensors}
                  activeId={activeId}
                  colorScheme={binder?.colorScheme}
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
                colorScheme={binder?.colorScheme}
                onDragStart={handleDragStart}
                onDragEnd={rightPage ? handleDragEnd(rightPage.id) : () => {}}
                onDragCancel={handleDragCancel}
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setSpreadIndex((prev) =>
                  Math.min(prev + 1, pagesSorted.length > 1 ? 1 : 0),
                )
              }
              disabled={pagesSorted.length <= 1 || spreadIndex === 1}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-gray-50 text-zinc-700 shadow-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-900/25 dark:text-slate-100">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-6 right-6 z-40 flex justify-end gap-3">
        <AddCardsModal
          maxCardsInPile={binder ? layoutToSlots(binder.layout) : undefined}
          onAddCards={handleAddCards}
        />

        <button
          type="button"
          onClick={() => void handleSaveChanges()}
          disabled={!hasUnsavedChanges || isSaving}
          aria-label={isSaving ? "Saving changes" : "Save changes"}
          className={`group flex h-12 items-center overflow-hidden rounded-full border px-4 text-sm font-exo font-medium shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent ${
            hasUnsavedChanges && !isSaving
              ? "border-emerald-600 bg-emerald-500 text-white animate-[pulse_3s_ease-in-out_infinite] hover:pr-5 hover:bg-emerald-600 dark:border-emerald-500 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500"
              : "cursor-not-allowed border-zinc-300 bg-slate-200 text-zinc-700 opacity-70 dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100"
          }`}>
          <Save className="h-4 w-4 shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap pl-0 transition-all duration-300 group-hover:max-w-16 group-hover:pl-2">
            {isSaving ? "Saving..." : "Save"}
          </span>
        </button>
      </div>

      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle>You have unsaved changes</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave without saving?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex gap-2 sm:justify-end sm:space-x-0">
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(false)}
              className="rounded-full border border-zinc-300 bg-slate-200 px-4 py-2 text-sm font-exo font-medium text-zinc-700 transition hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600">
              Stay
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void saveAndContinueNavigation()}
              className="rounded-full border border-emerald-600 bg-emerald-500 px-4 py-2 text-sm font-exo font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500">
              {isSaving ? "Saving..." : "Save and leave"}
            </button>
            <button
              type="button"
              onClick={continuePendingNavigation}
              className="rounded-full border border-red-400 bg-red-500 px-4 py-2 text-sm font-exo font-medium text-white transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-red-400 dark:bg-red-600 dark:hover:bg-red-500">
              Discard and leave
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
