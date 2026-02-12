import { scrydexFetch } from "@/lib/scrydex/client";
import type { SetSearchPreview } from "@/lib/scrydex/cache";
import {
  getArray,
  getNumber,
  getString,
  isRecord,
} from "@/app/api/cards/search/searchUtils";
import { EN_EXPANSIONS_ENDPOINT } from "@/app/api/cards/search/searchEndpoints";
import {
  DEFAULT_SET_SORT,
  sanitizeSetSort,
  setSortToOrderBy,
  type SetSortOption,
} from "@/lib/scrydex/sort";

export const DEFAULT_SET_PAGE_SIZE = 15;

const SELECT_SET_FIELDS = "id,name,series,total,release_date,logo,symbol";
const TCG_ONLY_SETS_Q = "is_online_only:false";

export function buildSetsQuery(namePrefix?: string) {
  return [TCG_ONLY_SETS_Q, namePrefix].filter(Boolean).join(" ");
}

function toSetPreview(setUnknown: unknown): SetSearchPreview | null {
  if (!isRecord(setUnknown)) return null;

  const id = getString(setUnknown.id);
  const name = getString(setUnknown.name);
  if (!id || !name) return null;

  const releaseDate = getString(setUnknown.release_date);
  const releaseYear = releaseDate ? Number(releaseDate.slice(0, 4)) : undefined;
  const series = getString(setUnknown.series);
  const total = getNumber(setUnknown.total);
  const logo = getString(setUnknown.logo);
  const symbol = getString(setUnknown.symbol);

  return {
    id,
    name,
    ...(series ? { series } : {}),
    ...(total !== undefined ? { total } : {}),
    ...(releaseDate ? { releaseDate } : {}),
    ...(releaseYear ? { releaseYear } : {}),
    ...(logo ? { logo } : {}),
    ...(symbol ? { symbol } : {}),
  };
}

export function parseSets(scrydexUnknown: unknown): {
  results: SetSearchPreview[];
  totalCount?: number;
} {
  let data: unknown[] = [];
  let totalCount: number | undefined = undefined;

  if (isRecord(scrydexUnknown)) {
    data = getArray(scrydexUnknown.data);
    totalCount = getNumber(scrydexUnknown.totalCount);
  }

  const results = data
    .map(toSetPreview)
    .filter((x): x is SetSearchPreview => x !== null);

  return { results, totalCount };
}

export async function fetchSets(params: {
  q?: string;
  page: number;
  pageSize: number;
  mode?: string | null;
  sort?: SetSortOption;
}) {
  const { q, page, pageSize, mode } = params;
  const sort = sanitizeSetSort(params.sort ?? DEFAULT_SET_SORT);
  const orderBy = setSortToOrderBy(sort);

  if (mode === "recent") {
    return await scrydexFetch<unknown>(EN_EXPANSIONS_ENDPOINT, {
      page: String(page),
      page_size: String(pageSize),
      orderBy,
      select: SELECT_SET_FIELDS,
      q: TCG_ONLY_SETS_Q,
    });
  }

  return await scrydexFetch<unknown>(EN_EXPANSIONS_ENDPOINT, {
    page: String(page),
    page_size: String(pageSize),
    orderBy,
    select: SELECT_SET_FIELDS,
    ...(q ? { q } : {}),
  });
}
