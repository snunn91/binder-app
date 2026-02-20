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
  Box,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  type BinderGoal,
  type BinderCard,
  fetchBinderById,
  fetchBinderPages,
  layoutToSlots,
  updateBinderBulkBoxCards,
  updateBinderGoals,
  updateBinderPageCardOrders,
  updateBinderSettings,
} from "@/lib/services/binderService";
import InsideCover from "@/components/binder/InsideCover";
import PagePanel from "@/components/binder/PagePanel";
import SettingToggle from "@/components/binder/SettingToggle";
import AddCardsModal from "@/modals/AddCardsModal";
import BulkBoxModal from "@/modals/BulkBoxModal";
import BinderSettingsModal from "@/modals/BinderSettingsModal";
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
import type { CardPileEntry } from "@/components/binder/CardSelection/CardSelection";
import useIsMobile from "@/lib/hooks/useIsMobile";

type BinderPage = {
  id: string;
  index: number;
  slots: number;
  cardOrder: (BinderCard | null)[];
};

const GOAL_LIMIT = 5;
const GOAL_CHAR_LIMIT = 150;
const GOAL_DELETE_LIMIT = 10;
const GOAL_DELETE_WINDOW_MS = 24 * 60 * 60 * 1000;

function parseGoalTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return timestamp;
}

function getRecentGoalDeleteTimestamps(
  goalDeleteTimestamps: string[],
  now: number,
) {
  return goalDeleteTimestamps.filter((value) => {
    const timestamp = parseGoalTimestamp(value);
    if (timestamp === null) return false;
    return now - timestamp < GOAL_DELETE_WINDOW_MS;
  });
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
  const userId = user?.uid;

  const [binder, setBinder] = useState<{
    id: string;
    name: string;
    layout: string;
    colorScheme: string;
    showGoals?: boolean;
    goals?: BinderGoal[];
    goalCooldowns?: string[];
    bulkBoxCards?: BinderCard[];
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
  const [isBulkBoxModalOpen, setIsBulkBoxModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsShowGoals, setSettingsShowGoals] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasEditSessionChanges, setHasEditSessionChanges] = useState(false);
  const pendingNavigationRef = useRef<null | (() => void)>(null);
  const bypassUnsavedGuardRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  const pagesRef = useRef<BinderPage[]>([]);
  const baselinePageSignaturesRef = useRef<Record<string, string>>({});
  const editModeBaselineSignaturesRef = useRef<Record<string, string> | null>(
    null,
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const isMobile = useIsMobile();

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
  const bulkBoxLimit = useMemo(
    () => layoutToSlots(binder?.layout ?? "3x3"),
    [binder?.layout],
  );
  const binderCapacity = useMemo(() => {
    const totalSlots = pagesSorted.reduce((sum, page) => sum + page.slots, 0);
    const filledSlots = pagesSorted.reduce(
      (sum, page) =>
        sum +
        page.cardOrder.filter((card): card is BinderCard => card !== null)
          .length,
      0,
    );

    return { totalSlots, filledSlots };
  }, [pagesSorted]);
  const bulkBoxCount = useMemo(
    () => Math.min(bulkBoxLimit, binder?.bulkBoxCards?.length ?? 0),
    [binder?.bulkBoxCards, bulkBoxLimit],
  );
  const hasFreeBinderSlot = useMemo(
    () => binderCapacity.filledSlots < binderCapacity.totalSlots,
    [binderCapacity.filledSlots, binderCapacity.totalSlots],
  );
  const rawGoals = useMemo(() => binder?.goals ?? [], [binder?.goals]);
  const goals = useMemo(
    () => rawGoals.filter((goal) => !goal.completed),
    [rawGoals],
  );
  const legacyGoalDeleteTimestamps = useMemo(
    () =>
      rawGoals
        .filter((goal) => goal.completed)
        .map((goal) => goal.completedAt)
        .filter((value): value is string => typeof value === "string"),
    [rawGoals],
  );
  const recentGoalDeleteTimestamps = useMemo(
    () =>
      getRecentGoalDeleteTimestamps(
        [...(binder?.goalCooldowns ?? []), ...legacyGoalDeleteTimestamps],
        goalClock,
      ),
    [binder?.goalCooldowns, goalClock, legacyGoalDeleteTimestamps],
  );
  const activeGoalCount = goals.length;
  const canAddGoal = activeGoalCount < GOAL_LIMIT;
  const canDeleteGoal = recentGoalDeleteTimestamps.length < GOAL_DELETE_LIMIT;
  const goalInputDisabledReason = useMemo(() => {
    if (canAddGoal) return null;
    return binderMessages.errors.goalLimitReached;
  }, [canAddGoal]);
  const goalDeleteDisabledReason = useMemo(() => {
    if (canDeleteGoal) return null;
    return binderMessages.errors.goalDeleteLimitReached;
  }, [canDeleteGoal]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    if (!isEditMode || !editModeBaselineSignaturesRef.current) {
      setHasEditSessionChanges(false);
      return;
    }

    setHasEditSessionChanges(
      computeDirtyPageIds(pages, editModeBaselineSignaturesRef.current).size >
        0,
    );
  }, [isEditMode, pages]);

  useEffect(() => {
    if (!isMobile) return;
    setIsActionMenuOpen(false);
    setIsEditMode(false);
    setHasEditSessionChanges(false);
    editModeBaselineSignaturesRef.current = null;
  }, [isMobile]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setGoalClock(Date.now());
    }, 60 * 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!userId || !binderId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);

      const [binderData, pagesData] = await Promise.all([
        fetchBinderById(userId, binderId),
        fetchBinderPages(userId, binderId),
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
      setIsEditMode(false);
      setHasEditSessionChanges(false);
      editModeBaselineSignaturesRef.current = null;

      setSpreadIndex(0);
      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [binderId, userId]);

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
          computeDirtyPageIds(
            nextPagesResult,
            baselinePageSignaturesRef.current,
          ),
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

  const handleDeleteAllCardsFromVisiblePages = () => {
    const pageIds = [leftPage?.id, rightPage?.id].filter(
      (value): value is string => Boolean(value),
    );
    if (pageIds.length === 0) return;

    let nextPagesResult: BinderPage[] | null = null;
    setPages((prev) => {
      nextPagesResult = prev.map((page) => {
        if (!pageIds.includes(page.id)) return page;
        if ((page.cardOrder ?? []).every((card) => card === null)) return page;
        return {
          ...page,
          cardOrder: Array.from({ length: page.slots }, () => null),
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
      setAddCardsError(
        binderMessages.errors.addCardsBinderFull(result.addedCount),
      );
    }
  };

  const handleAddToBulkBox = async (items: CardPileEntry[]) => {
    if (!user || !binderId || !binder) return;

    const cardsToStore = buildCardsToAddFromPile(items);
    if (cardsToStore.length === 0) return;

    const currentBulkBoxCards = (binder.bulkBoxCards ?? []).slice(
      0,
      bulkBoxLimit,
    );
    const remainingCapacity = Math.max(
      0,
      bulkBoxLimit - currentBulkBoxCards.length,
    );
    if (remainingCapacity <= 0) {
      toast.error(binderMessages.errors.bulkBoxFull(bulkBoxLimit));
      return;
    }

    const cardsToAdd = cardsToStore.slice(0, remainingCapacity);
    const nextBulkBoxCards = [...currentBulkBoxCards, ...cardsToAdd].slice(
      0,
      bulkBoxLimit,
    );

    try {
      await updateBinderBulkBoxCards(
        user.uid,
        binderId,
        nextBulkBoxCards,
        bulkBoxLimit,
      );
      setBinder((prev) =>
        prev
          ? {
              ...prev,
              bulkBoxCards: nextBulkBoxCards,
            }
          : prev,
      );
      if (cardsToAdd.length < cardsToStore.length) {
        toast.success(
          binderMessages.toast.bulkBoxAddedAndFull(
            cardsToAdd.length,
            bulkBoxLimit,
          ),
        );
      } else {
        toast.success(binderMessages.toast.bulkBoxAdded(cardsToAdd.length));
      }
    } catch {
      toast.error(binderMessages.errors.bulkBoxSaveFailed);
    }
  };

  const handleAddBulkBoxCardToBinder = async (cardIndex: number) => {
    if (isMobile || !user || !binderId || !binder || !hasFreeBinderSlot) return;

    const currentBulkBoxCards = (binder.bulkBoxCards ?? []).slice(
      0,
      bulkBoxLimit,
    );
    const cardToAdd = currentBulkBoxCards[cardIndex];
    if (!cardToAdd) return;

    const result = addCardsToLocalPages(pagesRef.current, [cardToAdd]);
    if (result.addedCount === 0) return;

    const nextBulkBoxCards = currentBulkBoxCards.filter(
      (_, index) => index !== cardIndex,
    );

    try {
      await updateBinderBulkBoxCards(
        user.uid,
        binderId,
        nextBulkBoxCards,
        bulkBoxLimit,
      );

      setPages(result.nextPages);
      pagesRef.current = result.nextPages;
      setDirtyPageIds(
        computeDirtyPageIds(
          result.nextPages,
          baselinePageSignaturesRef.current,
        ),
      );
      setSaveError(null);
      setAddCardsError(null);

      setBinder((prev) =>
        prev
          ? {
              ...prev,
              bulkBoxCards: nextBulkBoxCards,
            }
          : prev,
      );
    } catch {
      toast.error(binderMessages.errors.bulkBoxSaveFailed);
    }
  };

  const handleEmptyBulkBox = async () => {
    if (!user || !binderId || !binder) return;

    const currentBulkBoxCards = (binder.bulkBoxCards ?? []).slice(
      0,
      bulkBoxLimit,
    );
    if (currentBulkBoxCards.length === 0) return;

    try {
      await updateBinderBulkBoxCards(user.uid, binderId, [], bulkBoxLimit);
      setBinder((prev) =>
        prev
          ? {
              ...prev,
              bulkBoxCards: [],
            }
          : prev,
      );
      toast.success(binderMessages.toast.bulkBoxEmptied);
    } catch {
      toast.error(binderMessages.errors.bulkBoxSaveFailed);
    }
  };

  const handleAddGoal = async () => {
    if (!user || !binderId || !binder || isUpdatingGoals) return;

    const sanitizedText = goalText.trim().slice(0, GOAL_CHAR_LIMIT);
    if (!sanitizedText) return;

    const currentGoals = (binder.goals ?? []).filter((goal) => !goal.completed);
    const now = Date.now();
    const legacyDeletes = (binder.goals ?? [])
      .filter((goal) => goal.completed && typeof goal.completedAt === "string")
      .map((goal) => goal.completedAt as string);
    const currentDeleteTimestamps = getRecentGoalDeleteTimestamps(
      [...(binder.goalCooldowns ?? []), ...legacyDeletes],
      now,
    );
    if (currentGoals.length >= GOAL_LIMIT) {
      toast.error(
        goalInputDisabledReason ?? binderMessages.errors.goalLimitReached,
      );
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
      await updateBinderGoals(
        user.uid,
        binderId,
        nextGoals,
        currentDeleteTimestamps,
      );
      setBinder((prev) =>
        prev
          ? {
              ...prev,
              goals: nextGoals,
              goalCooldowns: currentDeleteTimestamps,
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

  const handleCompleteGoal = async (goalId: string): Promise<void> => {
    if (!user || !binderId || !binder || isUpdatingGoals) return;

    const currentGoals = (binder.goals ?? []).filter((goal) => !goal.completed);
    const goalToRemove = currentGoals.find((goal) => goal.id === goalId);
    if (!goalToRemove) return;

    const completionTimestamp = new Date().toISOString();
    const now = Date.now();
    const legacyDeletes = (binder.goals ?? [])
      .filter((goal) => goal.completed && typeof goal.completedAt === "string")
      .map((goal) => goal.completedAt as string);
    const nextGoals = currentGoals.filter((goal) => goal.id !== goalId);
    const nextDeleteTimestamps = getRecentGoalDeleteTimestamps(
      [...(binder.goalCooldowns ?? []), ...legacyDeletes],
      now,
    );
    if (nextDeleteTimestamps.length >= GOAL_DELETE_LIMIT) {
      toast.error(
        goalDeleteDisabledReason ??
          binderMessages.errors.goalDeleteLimitReached,
      );
      return;
    }
    const timestampsToSave = nextDeleteTimestamps.concat(completionTimestamp);

    setIsUpdatingGoals(true);
    try {
      await updateBinderGoals(user.uid, binderId, nextGoals, timestampsToSave);
      setBinder((prev) =>
        prev
          ? {
              ...prev,
              goals: nextGoals,
              goalCooldowns: timestampsToSave,
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
      editModeBaselineSignaturesRef.current = buildPageSignatures(
        pagesRef.current,
      );
      setHasEditSessionChanges(false);
      setIsEditMode(true);
      setIsActionMenuOpen(true);
      return;
    }

    let didSave = true;
    if (hasEditSessionChanges) {
      didSave = await handleSaveChanges(binderMessages.toast.editSaved);
    }
    if (!didSave) {
      setIsActionMenuOpen(true);
      return;
    }

    editModeBaselineSignaturesRef.current = null;
    setHasEditSessionChanges(false);
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

  const handleBulkBoxFromMenu = () => {
    setIsActionMenuOpen(false);
    setIsBulkBoxModalOpen(true);
  };

  const handleOpenAddCardsFromBulkBox = () => {
    setIsBulkBoxModalOpen(false);
    window.setTimeout(() => {
      setIsAddCardsModalOpen(true);
    }, 0);
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
      <div className="flex min-h-[calc(100vh-var(--header-h)-169px)] items-center justify-center">
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
        {isMobile ? (
          <div className="flex h-full items-start justify-center px-3 pt-2">
            <div className="w-full max-w-xl rounded-xl border border-zinc-300 bg-gray-50 p-4 shadow-lg dark:border-zinc-500 dark:bg-zinc-900/25">
              <h2 className="text-base font-exo font-semibold text-zinc-700 dark:text-slate-100">
                Mobile Mode
              </h2>
              <p className="mt-1 text-xs font-exo text-zinc-600 dark:text-zinc-300">
                Binders are hidden on mobile. You can add cards to Bulk Box in
                list view here, then move cards into binder slots on tablet or
                desktop.
              </p>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddCards}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-accent text-white shadow-lg transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-accent dark:bg-accent dark:text-white dark:hover:bg-accent/90">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add card</span>
                </button>
                <button
                  type="button"
                  onClick={handleBulkBoxFromMenu}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-slate-200 text-zinc-700 shadow-lg transition hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600">
                  <span className="absolute -right-1 -top-1 z-20 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-exo font-semibold leading-none text-white">
                    {bulkBoxCount}
                  </span>
                  <Box className="h-4 w-4" />
                  <span className="sr-only">Open Bulk Box</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {!isMobile && loading && (
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

        {!isMobile && !loading && (
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
                    !canAddGoal ||
                    isUpdatingGoals ||
                    goalText.trim().length === 0
                  }
                  goalInputDisabledReason={goalInputDisabledReason}
                  goalCompleteDisabled={!canDeleteGoal}
                  goalCompleteDisabledReason={goalDeleteDisabledReason}
                  activeGoalCount={activeGoalCount}
                  isUpdatingGoals={isUpdatingGoals}
                  onGoalTextChange={(value) =>
                    setGoalText(value.slice(0, GOAL_CHAR_LIMIT))
                  }
                  onAddGoal={() => void handleAddGoal()}
                  onCompleteGoal={handleCompleteGoal}
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

      {!isMobile && isEditMode ? (
        <div className="fixed right-6 top-[calc(var(--header-h)+2.5rem)] z-40">
          <button
            type="button"
            onClick={handleDeleteAllCardsFromVisiblePages}
            disabled={
              ![leftPage, rightPage]
                .filter((page): page is BinderPage => page !== null)
                .some((page) =>
                  (page.cardOrder ?? []).some((card) => card !== null),
                )
            }
            className="rounded-full border border-red-500 bg-red-500 px-4 py-1.5 text-xs font-exo font-semibold text-white shadow-lg transition hover:bg-red-600 disabled:cursor-not-allowed disabled:border-zinc-400 disabled:bg-zinc-400 dark:disabled:border-zinc-600 dark:disabled:bg-zinc-700">
            Delete all
          </button>
        </div>
      ) : null}

      {!isMobile ? (
        <SettingToggle
          isActionMenuOpen={isActionMenuOpen}
          isEditMode={isEditMode}
          hasEditSessionChanges={hasEditSessionChanges}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          bulkBoxCount={bulkBoxCount}
          onOpenAddCards={handleOpenAddCards}
          onOpenBulkBox={handleBulkBoxFromMenu}
          onSave={handleSaveFromMenu}
          onEdit={handleEditFromMenu}
          onOpenSettings={handleSettingsFromMenu}
          onToggleMenu={() => {
            if (isEditMode) {
              setIsActionMenuOpen(true);
              return;
            }
            setIsActionMenuOpen((open) => !open);
          }}
        />
      ) : null}

      <AddCardsModal
        open={isAddCardsModalOpen}
        onOpenChange={setIsAddCardsModalOpen}
        hideTrigger
        maxCardsInPile={binder ? layoutToSlots(binder.layout) : undefined}
        onAddCards={handleAddCards}
        onAddToBulkBox={handleAddToBulkBox}
        forcedLayoutMode={isMobile ? "list" : undefined}
        hideLayoutToggle={isMobile}
        showMobileBulkBoxCta={isMobile}
      />

      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle>{binderMessages.leaveModal.title}</DialogTitle>
            <DialogDescription>
              {binderMessages.leaveModal.description}
            </DialogDescription>
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

      <BulkBoxModal
        open={isBulkBoxModalOpen}
        onOpenChange={setIsBulkBoxModalOpen}
        onAddCards={handleOpenAddCardsFromBulkBox}
        cards={binder?.bulkBoxCards ?? []}
        capacity={bulkBoxLimit}
        gridColumns={layoutColumns}
        canAddToBinder={hasFreeBinderSlot}
        canMoveCardsToBinder={!isMobile}
        forcedLayoutMode={isMobile ? "list" : undefined}
        hideLayoutToggle={isMobile}
        onAddCardToBinder={(index) => void handleAddBulkBoxCardToBinder(index)}
        onEmptyBox={() => void handleEmptyBulkBox()}
      />

      <BinderSettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
        binderName={settingsName}
        onBinderNameChange={setSettingsName}
        showGoals={settingsShowGoals}
        onShowGoalsChange={setSettingsShowGoals}
        isSaving={isSavingSettings}
        onSave={() => void handleSaveSettings()}
      />
    </div>
  );
}
