export const OTHER_RARITY_OPTION = "Other" as const;

export const RARITY_FILTER_OPTIONS = [
  "Common",
  "Uncommon",
  "Rare",
  "Rare Holo",
  "Double Rare",
  "Ultra Rare",
  "Illustration Rare",
  "Special Illustration Rare",
  "Hyper Rare",
  "Radiant Rare",
  "Shiny Rare",
  "Shiny Ultra Rare",
  "Rare Rainbow",
  "Rare Gold",
  "Rare Secret",
  "Rare Full Art",
  "Rare Holo EX",
  "Rare Holo GX",
  "Rare Holo V",
  "Rare Holo VMAX",
  "Rare Holo VSTAR",
  "Amazing Rare",
  "Rare Prism Star",
  "Rare BREAK",
  "Rare Prime",
  "Shining",
  "Rare Holo Star",
  "Promo",
  OTHER_RARITY_OPTION,
] as const;

export type RarityFilterOption = (typeof RARITY_FILTER_OPTIONS)[number];

const RARITY_API_ALIASES: Record<string, string[]> = {
  Common: ["Common"],
  Uncommon: ["Uncommon"],
  Rare: ["Rare"],
  "Rare Holo": ["Rare Holo", "Holo Rare"],
  "Double Rare": ["Double Rare"],
  "Ultra Rare": ["Ultra Rare"],
  "Illustration Rare": ["Illustration Rare"],
  "Special Illustration Rare": ["Special Illustration Rare"],
  "Hyper Rare": ["Hyper Rare"],
  "Radiant Rare": ["Radiant Rare"],
  "Shiny Rare": ["Shiny Rare"],
  "Shiny Ultra Rare": ["Shiny Ultra Rare"],
  "Rare Rainbow": ["Rare Rainbow", "Rainbow Rare"],
  "Rare Gold": ["Rare Gold", "Gold Rare"],
  "Rare Secret": ["Rare Secret", "Secret Rare"],
  "Rare Full Art": ["Rare Full Art", "Ultra Rare Full Art"],
  "Rare Holo EX": ["Rare Holo EX"],
  "Rare Holo GX": ["Rare Holo GX"],
  "Rare Holo V": ["Rare Holo V"],
  "Rare Holo VMAX": ["Rare Holo VMAX"],
  "Rare Holo VSTAR": ["Rare Holo VSTAR"],
  "Amazing Rare": ["Amazing Rare"],
  "Rare Prism Star": ["Rare Prism Star"],
  "Rare BREAK": ["Rare BREAK"],
  "Rare Prime": ["Rare Prime"],
  Shining: ["Shining"],
  "Rare Holo Star": ["Rare Holo Star"],
  Promo: ["Promo", "Rare Holo Promo"],
};

const BASE_OPTIONS = RARITY_FILTER_OPTIONS.filter(
  (option) => option !== OTHER_RARITY_OPTION,
);

function escapeValue(value: string) {
  return value.replaceAll('"', '\\"');
}

function valueClause(value: string) {
  return `rarity:"${escapeValue(value)}"`;
}

function optionClause(option: string) {
  const aliases = RARITY_API_ALIASES[option] ?? [option];
  if (aliases.length === 1) return valueClause(aliases[0]);
  return `(${aliases.map(valueClause).join(" OR ")})`;
}

function otherClause() {
  const knownValues = new Set<string>();
  BASE_OPTIONS.forEach((option) => {
    const aliases = RARITY_API_ALIASES[option] ?? [option];
    aliases.forEach((value) => knownValues.add(value));
  });

  if (knownValues.size === 0) return "";
  return Array.from(knownValues).map((value) => `!${valueClause(value)}`).join(" ");
}

export function sanitizeRarityFilters(values: string[] | undefined): string[] {
  if (!values || values.length === 0) return [];
  const allowed = new Set<string>(RARITY_FILTER_OPTIONS);
  const seen = new Set<string>();
  const out: string[] = [];

  values.forEach((value) => {
    const trimmed = value.trim();
    if (!trimmed || !allowed.has(trimmed) || seen.has(trimmed)) return;
    seen.add(trimmed);
    out.push(trimmed);
  });

  return out;
}

export function buildRarityQuery(filters: string[] | undefined): string | undefined {
  const selected = sanitizeRarityFilters(filters);
  if (selected.length === 0) return undefined;

  const includeOther = selected.includes(OTHER_RARITY_OPTION);
  const selectedBase = selected.filter((option) => option !== OTHER_RARITY_OPTION);
  const baseQuery =
    selectedBase.length > 0 ? selectedBase.map(optionClause).join(" OR ") : "";

  if (includeOther && baseQuery) {
    const other = otherClause();
    return other ? `(${baseQuery}) OR (${other})` : baseQuery;
  }

  if (includeOther) {
    const other = otherClause();
    return other || undefined;
  }

  return baseQuery || undefined;
}
