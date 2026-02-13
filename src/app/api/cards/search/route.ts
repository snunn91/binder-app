export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  getCachedSearch,
  normalizeQuery,
  setCachedSearch,
  type SearchPreview,
} from "@/lib/scrydex/cache";
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
import { sanitizeCardSort, sanitizeSetSort } from "@/lib/scrydex/sort";

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14d
const MAX_PAGE_SIZE = 50;
const CACHE_VERSION = "v7";

type ApiResponse = {
  results: SearchPreview[];
  cached: boolean;
  page: number;
  pageSize: number;
  totalCount?: number;
};

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

    const pageSizeRaw = Number(
      searchParams.get("page_size") ?? String(defaultPageSize),
    );
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
    const cached = await getCachedSearch<SearchPreview>(cacheKey);

    if (cached && cached.length > 0) {
      const out: ApiResponse = {
        results: cached,
        cached: true,
        page,
        pageSize,
      };
      return NextResponse.json(out);
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

      const out: ApiResponse = {
        results,
        cached: false,
        page,
        pageSize,
        totalCount,
      };
      return NextResponse.json(out);
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
