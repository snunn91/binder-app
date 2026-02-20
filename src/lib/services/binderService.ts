"use client";

import {
  BINDER_LIMIT_REACHED_MESSAGE,
  MAX_BINDERS,
} from "@/config/binderLimits";
import { supabase } from "@/lib/supabase/client";

type BinderGoal = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string | null;
};

type BinderDraft = {
  name: string;
  layout: string;
  colorScheme: string;
  goals?: BinderGoal[];
  goalCooldowns?: string[];
  bulkBoxCards?: BinderCard[];
  showGoals?: boolean;
};

type BinderItem = BinderDraft & {
  id: string;
  createdAt?: string | null;
  filledCards?: number;
  totalSlots?: number;
};

type BinderCard = {
  id: string;
  name: string;
  number?: string;
  rarity?: string;
  collectionStatus?: "collected" | "missing";
  expansion?: { id?: string; name?: string };
  image?: { small?: string; large?: string };
};

type BinderPage = {
  id: string;
  index: number;
  slots: number;
  cardOrder: (BinderCard | null)[];
};

type BinderRow = {
  id: string;
  user_id: string;
  name: string;
  layout: string;
  color_scheme: string;
  goals: unknown;
  goal_cooldowns: unknown;
  bulk_box_cards: unknown;
  show_goals: boolean;
  created_at: string | null;
};

type BinderPageRow = {
  id: string;
  binder_id: string;
  page_index: number;
  slots: number;
  card_order: unknown;
};

function normalizeGoalTimestamp(value: unknown) {
  if (typeof value !== "string") return new Date().toISOString();
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return new Date().toISOString();
  return new Date(timestamp).toISOString();
}

function normalizeGoalCompletionTimestamp(value: unknown) {
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

function normalizeGoalCooldowns(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((value) => normalizeGoalCompletionTimestamp(value))
    .filter((value): value is string => value !== null);
}

function normalizeBulkBoxCards(input: unknown, maxCards: number = 16): BinderCard[] {
  return normalizeCardOrder(input, maxCards).filter(
    (card): card is BinderCard => card !== null,
  );
}

function normalizeGoals(input: unknown): BinderGoal[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((goal, index) => {
      if (!goal || typeof goal !== "object") return null;
      const candidate = goal as Partial<BinderGoal>;
      const rawText = candidate.text ? String(candidate.text).trim() : "";
      if (!rawText) return null;

      const completed = candidate.completed === true;

      return {
        id: candidate.id ? String(candidate.id) : `goal-${index}`,
        text: rawText.slice(0, 150),
        completed,
        createdAt: normalizeGoalTimestamp(candidate.createdAt),
        completedAt: completed
          ? normalizeGoalCompletionTimestamp(candidate.completedAt)
          : null,
      } as BinderGoal;
    })
    .filter((goal): goal is BinderGoal => goal !== null);
}

function normalizeCollectionStatus(
  status: BinderCard["collectionStatus"],
): "collected" | "missing" {
  return status === "missing" ? "missing" : "collected";
}

function normalizeWritableCardOrder(cardOrder: (BinderCard | null)[]) {
  return cardOrder.map((card) =>
    card
      ? {
          ...card,
          collectionStatus: normalizeCollectionStatus(card.collectionStatus),
        }
      : null,
  );
}

function layoutToSlots(layout: string) {
  if (layout === "2x2") return 4;
  if (layout === "4x4") return 16;
  return 9;
}

function normalizeColorScheme(colorScheme: string | undefined) {
  if (colorScheme === "red") return "red";
  if (colorScheme === "blue") return "blue";
  if (colorScheme === "green") return "green";
  if (colorScheme === "yellow") return "yellow";
  return "default";
}

function normalizeShowGoals(value: unknown) {
  return value !== false;
}

function normalizeBinderCreatedAt(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

function normalizeCardOrder(
  input: unknown,
  slots: number,
): (BinderCard | null)[] {
  const list = Array.isArray(input) ? input : [];
  const normalized = list.map((entry) => {
    if (!entry) return null;

    if (typeof entry === "string") {
      return {
        id: entry,
        name: "Unknown card",
      } as BinderCard;
    }

    if (typeof entry === "object" && entry !== null && "id" in entry) {
      const candidate = entry as Partial<BinderCard>;
      const candidateWithLegacy = candidate as Partial<BinderCard> & {
        missing?: boolean;
      };
      const collectionStatus =
        candidate.collectionStatus === "missing"
          ? "missing"
          : candidate.collectionStatus === "collected"
            ? "collected"
            : candidateWithLegacy.missing
              ? "missing"
              : "collected";

      return {
        id: String(candidate.id ?? ""),
        name: candidate.name ? String(candidate.name) : "Unknown card",
        number:
          candidate.number !== undefined ? String(candidate.number) : undefined,
        rarity:
          candidate.rarity !== undefined ? String(candidate.rarity) : undefined,
        collectionStatus,
        expansion:
          candidate.expansion && typeof candidate.expansion === "object"
            ? {
                id:
                  candidate.expansion.id !== undefined
                    ? String(candidate.expansion.id)
                    : undefined,
                name:
                  candidate.expansion.name !== undefined
                    ? String(candidate.expansion.name)
                    : undefined,
              }
            : undefined,
        image:
          candidate.image && typeof candidate.image === "object"
            ? {
                small:
                  candidate.image.small !== undefined
                    ? String(candidate.image.small)
                    : undefined,
                large:
                  candidate.image.large !== undefined
                    ? String(candidate.image.large)
                    : undefined,
              }
            : undefined,
      } as BinderCard;
    }

    return null;
  });

  if (normalized.length < slots) {
    return normalized.concat(
      Array.from({ length: slots - normalized.length }, () => null),
    );
  }

  return normalized.slice(0, slots);
}

function assertSupabase(resultError: { message: string } | null, action: string) {
  if (!resultError) return;
  throw new Error(`${action}: ${resultError.message}`);
}

async function createBinderDoc(userId: string, payload: BinderDraft) {
  const { count, error: countError } = await supabase
    .from("binders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  assertSupabase(countError, "Failed to check binder limit");

  if ((count ?? 0) >= MAX_BINDERS) {
    throw new Error(BINDER_LIMIT_REACHED_MESSAGE);
  }

  const normalizedColorScheme = normalizeColorScheme(payload.colorScheme);

  const { data: binderRow, error: binderError } = await supabase
    .from("binders")
    .insert({
      user_id: userId,
      name: payload.name,
      layout: payload.layout,
      color_scheme: normalizedColorScheme,
      goals: [],
      goal_cooldowns: [],
      bulk_box_cards: [],
      show_goals: true,
    })
    .select("id, created_at")
    .single();

  assertSupabase(binderError, "Failed to create binder");
  if (!binderRow) {
    throw new Error("Failed to create binder: no binder row returned.");
  }

  const slots = layoutToSlots(payload.layout);

  const starterPages = [1, 2, 3].map((index) => ({
    user_id: userId,
    binder_id: binderRow.id,
    page_index: index,
    slots,
    card_order: Array.from({ length: slots }, () => null),
  }));

  const { error: pagesError } = await supabase
    .from("binder_pages")
    .insert(starterPages);

  assertSupabase(pagesError, "Failed to create starter pages");

  return {
    id: binderRow.id,
    ...payload,
    colorScheme: normalizedColorScheme,
    goals: [],
    goalCooldowns: [],
    bulkBoxCards: [],
    showGoals: true,
    createdAt: normalizeBinderCreatedAt(binderRow.created_at),
    filledCards: 0,
    totalSlots: slots * 3,
  } as BinderItem;
}

async function fetchBindersForUser(userId: string) {
  const { data: binderRows, error: bindersError } = await supabase
    .from("binders")
    .select(
      "id, user_id, name, layout, color_scheme, goals, goal_cooldowns, bulk_box_cards, show_goals, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  assertSupabase(bindersError, "Failed to fetch binders");

  const binders = (binderRows ?? []) as BinderRow[];
  if (binders.length === 0) return [] as BinderItem[];

  const binderIds = binders.map((binder) => binder.id);
  const { data: pageRows, error: pagesError } = await supabase
    .from("binder_pages")
    .select("id, binder_id, page_index, slots, card_order")
    .eq("user_id", userId)
    .in("binder_id", binderIds);

  assertSupabase(pagesError, "Failed to fetch binder pages");

  const pagesByBinder = new Map<string, BinderPageRow[]>();
  for (const page of (pageRows ?? []) as BinderPageRow[]) {
    const list = pagesByBinder.get(page.binder_id) ?? [];
    list.push(page);
    pagesByBinder.set(page.binder_id, list);
  }

  return binders.map((binder) => {
    const pages = pagesByBinder.get(binder.id) ?? [];
    const capacity = pages.reduce(
      (acc, page) => {
        const slots = page.slots;
        const cardOrder = normalizeCardOrder(page.card_order, slots);
        const filledCards = cardOrder.filter(
          (card): card is BinderCard => card !== null,
        ).length;

        return {
          totalSlots: acc.totalSlots + slots,
          filledCards: acc.filledCards + filledCards,
        };
      },
      { totalSlots: 0, filledCards: 0 },
    );

    return {
      id: binder.id,
      name: binder.name,
      layout: binder.layout,
      colorScheme: normalizeColorScheme(binder.color_scheme),
      createdAt: normalizeBinderCreatedAt(binder.created_at),
      filledCards: capacity.filledCards,
      totalSlots: capacity.totalSlots,
    } as BinderItem;
  });
}

async function fetchBinderById(userId: string, binderId: string) {
  const { data, error } = await supabase
    .from("binders")
    .select(
      "id, user_id, name, layout, color_scheme, goals, goal_cooldowns, bulk_box_cards, show_goals, created_at",
    )
    .eq("user_id", userId)
    .eq("id", binderId)
    .maybeSingle();

  assertSupabase(error, "Failed to fetch binder");
  if (!data) return null;

  const row = data as BinderRow;

  return {
    id: row.id,
    name: row.name,
    layout: row.layout,
    colorScheme: normalizeColorScheme(row.color_scheme),
    goals: normalizeGoals(row.goals),
    goalCooldowns: normalizeGoalCooldowns(row.goal_cooldowns),
    bulkBoxCards: normalizeBulkBoxCards(row.bulk_box_cards),
    showGoals: normalizeShowGoals(row.show_goals),
  } as BinderItem;
}

async function fetchBinderPages(userId: string, binderId: string) {
  const { data, error } = await supabase
    .from("binder_pages")
    .select("id, binder_id, page_index, slots, card_order")
    .eq("user_id", userId)
    .eq("binder_id", binderId)
    .order("page_index", { ascending: true });

  assertSupabase(error, "Failed to fetch binder pages");

  return ((data ?? []) as BinderPageRow[]).map((page) => ({
    id: page.id,
    index: page.page_index,
    slots: page.slots,
    cardOrder: normalizeCardOrder(page.card_order, page.slots),
  })) as BinderPage[];
}

async function updateBinderLayout(userId: string, binderId: string, newLayout: string) {
  const newSlots = layoutToSlots(newLayout);

  const { data, error } = await supabase
    .from("binder_pages")
    .select("id, binder_id, page_index, slots, card_order")
    .eq("user_id", userId)
    .eq("binder_id", binderId)
    .order("page_index", { ascending: true });

  assertSupabase(error, "Failed to load pages for layout update");

  const pages = ((data ?? []) as BinderPageRow[]).map((page) => ({
    id: page.id,
    slots: page.slots,
    cardOrder: normalizeCardOrder(page.card_order, page.slots),
  }));

  for (const page of pages) {
    if (newSlots < page.cardOrder.length) {
      const overflow = page.cardOrder.slice(newSlots);
      if (overflow.some((value) => value !== null)) {
        throw new Error(
          "Cannot reduce binder size because some cards are in slots that would be removed. Clear those slots first.",
        );
      }
    }
  }

  const { error: binderUpdateError } = await supabase
    .from("binders")
    .update({ layout: newLayout })
    .eq("user_id", userId)
    .eq("id", binderId);

  assertSupabase(binderUpdateError, "Failed to update binder layout");

  await Promise.all(
    pages.map(async (page) => {
      const oldOrder = page.cardOrder;
      const nextOrder =
        newSlots > oldOrder.length
          ? oldOrder.concat(Array.from({ length: newSlots - oldOrder.length }, () => null))
          : oldOrder.slice(0, newSlots);

      const { error: updateError } = await supabase
        .from("binder_pages")
        .update({
          slots: newSlots,
          card_order: normalizeWritableCardOrder(nextOrder),
        })
        .eq("id", page.id)
        .eq("binder_id", binderId)
        .eq("user_id", userId);

      assertSupabase(updateError, "Failed to update binder page layout");
    }),
  );

  return { layout: newLayout, slots: newSlots };
}

async function addCardsToBinder(
  userId: string,
  binderId: string,
  cards: BinderCard[],
) {
  if (cards.length === 0) {
    return { addedCount: 0, remainingCount: 0, pages: [] as BinderPage[] };
  }

  const { data, error } = await supabase
    .from("binder_pages")
    .select("id, binder_id, page_index, slots, card_order")
    .eq("user_id", userId)
    .eq("binder_id", binderId)
    .order("page_index", { ascending: true });

  assertSupabase(error, "Failed to fetch pages for card insertion");

  const pageDocs = ((data ?? []) as BinderPageRow[]).map((page) => ({
    id: page.id,
    index: page.page_index,
    slots: page.slots,
    cardOrder: normalizeCardOrder(page.card_order, page.slots),
  }));

  const cardsToInsert = cards.map((card) => ({
    ...card,
    collectionStatus: normalizeCollectionStatus(card.collectionStatus),
  }));

  let cardIndex = 0;
  const changedPages = new Set<string>();

  for (const page of pageDocs) {
    for (
      let slotIndex = 0;
      slotIndex < page.cardOrder.length && cardIndex < cardsToInsert.length;
      slotIndex += 1
    ) {
      if (page.cardOrder[slotIndex] !== null) continue;
      page.cardOrder[slotIndex] = cardsToInsert[cardIndex];
      cardIndex += 1;
      changedPages.add(page.id);
    }
    if (cardIndex >= cardsToInsert.length) break;
  }

  await Promise.all(
    pageDocs
      .filter((page) => changedPages.has(page.id))
      .map(async (page) => {
        const { error: updateError } = await supabase
          .from("binder_pages")
          .update({ card_order: normalizeWritableCardOrder(page.cardOrder) })
          .eq("id", page.id)
          .eq("binder_id", binderId)
          .eq("user_id", userId);

        assertSupabase(updateError, "Failed to write updated card order");
      }),
  );

  const pages = pageDocs.map((page) => ({
    id: page.id,
    index: page.index,
    slots: page.slots,
    cardOrder: page.cardOrder,
  }));

  return {
    addedCount: cardIndex,
    remainingCount: cards.length - cardIndex,
    pages,
  };
}

async function updateBinderPageCardOrder(
  userId: string,
  binderId: string,
  pageId: string,
  cardOrder: (BinderCard | null)[],
) {
  const { error } = await supabase
    .from("binder_pages")
    .update({ card_order: normalizeWritableCardOrder(cardOrder) })
    .eq("id", pageId)
    .eq("binder_id", binderId)
    .eq("user_id", userId);

  assertSupabase(error, "Failed to update binder page");
}

async function updateBinderPageCardOrders(
  userId: string,
  binderId: string,
  updates: Array<{ pageId: string; cardOrder: (BinderCard | null)[] }>,
) {
  if (updates.length === 0) return;

  await Promise.all(
    updates.map(async (update) => {
      const { error } = await supabase
        .from("binder_pages")
        .update({ card_order: normalizeWritableCardOrder(update.cardOrder) })
        .eq("id", update.pageId)
        .eq("binder_id", binderId)
        .eq("user_id", userId);

      assertSupabase(error, "Failed to update binder pages");
    }),
  );
}

async function updateBinderGoals(
  userId: string,
  binderId: string,
  goals: BinderGoal[],
  goalCooldowns: string[],
) {
  const { error } = await supabase
    .from("binders")
    .update({
      goals: normalizeGoals(goals),
      goal_cooldowns: normalizeGoalCooldowns(goalCooldowns),
      goals_updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", binderId);

  assertSupabase(error, "Failed to update binder goals");
}

async function updateBinderSettings(
  userId: string,
  binderId: string,
  settings: {
    name?: string;
    showGoals?: boolean;
  },
) {
  const updates: { name?: string; show_goals?: boolean } = {};

  if (typeof settings.name === "string") {
    updates.name = settings.name.trim();
  }
  if (typeof settings.showGoals === "boolean") {
    updates.show_goals = settings.showGoals;
  }

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase
    .from("binders")
    .update(updates)
    .eq("user_id", userId)
    .eq("id", binderId);

  assertSupabase(error, "Failed to update binder settings");
}

async function updateBinderBulkBoxCards(
  userId: string,
  binderId: string,
  bulkBoxCards: BinderCard[],
  maxCards: number = 16,
) {
  const nextCards = bulkBoxCards.slice(0, maxCards).map((card) => ({
    ...card,
    collectionStatus: normalizeCollectionStatus(card.collectionStatus),
  }));

  const { error } = await supabase
    .from("binders")
    .update({
      bulk_box_cards: nextCards,
    })
    .eq("user_id", userId)
    .eq("id", binderId);

  assertSupabase(error, "Failed to update bulk box cards");
}

export type { BinderDraft, BinderItem, BinderPage, BinderCard, BinderGoal };
export {
  addCardsToBinder,
  createBinderDoc,
  fetchBindersForUser,
  fetchBinderById,
  updateBinderGoals,
  fetchBinderPages,
  layoutToSlots,
  updateBinderPageCardOrder,
  updateBinderPageCardOrders,
  updateBinderLayout,
  updateBinderSettings,
  updateBinderBulkBoxCards,
};
