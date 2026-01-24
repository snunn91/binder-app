import { scrydexFetch } from "@/lib/scrydex/client";
import type { CardSearchPreview } from "@/lib/scrydex/cache";
import {
  getArray,
  getNumber,
  getString,
  isRecord,
} from "@/app/api/cards/search/searchUtils";
import {
  EN_CARDS_ENDPOINT,
  EN_EXPANSIONS_ENDPOINT,
} from "@/app/api/cards/search/searchEndpoints";

export const DEFAULT_PAGE_SIZE = 24;

const SELECT_CARD_FIELDS = "id,name,number,rarity,expansion,images";

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

export function isOnlineOnlyCard(cardUnknown: unknown): boolean {
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

export function parseCards(scrydexUnknown: unknown): {
  results: CardSearchPreview[];
  totalCount?: number;
} {
  let data: unknown[] = [];
  let totalCount: number | undefined = undefined;

  if (isRecord(scrydexUnknown)) {
    data = getArray(scrydexUnknown.data);
    totalCount = getNumber(scrydexUnknown.totalCount);
  }

  const results = data
    .filter((card) => !isOnlineOnlyCard(card))
    .map(toCardPreview)
    .filter((x): x is CardSearchPreview => x !== null);

  return { results, totalCount };
}

export async function fetchCards(params: {
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
