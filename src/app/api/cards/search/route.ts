export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { scrydexFetch } from "@/lib/scrydex/client";
import {
  getCachedSearch,
  setCachedSearch,
  normalizeQuery,
  type CardSearchPreview,
  type SetSearchPreview,
  type SearchPreview,
} from "@/lib/scrydex/cache";

type ApiResponse = {
  results: SearchPreview[];
  cached: boolean;
  page: number;
  pageSize: number;
  totalCount?: number;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12h

const DEFAULT_PAGE_SIZE = 25; // cards default
const DEFAULT_SET_PAGE_SIZE = 12; // sets default
const MAX_PAGE_SIZE = 50;

const SELECT_CARD_FIELDS = "id,name,number,rarity,expansion,images";
const SELECT_SET_FIELDS = "id,name,release_date,logo,symbol";

const EN_BASE = "/pokemon/v1/en";
const EN_CARDS_ENDPOINT = `${EN_BASE}/cards`;
const EN_EXPANSIONS_ENDPOINT = `${EN_BASE}/expansions`;

const TCG_ONLY_SETS_Q = "is_online_only:false";

const CACHE_VERSION = "v6";

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
  imagesUnknown: unknown,
): { small?: string; large?: string } | undefined {
  const imgs = getArray(imagesUnknown).filter(isRecord);
  const front = imgs.find((img) => getString(img.type) === "front") ?? imgs[0];
  if (!front) return undefined;

  const small = getString(front.small);
  const large = getString(front.large);
  if (!small && !large) return undefined;

  return { ...(small ? { small } : {}), ...(large ? { large } : {}) };
}

function isOnlineOnlyCard(cardUnknown: unknown): boolean {
  if (!isRecord(cardUnknown)) return false;
  const expansion = cardUnknown.expansion;
  if (!isRecord(expansion)) return false;
  return expansion.is_online_only === true;
}

function toCardPreview(cardUnknown: unknown): CardSearchPreview | null {
  if (!isRecord(cardUnknown)) return null;

  const id = getString(cardUnknown.id);
  const name = getString(cardUnknown.name);
  if (!id || !name) return null;

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

function toSetPreview(setUnknown: unknown): SetSearchPreview | null {
  if (!isRecord(setUnknown)) return null;

  const id = getString(setUnknown.id);
  const name = getString(setUnknown.name);
  if (!id || !name) return null;

  const releaseDate = getString(setUnknown.release_date);
  const releaseYear = releaseDate ? Number(releaseDate.slice(0, 4)) : undefined;

  const logo = getString(setUnknown.logo);
  const symbol = getString(setUnknown.symbol);

  return {
    id,
    name,
    ...(releaseDate ? { releaseDate } : {}),
    ...(releaseYear ? { releaseYear } : {}),
    ...(logo ? { logo } : {}),
    ...(symbol ? { symbol } : {}),
  };
}

function buildQuery(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

async function fetchSets(params: {
  q?: string;
  page: number;
  pageSize: number;
  mode?: string | null;
}) {
  const { q, page, pageSize, mode } = params;

  if (mode === "recent") {
    return await scrydexFetch<unknown>(EN_EXPANSIONS_ENDPOINT, {
      page: String(page),
      page_size: String(pageSize),
      orderBy: "-release_date",
      select: SELECT_SET_FIELDS,
      q: TCG_ONLY_SETS_Q,
    });
  }

  return await scrydexFetch<unknown>(EN_EXPANSIONS_ENDPOINT, {
    page: String(page),
    page_size: String(pageSize),
    select: SELECT_SET_FIELDS,
    ...(q ? { q } : {}),
  });
}

async function fetchCards(params: {
  q?: string;
  page: number;
  pageSize: number;
  mode?: string | null;
  setId?: string | null;
}) {
  const { q, page, pageSize, mode, setId } = params;

  const endpoint = setId
    ? `${EN_EXPANSIONS_ENDPOINT}/${setId}/cards`
    : EN_CARDS_ENDPOINT;

  if (mode === "recent") {
    // Prefer “newest-ish”: expansion release date then card sort order
    try {
      return await scrydexFetch<unknown>(endpoint, {
        page: String(page),
        page_size: String(pageSize),
        orderBy: "-expansion.release_date,-expansion_sort_order",
        select: SELECT_CARD_FIELDS,
        ...(q ? { q } : {}),
      });
    } catch {
      return await scrydexFetch<unknown>(endpoint, {
        page: String(page),
        page_size: String(pageSize),
        select: SELECT_CARD_FIELDS,
        ...(q ? { q } : {}),
      });
    }
  }

  return await scrydexFetch<unknown>(endpoint, {
    page: String(page),
    page_size: String(pageSize),
    select: SELECT_CARD_FIELDS,
    ...(q ? { q } : {}),
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type") === "sets" ? "sets" : "cards";
    const mode = searchParams.get("mode"); // "recent" | null
    const setId = searchParams.get("set");

    const qRaw = searchParams.get("q") ?? "";
    const qNorm = normalizeQuery(qRaw);

    const pageRaw = Number(searchParams.get("page") ?? "1");
    const page = clamp(Number.isFinite(pageRaw) ? pageRaw : 1, 1, 9999);

    const defaultPageSize =
      type === "sets" ? DEFAULT_SET_PAGE_SIZE : DEFAULT_PAGE_SIZE;

    const pageSizeRaw = Number(
      searchParams.get("page_size") ?? String(defaultPageSize),
    );
    const pageSize = clamp(
      Number.isFinite(pageSizeRaw) ? pageSizeRaw : defaultPageSize,
      1,
      MAX_PAGE_SIZE,
    );

    // In sets mode, the UI uses mode=recent for defaults.
    if (qNorm.length < 2 && mode !== "recent") {
      const empty: ApiResponse = {
        results: [],
        cached: false,
        page: 1,
        pageSize,
      };
      return NextResponse.json(empty);
    }

    // Cache key includes: type, mode, query, set scope
    const cacheKeyBase =
      type === "sets"
        ? mode === "recent"
          ? `sets|recent|lang=en|tcg=1|${CACHE_VERSION}`
          : `sets|q=${qNorm}|lang=en|tcg=1|${CACHE_VERSION}`
        : setId
          ? mode === "recent"
            ? `cards|recent|set=${setId}|lang=en|tcg=1|${CACHE_VERSION}`
            : `cards|q=${qNorm}|set=${setId}|lang=en|tcg=1|${CACHE_VERSION}`
          : mode === "recent"
            ? `cards|recent|lang=en|tcg=1|${CACHE_VERSION}`
            : `cards|q=${qNorm}|lang=en|tcg=1|${CACHE_VERSION}`;

    const cacheKey = `${cacheKeyBase}|page=${page}|page_size=${pageSize}`;

    const cached = await getCachedSearch(cacheKey);
    if (cached && cached.length > 0) {
      const out: ApiResponse = {
        results: cached,
        cached: true,
        page,
        pageSize,
      };
      return NextResponse.json(out);
    }

    let scrydexUnknown: unknown;

    if (type === "sets") {
      if (mode === "recent") {
        scrydexUnknown = await fetchSets({ page, pageSize, mode });
      } else {
        const namePrefix = qNorm.length >= 2 ? `name:${qNorm}*` : undefined;
        const setsQuery = buildQuery([TCG_ONLY_SETS_Q, namePrefix]);
        scrydexUnknown = await fetchSets({ q: setsQuery, page, pageSize });
      }

      let data: unknown[] = [];
      let totalCount: number | undefined;

      if (isRecord(scrydexUnknown)) {
        data = getArray(scrydexUnknown.data);
        totalCount = getNumber(scrydexUnknown.totalCount);
      }

      const results = data
        .map(toSetPreview)
        .filter((x): x is SetSearchPreview => x !== null);

      await setCachedSearch(cacheKey, results, CACHE_TTL_MS);

      const out: ApiResponse = {
        results,
        cached: false,
        page,
        pageSize,
        totalCount,
      };
      return NextResponse.json(out);
    }

    // cards
    if (mode === "recent") {
      // For recent, no q filter; pocket filtered locally
      scrydexUnknown = await fetchCards({ page, pageSize, mode, setId });
    } else {
      const namePrefix = qNorm.length >= 2 ? `name:${qNorm}*` : undefined;
      scrydexUnknown = await fetchCards({
        q: namePrefix,
        page,
        pageSize,
        mode: null,
        setId,
      });
    }

    let data: unknown[] = [];
    let totalCount: number | undefined;

    if (isRecord(scrydexUnknown)) {
      data = getArray(scrydexUnknown.data);
      totalCount = getNumber(scrydexUnknown.totalCount);
    }

    const results = data
      .filter((c) => !isOnlineOnlyCard(c))
      .map(toCardPreview)
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
