export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { clamp } from "@/app/api/cards/search/searchUtils";
import {
  DEFAULT_PAGE_SIZE,
  fetchCards,
  parseCards,
} from "@/app/api/cards/search/cardSearch";
import {
  buildSetsQuery,
  DEFAULT_SET_PAGE_SIZE,
  fetchSets,
  parseSets,
} from "@/app/api/cards/search/setSearch";
import { sanitizeRarityFilters } from "@/lib/scrydex/rarity";
import { sanitizeTypeFilters } from "@/lib/scrydex/type";
import {
  sanitizeCardSort,
  sanitizeSetSort,
  type CardSortOption,
} from "@/lib/scrydex/sort";
import { assertScrydexEnabled, getCardSource } from "@/lib/catalog/sourceGate";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14d
const MAX_PAGE_SIZE = 50;
const CACHE_VERSION = "v7";

type CardSearchPreview = {
  id: string;
  name: string;
  number?: string;
  rarity?: string;
  expansion?: { id?: string; name?: string };
  image?: { small?: string; large?: string };
};

type SetSearchPreview = {
  id: string;
  name: string;
  series?: string;
  total?: number;
  releaseDate?: string;
  releaseYear?: number;
  logo?: string;
  symbol?: string;
};

type SearchPreview = CardSearchPreview | SetSearchPreview;

type ApiResponse = {
  results: SearchPreview[];
  cached: boolean;
  page: number;
  pageSize: number;
  totalCount?: number;
};

type DbCardRow = {
  id: string;
  name: string;
  number: string | null;
  rarity: string | null;
  expansion_id: string | null;
  expansion_name: string | null;
  image_small: string | null;
  image_large: string | null;
};

type CardQueryOrderable = {
  order: (
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean },
  ) => CardQueryOrderable;
};

function normalizeQuery(q: string) {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

function applyCardSort(query: CardQueryOrderable, sort: CardSortOption) {
  if (sort === "Oldest") {
    return query
      .order("expansion_release_date", { ascending: true, nullsFirst: false })
      .order("expansion_sort_order", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true });
  }

  if (sort === "Name A-Z") {
    return query.order("name", { ascending: true }).order("id", { ascending: true });
  }

  if (sort === "Name Z-A") {
    return query.order("name", { ascending: false }).order("id", { ascending: true });
  }

  if (sort === "Number ASC") {
    return query
      .order("number", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true });
  }

  if (sort === "Number DESC") {
    return query
      .order("number", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true });
  }

  return query
    .order("expansion_release_date", { ascending: false, nullsFirst: false })
    .order("expansion_sort_order", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true });
}

async function searchCardsFromDb(params: {
  qNorm: string;
  mode: string | null;
  setId: string | null;
  rarityFilters: string[];
  typeFilters: string[];
  cardSort: CardSortOption;
  page: number;
  pageSize: number;
}) {
  const {
    qNorm,
    mode,
    setId,
    rarityFilters,
    typeFilters,
    cardSort,
    page,
    pageSize,
  } = params;

  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("cards")
    .select(
      "id, name, number, rarity, expansion_id, expansion_name, image_small, image_large",
      { count: "exact" },
    );

  if (mode !== "recent" && qNorm.length >= 2) {
    query = query.ilike("name", `%${qNorm}%`);
  }

  if (setId) {
    query = query.eq("expansion_id", setId);
  }

  if (rarityFilters.length > 0) {
    query = query.in("rarity", rarityFilters);
  }

  if (typeFilters.length > 0) {
    query = query.overlaps("types", typeFilters);
  }

  query = applyCardSort(query, cardSort);

  const rangeStart = (page - 1) * pageSize;
  const rangeEnd = rangeStart + pageSize - 1;

  const { data, count, error } = await query.range(rangeStart, rangeEnd);

  if (error) {
    throw new Error(`DB search failed: ${error.message}`);
  }

  const rows = (data ?? []) as DbCardRow[];
  const results: CardSearchPreview[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    ...(row.number ? { number: row.number } : {}),
    ...(row.rarity ? { rarity: row.rarity } : {}),
    ...(row.expansion_id || row.expansion_name
      ? {
          expansion: {
            ...(row.expansion_id ? { id: row.expansion_id } : {}),
            ...(row.expansion_name ? { name: row.expansion_name } : {}),
          },
        }
      : {}),
    ...(row.image_small || row.image_large
      ? {
          image: {
            ...(row.image_small ? { small: row.image_small } : {}),
            ...(row.image_large ? { large: row.image_large } : {}),
          },
        }
      : {}),
  }));

  return {
    results,
    totalCount: count ?? undefined,
  };
}

async function handleApiMode(params: {
  type: "cards" | "sets";
  mode: string | null;
  setId: string | null;
  qNorm: string;
  rarityFilters: string[];
  typeFilters: string[];
  cardSort: CardSortOption;
  setSort: ReturnType<typeof sanitizeSetSort>;
  page: number;
  pageSize: number;
}) {
  assertScrydexEnabled("GET /api/cards/search");

  const {
    getCachedSearch,
    setCachedSearch,
  }: {
    getCachedSearch: (q: string) => Promise<SearchPreview[] | null>;
    setCachedSearch: (
      q: string,
      results: SearchPreview[],
      ttlMs: number,
    ) => Promise<void>;
  } = await import("@/lib/scrydex/cache");

  const {
    type,
    mode,
    setId,
    qNorm,
    rarityFilters,
    typeFilters,
    cardSort,
    setSort,
    page,
    pageSize,
  } = params;

  const cacheKeyBase =
    type === "sets"
      ? mode === "recent"
        ? `sets|recent|sort=${setSort}|lang=en|tcg=1|${CACHE_VERSION}`
        : `sets|q=${qNorm}|sort=${setSort}|lang=en|tcg=1|${CACHE_VERSION}`
      : setId
        ? mode === "recent"
          ? `cards|recent|set=${setId}|rarity=${rarityFilters.join(",")}|type=${typeFilters.join(",")}|sort=${cardSort}|lang=en|tcg=1|${CACHE_VERSION}`
          : `cards|q=${qNorm}|set=${setId}|rarity=${rarityFilters.join(",")}|type=${typeFilters.join(",")}|sort=${cardSort}|lang=en|tcg=1|${CACHE_VERSION}`
        : mode === "recent"
          ? `cards|recent|rarity=${rarityFilters.join(",")}|type=${typeFilters.join(",")}|sort=${cardSort}|lang=en|tcg=1|${CACHE_VERSION}`
          : `cards|q=${qNorm}|rarity=${rarityFilters.join(",")}|type=${typeFilters.join(",")}|sort=${cardSort}|lang=en|tcg=1|${CACHE_VERSION}`;

  const cacheKey = `${cacheKeyBase}|page=${page}|page_size=${pageSize}`;
  const cached = await getCachedSearch(cacheKey);

  if (cached && cached.length > 0) {
    return {
      response: {
        results: cached,
        cached: true,
        page,
        pageSize,
      } satisfies ApiResponse,
    };
  }

  if (type === "sets") {
    const scrydexUnknown =
      mode === "recent"
        ? await fetchSets({ page, pageSize, mode, sort: setSort })
        : await fetchSets({
            q: buildSetsQuery(qNorm.length >= 2 ? `name:${qNorm}*` : undefined),
            page,
            pageSize,
            sort: setSort,
          });

    const { results, totalCount } = parseSets(scrydexUnknown);

    await setCachedSearch(cacheKey, results, CACHE_TTL_MS);

    return {
      response: {
        results,
        cached: false,
        page,
        pageSize,
        totalCount,
      } satisfies ApiResponse,
    };
  }

  const scrydexUnknown =
    mode === "recent"
      ? await fetchCards({
          page,
          pageSize,
          mode,
          setId,
          rarityFilters,
          typeFilters,
          sort: cardSort,
        })
      : await fetchCards({
          q: qNorm.length >= 2 ? `name:${qNorm}*` : undefined,
          page,
          pageSize,
          mode: null,
          setId,
          rarityFilters,
          typeFilters,
          sort: cardSort,
        });

  const { results, totalCount } = parseCards(scrydexUnknown);

  await setCachedSearch(cacheKey, results, CACHE_TTL_MS);

  return {
    response: {
      results,
      cached: false,
      page,
      pageSize,
      totalCount,
    } satisfies ApiResponse,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type") === "sets" ? "sets" : "cards";
    const mode = searchParams.get("mode");
    const setId = searchParams.get("set");
    const rarityFilters = sanitizeRarityFilters(searchParams.getAll("rarity"));
    const typeFilters = sanitizeTypeFilters(searchParams.getAll("type"));
    const rawSort = searchParams.get("sort");
    const cardSort = sanitizeCardSort(rawSort);
    const setSort = sanitizeSetSort(rawSort);

    const qRaw = searchParams.get("q") ?? "";
    const qNorm = normalizeQuery(qRaw);

    const pageRaw = Number(searchParams.get("page") ?? "1");
    const page = clamp(Number.isFinite(pageRaw) ? pageRaw : 1, 1, 9999);

    const defaultPageSize =
      type === "sets" ? DEFAULT_SET_PAGE_SIZE : DEFAULT_PAGE_SIZE;

    const pageSizeRaw = Number(searchParams.get("page_size") ?? String(defaultPageSize));
    const pageSize = clamp(
      Number.isFinite(pageSizeRaw) ? pageSizeRaw : defaultPageSize,
      1,
      MAX_PAGE_SIZE,
    );

    if (qNorm.length < 2 && mode !== "recent") {
      const empty: ApiResponse = {
        results: [],
        cached: false,
        page: 1,
        pageSize,
      };
      return NextResponse.json(empty);
    }

    if (getCardSource() === "DB") {
      if (type === "sets") {
        const out: ApiResponse = {
          results: [],
          cached: false,
          page,
          pageSize,
          totalCount: 0,
        };
        return NextResponse.json(out);
      }

      const { results, totalCount } = await searchCardsFromDb({
        qNorm,
        mode,
        setId,
        rarityFilters,
        typeFilters,
        cardSort,
        page,
        pageSize,
      });

      const out: ApiResponse = {
        results,
        cached: false,
        page,
        pageSize,
        totalCount,
      };
      return NextResponse.json(out);
    }

    const { response } = await handleApiMode({
      type,
      mode,
      setId,
      qNorm,
      rarityFilters,
      typeFilters,
      cardSort,
      setSort,
      page,
      pageSize,
    });

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search failed";
    const isScrydexDisabledError = message.includes("Scrydex is disabled");
    return NextResponse.json(
      { error: message },
      { status: isScrydexDisabledError ? 503 : 500 },
    );
  }
}
