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
import {
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Pencil,
  Plus,
  Save,
  Settings,
} from "lucide-react";
import {
  type BinderGoal,
  type BinderCard,
  fetchBinderById,
  fetchBinderPages,
  layoutToSlots,
  updateBinderGoals,
  updateBinderPageCardOrders,
  updateBinderSettings,
} from "@/lib/firebase/services/binderService";
import InsideCover from "@/components/binder/InsideCover";
import PagePanel from "@/components/binder/PagePanel";
import AddCardsModal from "@/modals/AddCardsModal";
import { Skeleton } from "@/components/ui/skeleton";
import { binderMessages } from "@/config/binderMessages";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toggle } from "@/components/ui/toggle";
import type { CardPileEntry } from "@/components/binder/CardSelection/CardSelection";

type BinderPage = {
  id: string;
  index: number;
  slots: number;
  cardOrder: (BinderCard | null)[];
};

const GOAL_LIMIT = 3;
const GOAL_CHAR_LIMIT = 150;
const GOAL_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function parseGoalTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return timestamp;
}

function formatGoalCooldownRemaining(remainingMs: number) {
  const totalMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function computeGoalSlotsUsed(goals: BinderGoal[], now: number) {
  const activeGoals = goals.filter((goal) => !goal.completed).length;
  const coolingCompletedGoals = goals.filter((goal) => {
    if (!goal.completed) return false;
    const completedAt = parseGoalTimestamp(goal.completedAt);
    if (completedAt === null) return false;
    return now - completedAt < GOAL_COOLDOWN_MS;
  }).length;

  return activeGoals + coolingCompletedGoals;
}

function slotSignature(card: BinderCard | null) {
  if (!card) return "";
  return `${card.id}:${card.number ?? ""}:${card.collectionStatus ?? "collected"}`;
}

function pageSignature(cardOrder: (BinderCard | null)[]) {
  return cardOrder.map((card) => slotSignature(card)).join("|");
}

function buildPageSignatures(pages: BinderPage[]) {
  const signatures: Record<string, string> = {};
  for (const page of pages) {
    signatures[page.id] = pageSignature(page.cardOrder ?? []);
  }
  return signatures;
}

function computeDirtyPageIds(
  pages: BinderPage[],
  baselineSignatures: Record<string, string>,
) {
  const dirty = new Set<string>();
  for (const page of pages) {
    const baseline = baselineSignatures[page.id] ?? "";
    const current = pageSignature(page.cardOrder ?? []);
    if (baseline !== current) dirty.add(page.id);
  }
  return dirty;
}

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
        collectionStatus: "collected",
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
    showGoals?: boolean;
    goals?: BinderGoal[];
  } | null>(null);

  const [pages, setPages] = useState<BinderPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [goalText, setGoalText] = useState("");
  const [isUpdatingGoals, setIsUpdatingGoals] = useState(false);
  const [goalClock, setGoalClock] = useState(() => Date.now());
  const [addCardsError, setAddCardsError] = useState<string | null>(null);
  const [dirtyPageIds, setDirtyPageIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isAddCardsModalOpen, setIsAddCardsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsShowGoals, setSettingsShowGoals] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const pendingNavigationRef = useRef<null | (() => void)>(null);
  const bypassUnsavedGuardRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  const pagesRef = useRef<BinderPage[]>([]);
  const baselinePageSignaturesRef = useRef<Record<string, string>>({});

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
  const currentPageIndex = spreadIndex === 0 ? 1 : 2;
  const totalPageSpreads = pagesSorted.length > 1 ? 2 : 1;
  const hasUnsavedChanges = dirtyPageIds.size > 0;
  const isTwoByTwoLayout = layoutColumns === 2;
  const isFourByFourLayout = layoutColumns === 4;
  const binderCapacity = useMemo(() => {
    const totalSlots = pagesSorted.reduce((sum, page) => sum + page.slots, 0);
    const filledSlots = pagesSorted.reduce(
      (sum, page) =>
        sum + page.cardOrder.filter((card): card is BinderCard => card !== null).length,
      0,
    );

    return { totalSlots, filledSlots };
  }, [pagesSorted]);
  const goals = useMemo(() => binder?.goals ?? [], [binder?.goals]);
  const activeGoalCount = useMemo(
    () => goals.filter((goal) => !goal.completed).length,
    [goals],
  );
  const goalSlotsUsed = useMemo(
    () => computeGoalSlotsUsed(goals, goalClock),
    [goals, goalClock],
  );
  const canAddGoal = goalSlotsUsed < GOAL_LIMIT;
  const nextGoalAvailableAt = useMemo(() => {
    if (canAddGoal) return null;

    const readyTimes = goals
      .filter((goal) => goal.completed)
      .map((goal) => parseGoalTimestamp(goal.completedAt))
      .filter((value): value is number => value !== null)
      .map((completedAt) => completedAt + GOAL_COOLDOWN_MS)
      .filter((readyAt) => readyAt > goalClock)
      .sort((left, right) => left - right);

    if (readyTimes.length === 0) return null;
    return readyTimes[0];
  }, [canAddGoal, goalClock, goals]);
  const goalCooldownRemainingMs = useMemo(() => {
    if (!nextGoalAvailableAt) return 0;
    return Math.max(0, nextGoalAvailableAt - goalClock);
  }, [goalClock, nextGoalAvailableAt]);
  const goalInputDisabledReason = useMemo(() => {
    if (canAddGoal) return null;
    if (nextGoalAvailableAt) {
      return `Goal limit reached. New goal available in ${formatGoalCooldownRemaining(goalCooldownRemainingMs)}.`;
    }
    return binderMessages.errors.goalLimitReached;
  }, [canAddGoal, goalCooldownRemainingMs, nextGoalAvailableAt]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setGoalClock(Date.now());
    }, 60 * 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

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
      setGoalText("");
      setGoalClock(Date.now());
      pagesRef.current = pagesData;
      baselinePageSignaturesRef.current = buildPageSignatures(pagesData);
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
    const activeId = String(event.active.id);
    const match = activeId.match(/^(.*)-slot-(\d+)$/);
    if (!match) {
      setActiveId(activeId);
      return;
    }

    const [, pageId, slotNumber] = match;
    const page = pages.find((item) => item.id === pageId);
    const slotIndex = Number(slotNumber) - 1;
    const card = page?.cardOrder?.[slotIndex] ?? null;
    if (!card) {
      setActiveId(null);
      return;
    }

    setActiveId(activeId);
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
    let nextPagesResult: BinderPage[] | null = null;
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
      if (page.cardOrder?.[oldIndex] == null) return prev;
      didChange = true;

      nextPagesResult = prev.map((item) => {
        if (item.id !== pageId) return item;
        return {
          ...item,
          cardOrder: arraySwap(item.cardOrder ?? [], oldIndex, newIndex),
        };
      });
      pagesRef.current = nextPagesResult;
      return nextPagesResult;
    });
    if (didChange) {
      if (nextPagesResult) {
        setDirtyPageIds(
          computeDirtyPageIds(nextPagesResult, baselinePageSignaturesRef.current),
        );
      }
      setSaveError(null);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDeleteCardFromSlot = (pageId: string, slotIndex: number) => {
    let nextPagesResult: BinderPage[] | null = null;
    setPages((prev) => {
      nextPagesResult = prev.map((page) => {
        if (page.id !== pageId) return page;
        const cardOrder = [...(page.cardOrder ?? [])];
        if (!cardOrder[slotIndex]) return page;
        cardOrder[slotIndex] = null;
        return {
          ...page,
          cardOrder,
        };
      });
      if (nextPagesResult) pagesRef.current = nextPagesResult;
      return nextPagesResult;
    });
    if (nextPagesResult) {
      setDirtyPageIds(
        computeDirtyPageIds(nextPagesResult, baselinePageSignaturesRef.current),
      );
      setSaveError(null);
    }
  };

  const handleToggleMissingForSlot = (pageId: string, slotIndex: number) => {
    let nextPagesResult: BinderPage[] | null = null;
    setPages((prev) => {
      nextPagesResult = prev.map((page) => {
        if (page.id !== pageId) return page;
        const cardOrder = [...(page.cardOrder ?? [])];
        const existingCard = cardOrder[slotIndex];
        if (!existingCard) return page;
        cardOrder[slotIndex] = {
          ...existingCard,
          collectionStatus:
            (existingCard.collectionStatus ?? "collected") === "missing"
              ? "collected"
              : "missing",
        };
        return {
          ...page,
          cardOrder,
        };
      });
      if (nextPagesResult) pagesRef.current = nextPagesResult;
      return nextPagesResult;
    });
    if (nextPagesResult) {
      setDirtyPageIds(
        computeDirtyPageIds(nextPagesResult, baselinePageSignaturesRef.current),
      );
      setSaveError(null);
    }
  };

  const handleAddCards = async (items: CardPileEntry[]) => {
    if (items.length === 0) return;

    const cardsToAdd = buildCardsToAddFromPile(items);

    if (cardsToAdd.length === 0) return;

    setAddCardsError(null);
    setSaveError(null);

    const result = addCardsToLocalPages(pages, cardsToAdd);
    setPages(result.nextPages);
    pagesRef.current = result.nextPages;
    setDirtyPageIds(
      computeDirtyPageIds(result.nextPages, baselinePageSignaturesRef.current),
    );
    if (result.remainingCount > 0) {
      setAddCardsError(binderMessages.errors.addCardsBinderFull(result.addedCount));
    }
  };

  const handleAddGoal = async () => {
    if (!user || !binderId || !binder || isUpdatingGoals) return;

    const sanitizedText = goalText.trim().slice(0, GOAL_CHAR_LIMIT);
    if (!sanitizedText) return;

    const currentGoals = binder.goals ?? [];
    if (computeGoalSlotsUsed(currentGoals, Date.now()) >= GOAL_LIMIT) {
      toast.error(goalInputDisabledReason ?? binderMessages.errors.goalLimitReached);
      return;
    }

    const nextGoal: BinderGoal = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: sanitizedText,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    const nextGoals = [...currentGoals, nextGoal];

    setIsUpdatingGoals(true);
    try {
      await updateBinderGoals(user.uid, binderId, nextGoals);
      setBinder((prev) =>
        prev
          ? {
              ...prev,
              goals: nextGoals,
            }
          : prev,
      );
      setGoalText("");
      setGoalClock(Date.now());
      toast.success(binderMessages.toast.goalAdded);
    } catch {
      toast.error(binderMessages.errors.goalSaveFailed);
    } finally {
      setIsUpdatingGoals(false);
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    if (!user || !binderId || !binder || isUpdatingGoals) return;

    const currentGoals = binder.goals ?? [];
    const goalToUpdate = currentGoals.find((goal) => goal.id === goalId);
    if (!goalToUpdate || goalToUpdate.completed) return;

    const completedAt = new Date().toISOString();
    const nextGoals = currentGoals.map((goal) =>
      goal.id === goalId
        ? {
            ...goal,
            completed: true,
            completedAt,
          }
        : goal,
    );

    setIsUpdatingGoals(true);
    try {
      await updateBinderGoals(user.uid, binderId, nextGoals);
      setBinder((prev) =>
        prev
          ? {
              ...prev,
              goals: nextGoals,
            }
          : prev,
      );
      setGoalClock(Date.now());
      toast.success(binderMessages.toast.goalCompleted);
    } catch {
      toast.error(binderMessages.errors.goalSaveFailed);
    } finally {
      setIsUpdatingGoals(false);
    }
  };

  const handleSaveChanges = useCallback(
    async (
      successMessage: string = binderMessages.toast.saved,
    ): Promise<boolean> => {
      if (!user || !binderId || isSaving) return false;

      const pagesToSave = pagesRef.current;
      const currentDirtyPageIds = computeDirtyPageIds(
        pagesToSave,
        baselinePageSignaturesRef.current,
      );
      if (currentDirtyPageIds.size === 0) return false;

      setIsSaving(true);
      setSaveError(null);

      try {
        const updates = pagesToSave
          .filter((page) => currentDirtyPageIds.has(page.id))
          .map((page) => ({ pageId: page.id, cardOrder: page.cardOrder }));
        await updateBinderPageCardOrders(user.uid, binderId, updates);
        baselinePageSignaturesRef.current = buildPageSignatures(pagesToSave);
        setDirtyPageIds(new Set());
        toast.success(successMessage);
        return true;
      } catch {
        setSaveError(binderMessages.errors.saveFailed);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [binderId, isSaving, user],
  );

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

  const handleSaveFromMenu = async () => {
    const saved = await handleSaveChanges();
    if (saved && !isEditMode) setIsActionMenuOpen(false);
  };

  const handleEditFromMenu = async () => {
    if (!isEditMode) {
      setIsEditMode(true);
      setIsActionMenuOpen(true);
      return;
    }

    const hasEditChanges =
      computeDirtyPageIds(pagesRef.current, baselinePageSignaturesRef.current)
        .size > 0;

    let didSave = true;
    if (hasEditChanges) {
      didSave = await handleSaveChanges(binderMessages.toast.editSaved);
    }
    if (!didSave) {
      setIsActionMenuOpen(true);
      return;
    }
    setIsEditMode(false);
    setIsActionMenuOpen(false);
  };

  const handleSettingsFromMenu = () => {
    setIsActionMenuOpen(false);
    setSettingsName(binder?.name ?? "");
    setSettingsShowGoals(binder?.showGoals ?? true);
    setIsSettingsModalOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!user || !binderId || !binder || isSavingSettings) return;

    const nextName = settingsName.trim();
    if (!nextName) {
      toast.error("Binder title is required.");
      return;
    }

    setIsSavingSettings(true);
    try {
      await updateBinderSettings(user.uid, binderId, {
        name: nextName,
        showGoals: settingsShowGoals,
      });
      setBinder((prev) =>
        prev
          ? {
              ...prev,
              name: nextName,
              showGoals: settingsShowGoals,
            }
          : prev,
      );
      setIsSettingsModalOpen(false);
      toast.success(binderMessages.toast.settingsSaved);
    } catch {
      toast.error(binderMessages.errors.saveFailed);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleOpenAddCards = () => {
    if (!isEditMode) {
      setIsActionMenuOpen(false);
    }
    setIsAddCardsModalOpen(true);
  };

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
            {binderMessages.auth.signInRequired}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
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
      <div className="flex-1 min-h-0 pt-2 pb-20">
        {loading && (
          <div className="flex h-full min-w-0 flex-col items-center justify-start gap-2">
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                disabled
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center text-zinc-700 opacity-50 dark:text-slate-100">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[3.5rem] text-center text-xs font-exo font-medium text-zinc-700 opacity-60 dark:text-slate-100">
                {currentPageIndex}/{totalPageSpreads}
              </span>
              <button
                type="button"
                disabled
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center text-zinc-700 opacity-50 dark:text-slate-100">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

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
          </div>
        )}

        {!loading && (
          <div className="flex h-full min-w-0 flex-col items-center justify-start gap-2">
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setSpreadIndex((prev) => Math.max(prev - 1, 0))}
                disabled={spreadIndex === 0}
                className="flex h-6 w-6 shrink-0 items-center justify-center text-zinc-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:text-slate-100">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[3.5rem] text-center text-xs font-exo font-medium text-zinc-700 dark:text-slate-100">
                {currentPageIndex}/{totalPageSpreads}
              </span>
              <button
                type="button"
                onClick={() =>
                  setSpreadIndex((prev) =>
                    Math.min(prev + 1, pagesSorted.length > 1 ? 1 : 0),
                  )
                }
                disabled={pagesSorted.length <= 1 || spreadIndex === 1}
                className="flex h-6 w-6 shrink-0 items-center justify-center text-zinc-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:text-slate-100">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div
              className={`grid min-w-0 grid-cols-2 ${
                isTwoByTwoLayout
                  ? "mx-auto w-full max-w-[68rem] flex-none gap-3"
                  : isFourByFourLayout
                    ? "mx-auto w-full max-w-[68rem] flex-none gap-2"
                    : "mx-auto w-full max-w-[68rem] flex-none gap-4"
              }`}>
              {spreadIndex === 0 ? (
                <InsideCover
                  colorScheme={binder?.colorScheme}
                  binderName={binder?.name}
                  filledSlots={binderCapacity.filledSlots}
                  totalSlots={binderCapacity.totalSlots}
                  showGoals={binder?.showGoals}
                  goals={goals}
                  goalText={goalText}
                  goalCharLimit={GOAL_CHAR_LIMIT}
                  goalLimit={GOAL_LIMIT}
                  goalInputDisabled={!canAddGoal || isUpdatingGoals}
                  goalSubmitDisabled={
                    !canAddGoal || isUpdatingGoals || goalText.trim().length === 0
                  }
                  goalInputDisabledReason={goalInputDisabledReason}
                  activeGoalCount={activeGoalCount}
                  isUpdatingGoals={isUpdatingGoals}
                  onGoalTextChange={(value) =>
                    setGoalText(value.slice(0, GOAL_CHAR_LIMIT))
                  }
                  onAddGoal={() => void handleAddGoal()}
                  onCompleteGoal={(goalId) => void handleCompleteGoal(goalId)}
                />
              ) : (
                <PagePanel
                  page={leftPage}
                  layoutColumns={layoutColumns}
                  sensors={sensors}
                  activeId={activeId}
                  colorScheme={binder?.colorScheme}
                  onAddCard={handleOpenAddCards}
                  onDeleteCard={handleDeleteCardFromSlot}
                  onToggleMissing={handleToggleMissingForSlot}
                  isEditMode={isEditMode}
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
                onAddCard={handleOpenAddCards}
                onDeleteCard={handleDeleteCardFromSlot}
                onToggleMissing={handleToggleMissingForSlot}
                isEditMode={isEditMode}
                onDragStart={handleDragStart}
                onDragEnd={rightPage ? handleDragEnd(rightPage.id) : () => {}}
                onDragCancel={handleDragCancel}
              />
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-40">
        <div
          className={`absolute bottom-14 right-0 flex flex-col items-end gap-2 transition-all duration-300 ${
            isActionMenuOpen
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          }`}>
          <button
            type="button"
            onClick={handleOpenAddCards}
            className="group relative flex h-12 items-center overflow-hidden rounded-full border border-accent bg-accent px-4 text-sm font-exo font-medium text-white shadow-lg transition-all duration-300 hover:pr-5 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-accent dark:bg-accent dark:text-white dark:hover:bg-accent/90">
            <Plus className="relative z-10 h-4 w-4 shrink-0" />
            <span className="relative z-10 max-w-0 overflow-hidden whitespace-nowrap pl-0 transition-all duration-300 group-hover:max-w-20 group-hover:pl-2">
              Add card
            </span>
          </button>

          <button
            type="button"
            onClick={() => void handleSaveFromMenu()}
            disabled={!hasUnsavedChanges || isSaving}
            aria-label={isSaving ? "Saving changes" : "Save changes"}
            className={`group flex h-12 items-center overflow-hidden rounded-full border px-4 text-sm font-exo font-medium shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent ${
              hasUnsavedChanges && !isSaving
                ? "border-red-600 bg-red-500 text-white animate-[pulse_3s_ease-in-out_infinite] hover:pr-5 hover:bg-red-600 dark:border-red-500 dark:bg-red-600 dark:text-white dark:hover:bg-red-500"
                : "cursor-not-allowed border-zinc-300 bg-slate-200 text-zinc-700 opacity-70 dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100"
            }`}>
            <Save className="h-4 w-4 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap pl-0 transition-all duration-300 group-hover:max-w-16 group-hover:pl-2">
              {isSaving ? "Saving..." : "Save"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void handleEditFromMenu()}
            className={`group flex h-12 items-center overflow-hidden rounded-full border px-4 text-sm font-exo font-medium shadow-lg transition-all duration-300 hover:pr-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent ${
              isEditMode
                ? "border-emerald-600 bg-emerald-500 text-white hover:bg-emerald-600 dark:border-emerald-500 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500"
                : "border-zinc-300 bg-slate-200 text-zinc-700 hover:bg-slate-300 dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600"
            }`}>
            {isEditMode ? (
              <Save className="h-4 w-4 shrink-0" />
            ) : (
              <Pencil className="h-4 w-4 shrink-0" />
            )}
            <span className="max-w-0 overflow-hidden whitespace-nowrap pl-0 transition-all duration-300 group-hover:max-w-16 group-hover:pl-2">
              {isEditMode ? "Save" : "Edit"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSettingsFromMenu}
            className="group flex h-12 items-center overflow-hidden rounded-full border border-zinc-300 bg-slate-200 px-4 text-sm font-exo font-medium text-zinc-700 shadow-lg transition-all duration-300 hover:pr-5 hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600">
            <Settings className="h-4 w-4 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap pl-0 transition-all duration-300 group-hover:max-w-20 group-hover:pl-2">
              Settings
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isEditMode) {
              setIsActionMenuOpen(true);
              return;
            }
            setIsActionMenuOpen((open) => !open);
          }}
          aria-expanded={isActionMenuOpen}
          aria-label={isActionMenuOpen ? "Hide actions" : "Show actions"}
          className={`flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent ${
            hasUnsavedChanges
              ? "border-red-600 bg-red-500 text-white hover:bg-red-600 dark:border-red-500 dark:bg-red-600 dark:text-white dark:hover:bg-red-500"
              : "border-zinc-300 bg-slate-200 text-zinc-700 hover:bg-slate-300 dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600"
          }`}>
          <EllipsisVertical className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </button>
      </div>

      <AddCardsModal
        open={isAddCardsModalOpen}
        onOpenChange={setIsAddCardsModalOpen}
        hideTrigger
        maxCardsInPile={binder ? layoutToSlots(binder.layout) : undefined}
        onAddCards={handleAddCards}
      />

      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle>{binderMessages.leaveModal.title}</DialogTitle>
            <DialogDescription>{binderMessages.leaveModal.description}</DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex gap-2 sm:justify-end sm:space-x-0">
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(false)}
              className="rounded-full border border-zinc-300 bg-slate-200 px-4 py-2 text-sm font-exo font-medium text-zinc-700 transition hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600">
              {binderMessages.leaveModal.stay}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void saveAndContinueNavigation()}
              className="rounded-full border border-emerald-600 bg-emerald-500 px-4 py-2 text-sm font-exo font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500">
              {isSaving ? "Saving..." : binderMessages.leaveModal.saveAndLeave}
            </button>
            <button
              type="button"
              onClick={continuePendingNavigation}
              className="rounded-full border border-red-400 bg-red-500 px-4 py-2 text-sm font-exo font-medium text-white transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-red-400 dark:bg-red-600 dark:hover:bg-red-500">
              {binderMessages.leaveModal.discardAndLeave}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle>Binder Settings</DialogTitle>
            <DialogDescription>
              Update your binder title and goal visibility.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="binder-title"
                className="text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
                Binder title
              </label>
              <input
                id="binder-title"
                type="text"
                value={settingsName}
                maxLength={80}
                onChange={(event) => setSettingsName(event.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-exo text-zinc-700 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-600 dark:bg-zinc-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-300/70 bg-slate-50 px-3 py-3 dark:border-zinc-600/70 dark:bg-zinc-900/35">
              <div>
                <p className="text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
                  Show goals
                </p>
                <p className="text-xs font-exo text-zinc-600 dark:text-slate-300">
                  Toggle goals panel visibility on the inside cover.
                </p>
              </div>
              <Toggle
                variant="outline"
                pressed={settingsShowGoals}
                onPressedChange={setSettingsShowGoals}>
                {settingsShowGoals ? "On" : "Off"}
              </Toggle>
            </div>
          </div>

          <DialogFooter className="mt-4 flex gap-2 sm:justify-end sm:space-x-0">
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(false)}
              className="rounded-full border border-zinc-300 bg-slate-200 px-4 py-2 text-sm font-exo font-medium text-zinc-700 transition hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600">
              Cancel
            </button>
            <button
              type="button"
              disabled={isSavingSettings}
              onClick={() => void handleSaveSettings()}
              className="rounded-full border border-emerald-600 bg-emerald-500 px-4 py-2 text-sm font-exo font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500">
              {isSavingSettings ? "Saving..." : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
