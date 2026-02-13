export const CARD_TYPE_FILTER_OPTIONS = [
  "Grass",
  "Fire",
  "Water",
  "Lightning",
  "Psychic",
  "Fighting",
  "Darkness",
  "Metal",
  "Fairy",
  "Dragon",
  "Colorless",
] as const;

export type CardTypeFilterOption = (typeof CARD_TYPE_FILTER_OPTIONS)[number];

function escapeValue(value: string) {
  return value.replaceAll('"', '\\"');
}

function valueClause(value: string) {
  return `types:"${escapeValue(value)}"`;
}

export function sanitizeTypeFilters(values: string[] | undefined): string[] {
  if (!values || values.length === 0) return [];
  const allowed = new Set<string>(CARD_TYPE_FILTER_OPTIONS);
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

export function buildTypeQuery(filters: string[] | undefined): string | undefined {
  const selected = sanitizeTypeFilters(filters);
  if (selected.length === 0) return undefined;
  return selected.map(valueClause).join(" OR ");
}
