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
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

type BinderDraft = {
  name: string;
  layout: string;
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

const layoutSlots: Record<BinderDraft["layout"], number> = {
  "2x2": 4,
  "3x3": 9,
  "4x4": 16,
};

async function createBinderDoc(userId: string, payload: BinderDraft) {
  const docRef = await addDoc(collection(db, "users", userId, "binders"), {
    ...payload,
    createdAt: serverTimestamp(),
  });

  const slots = layoutSlots[payload.layout] ?? 9;
  const pagesRef = collection(db, "users", userId, "binders", docRef.id, "pages");
  const pagePayload = (index: number) => ({
    index,
    slots,
    cardOrder: Array.from({ length: slots }, () => null),
    createdAt: serverTimestamp(),
  });

  await Promise.all([addDoc(pagesRef, pagePayload(1)), addDoc(pagesRef, pagePayload(2))]);

  return { id: docRef.id, ...payload };
}

async function fetchBindersForUser(userId: string) {
  const bindersQuery = query(
    collection(db, "users", userId, "binders"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(bindersQuery);

  return snapshot.docs.map((doc) => {
    const data = doc.data() as BinderDraft;
    return {
      id: doc.id,
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
    return { id: page.id, ...data };
  });
}

export type { BinderDraft, BinderItem };
export { createBinderDoc, fetchBindersForUser, fetchBinderById, fetchBinderPages };
