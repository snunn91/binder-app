import type { CardPileEntry } from "@/components/binder/CardSelection/CardSelection";
import type { BinderCard } from "@/lib/services/binderService";

export type BinderPage = {
  id: string;
  index: number;
  slots: number;
  cardOrder: (BinderCard | null)[];
};

export const GOAL_LIMIT = 5;
export const GOAL_CHAR_LIMIT = 150;
export const GOAL_DELETE_LIMIT = 10;
const GOAL_DELETE_WINDOW_MS = 24 * 60 * 60 * 1000;

function parseGoalTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return timestamp;
}

export function getRecentGoalDeleteTimestamps(
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

export function buildPageSignatures(pages: BinderPage[]) {
  const signatures: Record<string, string> = {};
  for (const page of pages) {
    signatures[page.id] = pageSignature(page.cardOrder ?? []);
  }
  return signatures;
}

export function computeDirtyPageIds(
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

export function buildCardsToAddFromPile(items: CardPileEntry[]): BinderCard[] {
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

export function addCardsToLocalPages(
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
