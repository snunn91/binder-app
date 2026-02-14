"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

type BinderDraft = {
  name: string;
  layout: string; // "2x2" | "3x3" | "4x4"
  colorScheme: string;
};

type BinderItem = BinderDraft & {
  id: string;
};

type BinderCard = {
  id: string;
  name: string;
  number?: string;
  rarity?: string;
  expansion?: { id?: string; name?: string };
  image?: { small?: string; large?: string };
};

type BinderPage = {
  id: string;
  index: number;
  slots: number;
  cardOrder: (BinderCard | null)[];
};

/**
 * Converts binder layout to a slot count.
 * 2x2 => 4, 3x3 => 9, 4x4 => 16
 */
function layoutToSlots(layout: string) {
  if (layout === "2x2") return 4;
  if (layout === "4x4") return 16;
  return 9; // default to 3x3
}

async function createBinderDoc(userId: string, payload: BinderDraft) {
  const docRef = await addDoc(collection(db, "users", userId, "binders"), {
    ...payload,
    createdAt: serverTimestamp(),
  });

  const slots = layoutToSlots(payload.layout);

  const pagesRef = collection(
    db,
    "users",
    userId,
    "binders",
    docRef.id,
    "pages"
  );

  const pagePayload = (index: number) => ({
    index,
    slots,
    cardOrder: Array.from({ length: slots }, () => null),
    createdAt: serverTimestamp(),
  });

  // Create 3 starter pages (same as your current behavior)
  await Promise.all([
    addDoc(pagesRef, pagePayload(1)),
    addDoc(pagesRef, pagePayload(2)),
    addDoc(pagesRef, pagePayload(3)),
  ]);

  return { id: docRef.id, ...payload } as BinderItem;
}

async function fetchBindersForUser(userId: string) {
  const bindersQuery = query(
    collection(db, "users", userId, "binders"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(bindersQuery);

  return snapshot.docs.map((d) => {
    const data = d.data() as BinderDraft & { theme?: string };
    return {
      id: d.id,
      name: data.name,
      layout: data.layout,
      colorScheme: data.colorScheme ?? data.theme ?? "default",
    } as BinderItem;
  });
}

async function fetchBinderById(userId: string, binderId: string) {
  const binderRef = doc(db, "users", userId, "binders", binderId);
  const snapshot = await getDoc(binderRef);
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as BinderDraft & { theme?: string };
  return {
    id: snapshot.id,
    name: data.name,
    layout: data.layout,
    colorScheme: data.colorScheme ?? data.theme ?? "default",
  } as BinderItem;
}

async function fetchBinderPages(userId: string, binderId: string) {
  const pagesQuery = query(
    collection(db, "users", userId, "binders", binderId, "pages"),
    orderBy("index", "asc")
  );
  const snapshot = await getDocs(pagesQuery);

  return snapshot.docs.map((page) => {
    const data = page.data() as Omit<BinderPage, "id"> & {
      cardOrder?: unknown[];
    };
    return {
      id: page.id,
      index: data.index,
      slots: data.slots,
      cardOrder: normalizeCardOrder(data.cardOrder, data.slots),
    } as BinderPage;
  });
}

function normalizeCardOrder(
  input: unknown[] | undefined,
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
      return {
        id: String(candidate.id ?? ""),
        name: candidate.name ? String(candidate.name) : "Unknown card",
        number:
          candidate.number !== undefined ? String(candidate.number) : undefined,
        rarity:
          candidate.rarity !== undefined ? String(candidate.rarity) : undefined,
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
    return normalized.concat(Array.from({ length: slots - normalized.length }, () => null));
  }

  return normalized.slice(0, slots);
}

/**
 *
 * Expanding (e.g. 3x3 -> 4x4): appends nulls to cardOrder.
 * Shrinking (e.g. 4x4 -> 3x3): blocks if any cards exist in removed slots.
 *
 * Returns { layout, slots } on success.
 */
async function updateBinderLayout(
  userId: string,
  binderId: string,
  newLayout: string
) {
  const newSlots = layoutToSlots(newLayout);

  const pagesRef = collection(
    db,
    "users",
    userId,
    "binders",
    binderId,
    "pages"
  );
  const pagesQuery = query(pagesRef, orderBy("index", "asc"));
  const snapshot = await getDocs(pagesQuery);

  const pages = snapshot.docs.map((d) => {
    const data = d.data() as { slots?: number; cardOrder?: unknown[] };
    const slots = data.slots ?? data.cardOrder?.length ?? 0;
    const cardOrder = normalizeCardOrder(data.cardOrder, slots);
    return {
      ref: d.ref,
      id: d.id,
      slots,
      cardOrder,
    };
  });

  // If shrinking, ensure no cards exist in slots that would be removed
  for (const page of pages) {
    const oldOrder = page.cardOrder ?? [];
    if (newSlots < oldOrder.length) {
      const overflow = oldOrder.slice(newSlots);
      const hasCardsInOverflow = overflow.some((v) => v !== null);
      if (hasCardsInOverflow) {
        throw new Error(
          "Cannot reduce binder size because some cards are in slots that would be removed. Clear those slots first."
        );
      }
    }
  }

  const batch = writeBatch(db);

  // Update binder doc layout
  const binderRef = doc(db, "users", userId, "binders", binderId);
  batch.update(binderRef, { layout: newLayout });

  // Update all pages
  for (const page of pages) {
    const oldOrder = page.cardOrder ?? [];
    let nextOrder: (BinderCard | null)[] = [];

    if (newSlots > oldOrder.length) {
      nextOrder = oldOrder.concat(
        Array.from({ length: newSlots - oldOrder.length }, () => null)
      );
    } else {
      nextOrder = oldOrder.slice(0, newSlots);
    }

    batch.update(page.ref, {
      slots: newSlots,
      cardOrder: nextOrder,
    });
  }

  await batch.commit();

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

  const pagesRef = collection(
    db,
    "users",
    userId,
    "binders",
    binderId,
    "pages",
  );
  const pagesQuery = query(pagesRef, orderBy("index", "asc"));
  const snapshot = await getDocs(pagesQuery);

  const pageDocs = snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as { index: number; slots?: number; cardOrder?: unknown[] };
    const slots = data.slots ?? data.cardOrder?.length ?? 0;
    return {
      ref: docSnap.ref,
      id: docSnap.id,
      index: data.index,
      slots,
      cardOrder: normalizeCardOrder(data.cardOrder, slots),
    };
  });

  let cardIndex = 0;
  const changedPages = new Set<string>();

  for (const page of pageDocs) {
    for (let slotIndex = 0; slotIndex < page.cardOrder.length && cardIndex < cards.length; slotIndex += 1) {
      if (page.cardOrder[slotIndex] !== null) continue;
      page.cardOrder[slotIndex] = cards[cardIndex];
      cardIndex += 1;
      changedPages.add(page.id);
    }
    if (cardIndex >= cards.length) break;
  }

  if (changedPages.size > 0) {
    const batch = writeBatch(db);
    for (const page of pageDocs) {
      if (!changedPages.has(page.id)) continue;
      batch.update(page.ref, { cardOrder: page.cardOrder });
    }
    await batch.commit();
  }

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
  const pageRef = doc(db, "users", userId, "binders", binderId, "pages", pageId);
  await writeBatch(db).update(pageRef, { cardOrder }).commit();
}

async function updateBinderPageCardOrders(
  userId: string,
  binderId: string,
  updates: Array<{ pageId: string; cardOrder: (BinderCard | null)[] }>,
) {
  if (updates.length === 0) return;

  const batch = writeBatch(db);
  for (const update of updates) {
    const pageRef = doc(
      db,
      "users",
      userId,
      "binders",
      binderId,
      "pages",
      update.pageId,
    );
    batch.update(pageRef, { cardOrder: update.cardOrder });
  }
  await batch.commit();
}

export type { BinderDraft, BinderItem, BinderPage, BinderCard };
export {
  addCardsToBinder,
  createBinderDoc,
  fetchBindersForUser,
  fetchBinderById,
  fetchBinderPages,
  layoutToSlots,
  updateBinderPageCardOrder,
  updateBinderPageCardOrders,
  updateBinderLayout,
};
