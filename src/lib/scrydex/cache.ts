import crypto from "crypto";
import { adminDb } from "@/lib/firebase/admin";

export type CardSearchPreview = {
  id: string;
  name: string;
  number?: string;
  rarity?: string;
  expansion?: { id?: string; name?: string };
  image?: { small?: string; large?: string };
};

export type SetSearchPreview = {
  id: string;
  name: string;
  series?: string;
  total?: number;
  releaseDate?: string;
  releaseYear?: number;
  logo?: string;
  symbol?: string;
};

export type SearchPreview = CardSearchPreview | SetSearchPreview;

type CacheDoc = {
  queryKey: string;
  q: string;
  createdAt: number;
  expiresAt: number;
  results: SearchPreview[];
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

export async function getCachedSearch<T extends SearchPreview = SearchPreview>(
  q: string,
): Promise<T[] | null> {
  const queryKey = makeQueryKey(q);
  const ref = adminDb.collection(COLLECTION).doc(queryKey);
  const snap = await ref.get();

  if (!snap.exists) return null;

  const data = snap.data() as CacheDoc;
  if (!data?.expiresAt || Date.now() > data.expiresAt) return null;

  return (data.results || []) as T[];
}

export async function setCachedSearch(
  q: string,
  results: SearchPreview[],
  ttlMs: number,
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
