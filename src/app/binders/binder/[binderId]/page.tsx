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
import BinderActionToggle from "@/components/binder/BinderActionToggle";
import DeleteAllBinderPageCards from "@/components/binder/DeleteAllBinderPageCards";
import ErrorBanners from "@/components/binder/BinderErrorBanners";
import MobileBinderPanel from "@/components/binder/BinderMobilePanel";
import BinderSpreadContent from "@/components/binder/BinderSpreadContent";
import LeaveBinderDialog from "@/components/binder/BinderLeaveDialog";
import AddCardsModal from "@/modals/AddCardsModal";
import BulkBoxModal from "@/modals/BulkBoxModal";
import BinderSettingsModal from "@/modals/BinderSettingsModal";
import { binderMessages } from "@/config/binderMessages";
import type { CardPileEntry } from "@/components/binder/CardSelection/CardSelection";
import useIsMobile from "@/lib/hooks/useIsMobile";
import {
  type BinderPage,
  GOAL_CHAR_LIMIT,
  GOAL_DELETE_LIMIT,
  GOAL_LIMIT,
  addCardsToLocalPages,
  buildCardsToAddFromPile,
  buildPageSignatures,
  computeDirtyPageIds,
  getRecentGoalDeleteTimestamps,
} from "./binderPageUtils";

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
  const hasVisibleCards = [leftPage, rightPage]
    .filter((page): page is BinderPage => page !== null)
    .some((page) => (page.cardOrder ?? []).some((card) => card !== null));
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
      <ErrorBanners addCardsError={addCardsError} saveError={saveError} />
      <div className="flex-1 min-h-0 pt-2 pb-20">
        {isMobile ? (
          <MobileBinderPanel
            bulkBoxCount={bulkBoxCount}
            onOpenAddCards={handleOpenAddCards}
            onOpenBulkBox={handleBulkBoxFromMenu}
          />
        ) : (
          <BinderSpreadContent
            loading={loading}
            spreadIndex={spreadIndex}
            currentPageIndex={currentPageIndex}
            totalPageSpreads={totalPageSpreads}
            pagesSortedLength={pagesSorted.length}
            layoutColumns={layoutColumns}
            isTwoByTwoLayout={isTwoByTwoLayout}
            isFourByFourLayout={isFourByFourLayout}
            leftPage={leftPage}
            rightPage={rightPage}
            sensors={sensors}
            activeId={activeId}
            binderName={binder?.name}
            colorScheme={binder?.colorScheme}
            showGoals={binder?.showGoals}
            filledSlots={binderCapacity.filledSlots}
            totalSlots={binderCapacity.totalSlots}
            goals={goals}
            goalText={goalText}
            goalCharLimit={GOAL_CHAR_LIMIT}
            goalLimit={GOAL_LIMIT}
            goalInputDisabled={!canAddGoal || isUpdatingGoals}
            goalSubmitDisabled={
              !canAddGoal || isUpdatingGoals || goalText.trim().length === 0
            }
            goalInputDisabledReason={goalInputDisabledReason}
            goalCompleteDisabled={!canDeleteGoal}
            goalCompleteDisabledReason={goalDeleteDisabledReason}
            activeGoalCount={activeGoalCount}
            isUpdatingGoals={isUpdatingGoals}
            isEditMode={isEditMode}
            onPrevSpread={() => setSpreadIndex((prev) => Math.max(prev - 1, 0))}
            onNextSpread={() =>
              setSpreadIndex((prev) =>
                Math.min(prev + 1, pagesSorted.length > 1 ? 1 : 0),
              )
            }
            onGoalTextChange={(value) =>
              setGoalText(value.slice(0, GOAL_CHAR_LIMIT))
            }
            onAddGoal={() => void handleAddGoal()}
            onCompleteGoal={handleCompleteGoal}
            onAddCard={handleOpenAddCards}
            onDeleteCard={handleDeleteCardFromSlot}
            onToggleMissing={handleToggleMissingForSlot}
            onDragStart={handleDragStart}
            onDragEndForPage={handleDragEnd}
            onDragCancel={handleDragCancel}
          />
        )}
      </div>

      {!isMobile && isEditMode ? (
        <DeleteAllBinderPageCards
          onDeleteAll={handleDeleteAllCardsFromVisiblePages}
          disabled={!hasVisibleCards}
        />
      ) : null}

      {!isMobile ? (
        <BinderActionToggle
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
      <LeaveBinderDialog
        isOpen={isLeaveModalOpen}
        isSaving={isSaving}
        onOpenChange={setIsLeaveModalOpen}
        onStay={() => setIsLeaveModalOpen(false)}
        onSaveAndLeave={() => void saveAndContinueNavigation()}
        onDiscardAndLeave={continuePendingNavigation}
      />

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
