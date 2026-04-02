export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { RARITY_FILTER_OPTIONS } from "@/lib/scrydex/rarity";
import { CARD_TYPE_FILTER_OPTIONS } from "@/lib/scrydex/type";
import type { BinderCard } from "@/lib/services/binderService";

const AI_PROMPT_LIMIT = 5;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

type RateLimitResult =
  | { allowed: true; used: number; resetAt: string | null }
  | { allowed: false; used: number; resetAt: string };

async function checkAndIncrementRateLimit(userId: string): Promise<RateLimitResult> {
  const serviceClient = getSupabaseServiceClient();

  const { data } = await serviceClient
    .from("ai_prompt_usage")
    .select("prompt_count, cooldown_started_at")
    .eq("user_id", userId)
    .maybeSingle();

  const now = Date.now();

  if (!data) {
    // First ever prompt
    await serviceClient
      .from("ai_prompt_usage")
      .insert({ user_id: userId, prompt_count: 1, cooldown_started_at: null });
    return { allowed: true, used: 1, resetAt: null };
  }

  const { prompt_count, cooldown_started_at } = data as {
    prompt_count: number;
    cooldown_started_at: string | null;
  };

  if (cooldown_started_at) {
    const elapsed = now - new Date(cooldown_started_at).getTime();
    if (elapsed < COOLDOWN_MS) {
      const resetAt = new Date(new Date(cooldown_started_at).getTime() + COOLDOWN_MS).toISOString();
      return { allowed: false, used: AI_PROMPT_LIMIT, resetAt };
    }
    // Cooldown expired — reset and allow
    await serviceClient
      .from("ai_prompt_usage")
      .update({ prompt_count: 1, cooldown_started_at: null })
      .eq("user_id", userId);
    return { allowed: true, used: 1, resetAt: null };
  }

  const newCount = prompt_count + 1;
  const hitLimit = newCount >= AI_PROMPT_LIMIT;
  const newCooldownStart = hitLimit ? new Date(now).toISOString() : null;

  await serviceClient
    .from("ai_prompt_usage")
    .update({ prompt_count: newCount, cooldown_started_at: newCooldownStart })
    .eq("user_id", userId);

  return {
    allowed: true,
    used: newCount,
    resetAt: hitLimit ? new Date(now + COOLDOWN_MS).toISOString() : null,
  };
}

type GenerateCardsRequest = {
  prompt: string;
  emptySlots: number;
  language: "en" | "jp";
};

type AiCardParams = {
  nameLike?: string[];
  rarities?: string[];
  types?: string[];
  supertype?: "Pokémon" | "Trainer" | "Energy";
  series?: string[];           // broad era → all expansions in that series
  expansionNames?: string[];  // specific set names, resolved via ilike on expansions.name
  releaseDateBefore?: string;
  releaseDateAfter?: string;
};

type DbCardRow = {
  id: string;
  name: string;
  number: string | null;
  rarity: string | null;
  supertype: string | null;
  price_raw_display: number | string | null;
  expansion_id: string | null;
  expansion_name: string | null;
  image_small: string | null;
  image_large: string | null;
};

function hasAnyFilter(params: AiCardParams): boolean {
  return !!(
    (params.nameLike && params.nameLike.length > 0) ||
    (params.rarities && params.rarities.length > 0) ||
    (params.types && params.types.length > 0) ||
    params.supertype ||
    (params.series && params.series.length > 0) ||
    (params.expansionNames && params.expansionNames.length > 0) ||
    params.releaseDateBefore ||
    params.releaseDateAfter
  );
}

async function fetchDistinctSeries(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  expansionsTable: string,
): Promise<string[]> {
  const { data } = await supabase
    .from(expansionsTable)
    .select("series")
    .not("series", "is", null)
    .not("is_online_only", "is", true);

  if (!data) return [];

  const seen = new Set<string>();
  for (const row of data as { series: string | null }[]) {
    if (row.series?.trim()) seen.add(row.series.trim());
  }
  return Array.from(seen).sort();
}

function buildSystemPrompt(seriesList: string[]): string {
  const rarities = RARITY_FILTER_OPTIONS.filter((r) => r !== "Other").join(", ");
  const types = CARD_TYPE_FILTER_OPTIONS.join(", ");
  const series = seriesList.join(", ");

  return `You are a Pokemon TCG card filter assistant. Interpret a natural-language prompt and extract structured search parameters.

VALID RARITIES (use exact strings only):
${rarities}

VALID TYPES (use exact strings only):
${types}

VALID SERIES/ERAS (use exact strings only):
${series}

VALID SUPERTYPES (use exact strings only):
Pokémon, Trainer, Energy

SUPERTYPE RULES:
- "trainer", "trainers", "supporter", "item", "stadium" → supertype: "Trainer"
- "pokemon", "pokémon" → supertype: "Pokémon"
- "energy", "energies" → supertype: "Energy"
- "Full Art trainers" → supertype: "Trainer" AND rarities: ["Ultra Rare", "Illustration Rare", "Special Illustration Rare", "Hyper Rare", "Rare Rainbow", "Rare Gold", "Rare Full Art", "Rare Holo GX", "Rare Secret", "Rare Holo V"]
- "SIR trainers" → supertype: "Trainer" AND rarities: ["Special Illustration Rare"]
- "IR trainers" → supertype: "Trainer" AND rarities: ["Illustration Rare"]
- "Ultra Rare trainers" → supertype: "Trainer" AND rarities: ["Ultra Rare"]

RARITY ALIAS RULES:
- "SIR" → rarities: ["Special Illustration Rare"]
- "IR" → rarities: ["Illustration Rare"]
- "Full Art" → rarities: ["Ultra Rare", "Illustration Rare", "Special Illustration Rare", "Hyper Rare", "Rare Rainbow", "Rare Gold", "Rare Full Art", "Rare Holo GX", "Rare Secret", "Rare Holo V"]
- "Secret Rare" → rarities: ["Rare Secret"]
- "Rainbow Rare" or "Rainbow" → rarities: ["Rare Rainbow"]
- "Gold Rare" or "Gold" → rarities: ["Rare Gold", "Hyper Rare"]
- "Holo Rare" or "Holo" → rarities: ["Rare Holo"]

SET vs ERA — this distinction is critical:
- Use "series" ONLY for broad eras that cover many sets (e.g. "Scarlet and Violet era" → series: ["Scarlet & Violet"])
- Use "expansionNames" for any specific named set or expansion (e.g. "set 151", "OBF", "Obsidian Flames")
- Do NOT put both series and expansionNames for the same constraint — use the more specific one
- Expand set abbreviations you know. Examples: OBF → "Obsidian Flames", PAL → "Paldea Evolved", MEW → "151", SVI → "Scarlet & Violet", TWM → "Twilight Masquerade", PRE → "Prismatic Evolutions", SSP → "Surging Sparks", SCR → "Stellar Crown", MDF → "Mask of Change", PGO → "Pokémon GO", CRZ → "Crown Zenith", SIT → "Silver Tempest", LOR → "Lost Origin", PGO → "Pokémon GO"
- For numeric set names like "151", output "151" — the database expansion name contains this number
- Series era aliases: "Scarlet and Violet" / "SV" → "Scarlet & Violet", "Sword and Shield" / "SWSH" → "Sword & Shield", "Sun and Moon" / "SM" → "Sun & Moon", "XY" → "XY", "Black and White" / "BW" → "Black & White"

DATE RULES:
- "pre YYYY" or "before YYYY" → releaseDateBefore: "YYYY-01-01"
- "post YYYY" or "after YYYY" → releaseDateAfter: "YYYY-12-31"
- "YYYY era" or "YYYY period" → set both releaseDateAfter and releaseDateBefore to cover that decade

NAME RULES:
- If one or more Pokémon names are mentioned, return ALL of them as an array in "nameLike"
- e.g. "Dialga, Palkia and Arceus" → nameLike: ["Dialga", "Palkia", "Arceus"]

Return ONLY valid JSON with this exact structure (omit keys that don't apply):
{
  "nameLike": ["array of pokemon names if specified, else omit"],
  "rarities": ["array of exact rarity strings, else omit"],
  "types": ["array of exact type strings, else omit"],
  "supertype": "Pokémon or Trainer or Energy, else omit",
  "series": ["array of exact series strings from the VALID SERIES list above, for broad era queries only, else omit"],
  "expansionNames": ["specific expansion/set names expanded from abbreviations, for specific set queries, else omit"],
  "releaseDateBefore": "YYYY-MM-DD or omit",
  "releaseDateAfter": "YYYY-MM-DD or omit"
}`;
}

function parseAiResponse(raw: string): AiCardParams {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null) return {};

  const obj = parsed as Record<string, unknown>;
  const validRarities = new Set<string>(RARITY_FILTER_OPTIONS);
  const validTypes = new Set<string>(CARD_TYPE_FILTER_OPTIONS);

  const VALID_SUPERTYPES = new Set(["Pokémon", "Trainer", "Energy"]);

  return {
    nameLike: Array.isArray(obj.nameLike)
      ? (obj.nameLike as unknown[]).filter(
          (n): n is string => typeof n === "string" && n.trim().length > 0,
        ).map((n) => n.trim())
      : typeof obj.nameLike === "string" && obj.nameLike.trim()
        ? [obj.nameLike.trim()]
        : undefined,
    rarities: Array.isArray(obj.rarities)
      ? (obj.rarities as unknown[]).filter(
          (r): r is string => typeof r === "string" && validRarities.has(r),
        )
      : undefined,
    types: Array.isArray(obj.types)
      ? (obj.types as unknown[]).filter(
          (t): t is string => typeof t === "string" && validTypes.has(t),
        )
      : undefined,
    supertype:
      typeof obj.supertype === "string" && VALID_SUPERTYPES.has(obj.supertype)
        ? (obj.supertype as "Pokémon" | "Trainer" | "Energy")
        : undefined,
    series: Array.isArray(obj.series)
      ? (obj.series as unknown[]).filter(
          (s): s is string => typeof s === "string" && s.trim().length > 0,
        )
      : undefined,
    expansionNames: Array.isArray(obj.expansionNames)
      ? (obj.expansionNames as unknown[]).filter(
          (s): s is string => typeof s === "string" && s.trim().length > 0,
        )
      : undefined,
    releaseDateBefore:
      typeof obj.releaseDateBefore === "string"
        ? obj.releaseDateBefore
        : undefined,
    releaseDateAfter:
      typeof obj.releaseDateAfter === "string"
        ? obj.releaseDateAfter
        : undefined,
  };
}

async function callOpenAI(
  prompt: string,
  seriesList: string[],
): Promise<AiCardParams> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildSystemPrompt(seriesList) },
      { role: "user", content: prompt },
    ],
    max_tokens: 256,
    temperature: 0,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return parseAiResponse(raw);
}

async function resolveSeriesExpansionIds(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  expansionsTable: string,
  seriesNames: string[],
): Promise<string[]> {
  const { data } = await supabase
    .from(expansionsTable)
    .select("id")
    .in("series", seriesNames)
    .not("is_online_only", "is", true);

  if (!data) return [];
  return (data as { id: string }[]).map((row) => row.id);
}

async function resolveExpansionNameIds(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  expansionsTable: string,
  expansionNames: string[],
): Promise<string[]> {
  const ids = new Set<string>();
  for (const name of expansionNames) {
    const { data } = await supabase
      .from(expansionsTable)
      .select("id")
      .ilike("name", `%${name}%`)
      .not("is_online_only", "is", true);
    for (const row of (data ?? []) as { id: string }[]) {
      ids.add(row.id);
    }
  }
  return Array.from(ids);
}

async function fetchMatchingCards(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  cardsTable: string,
  expansionsTable: string,
  params: AiCardParams,
): Promise<DbCardRow[]> {
  let query = supabase
    .from(cardsTable)
    .select(
      "id, name, number, rarity, supertype, price_raw_display, expansion_id, expansion_name, image_small, image_large",
    );

  if (params.nameLike && params.nameLike.length > 0) {
    query = query.or(
      params.nameLike.map((n) => `name.ilike.%${n}%`).join(","),
    );
  }

  if (params.rarities && params.rarities.length > 0) {
    query = query.in("rarity", params.rarities);
  }

  if (params.supertype) {
    query = query.eq("supertype", params.supertype);
  }

  if (params.types && params.types.length > 0) {
    query = query.overlaps("types", params.types);
  }

  if (
    (params.series && params.series.length > 0) ||
    (params.expansionNames && params.expansionNames.length > 0)
  ) {
    const expansionIds: string[] = [];

    if (params.series && params.series.length > 0) {
      const ids = await resolveSeriesExpansionIds(
        supabase,
        expansionsTable,
        params.series,
      );
      expansionIds.push(...ids);
    }

    if (params.expansionNames && params.expansionNames.length > 0) {
      const ids = await resolveExpansionNameIds(
        supabase,
        expansionsTable,
        params.expansionNames,
      );
      expansionIds.push(...ids);
    }

    if (expansionIds.length === 0) return [];
    const uniqueIds = [...new Set(expansionIds)];
    query = query.in("expansion_id", uniqueIds);
  }

  if (params.releaseDateBefore) {
    query = query.lt("expansion_release_date", params.releaseDateBefore);
  }

  if (params.releaseDateAfter) {
    query = query.gt("expansion_release_date", params.releaseDateAfter);
  }

  const { data, error } = await query.limit(500);
  if (error) throw new Error(`DB query failed: ${error.message}`);
  return (data ?? []) as DbCardRow[];
}

function sampleCards(cards: DbCardRow[], count: number): DbCardRow[] {
  if (cards.length <= count) return cards;
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr.slice(0, count);
}

function parsePriceUsd(raw: number | string | null): number | undefined {
  if (raw === null || raw === undefined) return undefined;
  const parsed = typeof raw === "number" ? raw : parseFloat(String(raw));
  return isNaN(parsed) ? undefined : parsed;
}

function toBinderCard(row: DbCardRow): BinderCard {
  const priceUsd = parsePriceUsd(row.price_raw_display);
  return {
    id: row.id,
    name: row.name,
    ...(row.number ? { number: row.number } : {}),
    ...(row.rarity ? { rarity: row.rarity } : {}),
    ...(priceUsd !== undefined ? { priceUsd } : {}),
    collectionStatus: "collected",
    ...(row.expansion_id ?? row.expansion_name
      ? {
          expansion: {
            ...(row.expansion_id ? { id: row.expansion_id } : {}),
            ...(row.expansion_name ? { name: row.expansion_name } : {}),
          },
        }
      : {}),
    ...(row.image_small ?? row.image_large
      ? {
          image: {
            ...(row.image_small ? { small: row.image_small } : {}),
            ...(row.image_large ? { large: row.image_large } : {}),
          },
        }
      : {}),
  };
}

export async function POST(req: Request) {
  try {
    // Auth — require a valid session token
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = getSupabaseServiceClient();
    const { data: userData, error: authError } =
      await serviceClient.auth.getUser(token);
    if (authError || !userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = userData.user.id;

    // Rate limiting — enforce before parsing the prompt
    const exemptUsers = (process.env.AI_RATE_LIMIT_EXEMPT_USERS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const isExempt = exemptUsers.includes(userId);

    const rateLimit = isExempt
      ? { allowed: true as const, used: 0, resetAt: null }
      : await checkAndIncrementRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "You've used all 5 AI prompts. Your limit will reset in 24 hours.",
          resetAt: rateLimit.resetAt,
        },
        { status: 429 },
      );
    }

    const body = (await req.json()) as GenerateCardsRequest;

    const prompt =
      typeof body.prompt === "string" ? body.prompt.trim() : "";
    const emptySlots =
      typeof body.emptySlots === "number" && body.emptySlots > 0
        ? Math.min(body.emptySlots, 36)
        : 9;
    const language = body.language === "jp" ? "jp" : "en";

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    const cardsTable = language === "jp" ? "jpn_cards" : "cards";
    const expansionsTable = language === "jp" ? "jpn_expansions" : "expansions";

    const supabase = getSupabaseServerClient();

    const seriesList = await fetchDistinctSeries(supabase, expansionsTable);
    const aiParams = await callOpenAI(prompt, seriesList);

    if (!hasAnyFilter(aiParams)) {
      return NextResponse.json(
        {
          error:
            "Could not understand your request. Try being more specific — for example: \"SIR cards from Scarlet and Violet era\" or \"Charizard cards pre 2010\".",
          used: rateLimit.used,
          resetAt: rateLimit.resetAt,
        },
        { status: 400 },
      );
    }

    const matchingCards = await fetchMatchingCards(
      supabase,
      cardsTable,
      expansionsTable,
      aiParams,
    );

    const sampled = sampleCards(matchingCards, emptySlots);
    const cards: BinderCard[] = sampled.map(toBinderCard);

    return NextResponse.json({ cards, used: rateLimit.used, resetAt: rateLimit.resetAt });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
