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
  theme: string;
};

type BinderItem = BinderDraft & {
  id: string;
};

type BinderPage = {
  id: string;
  index: number;
  slots: number;
  cardOrder: (string | null)[];
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
    const data = d.data() as BinderDraft;
    return {
      id: d.id,
      name: data.name,
      layout: data.layout,
      theme: data.theme,
    } as BinderItem;
  });
}

async function fetchBinderById(userId: string, binderId: string) {
  const binderRef = doc(db, "users", userId, "binders", binderId);
  const snapshot = await getDoc(binderRef);
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as BinderDraft;
  return { id: snapshot.id, ...data } as BinderItem;
}

async function fetchBinderPages(userId: string, binderId: string) {
  const pagesQuery = query(
    collection(db, "users", userId, "binders", binderId, "pages"),
    orderBy("index", "asc")
  );
  const snapshot = await getDocs(pagesQuery);

  return snapshot.docs.map((page) => {
    const data = page.data() as Omit<BinderPage, "id">;
    return { id: page.id, ...data } as BinderPage;
  });
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
    const data = d.data() as { slots?: number; cardOrder?: (string | null)[] };
    return {
      ref: d.ref,
      id: d.id,
      slots: data.slots ?? data.cardOrder?.length ?? 0,
      cardOrder: data.cardOrder ?? [],
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
    let nextOrder: (string | null)[] = [];

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

export type { BinderDraft, BinderItem, BinderPage };
export {
  createBinderDoc,
  fetchBindersForUser,
  fetchBinderById,
  fetchBinderPages,
  updateBinderLayout,
};
