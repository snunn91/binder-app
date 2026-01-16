import crypto from "crypto";
import { adminDb } from "@/lib/firebase/admin";

export type CardSearchPreview = {
  id: string;
  name: string;
  number?: string;
  expansion?: { id?: string; name?: string };
  image?: { small?: string; large?: string };
  rarity?: string;
};

type CacheDoc = {
  queryKey: string;
  q: string;
  createdAt: number;
  expiresAt: number;
  results: CardSearchPreview[];
};

const COLLECTION = "scrydexSearchCache";

// Normalize so "Pikachu", " pikachu ", "PIKACHU" hit the same cache key.
export function normalizeQuery(q: string) {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

export function makeQueryKey(q: string) {
  const norm = normalizeQuery(q);
  return crypto.createHash("sha256").update(norm).digest("hex").slice(0, 32);
}

export async function getCachedSearch(
  q: string
): Promise<CardSearchPreview[] | null> {
  const queryKey = makeQueryKey(q);
  const ref = adminDb.collection(COLLECTION).doc(queryKey);
  const snap = await ref.get();

  if (!snap.exists) return null;

  const data = snap.data() as CacheDoc;
  if (!data?.expiresAt || Date.now() > data.expiresAt) return null;

  return data.results || [];
}

export async function setCachedSearch(
  q: string,
  results: CardSearchPreview[],
  ttlMs: number
) {
  const queryKey = makeQueryKey(q);
  const ref = adminDb.collection(COLLECTION).doc(queryKey);

  const now = Date.now();
  const doc: CacheDoc = {
    queryKey,
    q: normalizeQuery(q),
    createdAt: now,
    expiresAt: now + ttlMs,
    results,
  };

  await ref.set(doc, { merge: true });
}
