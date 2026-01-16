export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { scrydexFetch } from "@/lib/scrydex/client";
import {
  getCachedSearch,
  setCachedSearch,
  normalizeQuery,
} from "@/lib/scrydex/cache";

type CardSearchPreview = {
  id: string;
  name: string;
  number?: string;
  rarity?: string;
  expansion?: { id?: string; name?: string };
  image?: { small?: string; large?: string };
};

type ApiResponse = {
  results: CardSearchPreview[];
  cached: boolean;
  page: number;
  pageSize: number;
  totalCount?: number;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12h
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const SELECT_FIELDS = "id,name,number,rarity,expansion,images";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function getNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function getArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function extractImage(
  imagesUnknown: unknown
): { small?: string; large?: string } | undefined {
  const imgs = getArray(imagesUnknown).filter(isRecord);

  const front = imgs.find((img) => getString(img.type) === "front") ?? imgs[0];
  if (!front) return undefined;

  const small = getString(front.small);
  const large = getString(front.large);

  if (!small && !large) return undefined;

  return {
    ...(small ? { small } : {}),
    ...(large ? { large } : {}),
  };
}

function toPreview(cardUnknown: unknown): CardSearchPreview | null {
  if (!isRecord(cardUnknown)) return null;

  const id = getString(cardUnknown.id);
  const name = getString(cardUnknown.name);
  if (!id || !name) return null;

  // expansion
  let expansion: CardSearchPreview["expansion"] | undefined = undefined;
  const exp = cardUnknown.expansion;
  if (isRecord(exp)) {
    const expId = getString(exp.id);
    const expName = getString(exp.name);
    if (expId || expName) {
      expansion = {
        ...(expId ? { id: expId } : {}),
        ...(expName ? { name: expName } : {}),
      };
    }
  }

  const image = extractImage(cardUnknown.images);

  return {
    id,
    name,
    number: getString(cardUnknown.number),
    rarity: getString(cardUnknown.rarity),
    ...(expansion ? { expansion } : {}),
    ...(image ? { image } : {}),
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const qRaw = searchParams.get("q") ?? "";
    const q = normalizeQuery(qRaw);

    if (q.length < 2) {
      const empty: ApiResponse = {
        results: [],
        cached: false,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      };
      return NextResponse.json(empty);
    }

    const pageRaw = Number(searchParams.get("page") ?? "1");
    const page = clamp(Number.isFinite(pageRaw) ? pageRaw : 1, 1, 9999);

    const pageSizeRaw = Number(
      searchParams.get("page_size") ?? String(DEFAULT_PAGE_SIZE)
    );
    const pageSize = clamp(
      Number.isFinite(pageSizeRaw) ? pageSizeRaw : DEFAULT_PAGE_SIZE,
      1,
      MAX_PAGE_SIZE
    );

    const cacheKey = `${q}|page=${page}|page_size=${pageSize}`;
    const cached = await getCachedSearch(cacheKey);

    if (cached) {
      const out: ApiResponse = {
        results: cached,
        cached: true,
        page,
        pageSize,
      };
      return NextResponse.json(out);
    }

    // Good “normal search” behavior:
    // - This is still a prefix search. If you want broader matching, switch to:
    //   q: `name:${q}` or other query forms.
    const scrydexQuery = `name:${q}*`;

    const scrydexUnknown = await scrydexFetch<unknown>("/pokemon/v1/cards", {
      q: scrydexQuery,
      page: String(page),
      page_size: String(pageSize),
      select: SELECT_FIELDS,
    });

    let data: unknown[] = [];
    let totalCount: number | undefined = undefined;

    if (isRecord(scrydexUnknown)) {
      data = getArray(scrydexUnknown.data);
      totalCount = getNumber(scrydexUnknown.totalCount);
    }

    const results = data
      .map(toPreview)
      .filter((x): x is CardSearchPreview => x !== null);

    await setCachedSearch(cacheKey, results, CACHE_TTL_MS);

    const out: ApiResponse = {
      results,
      cached: false,
      page,
      pageSize,
      totalCount,
    };
    return NextResponse.json(out);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
