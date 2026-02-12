export const SORT_OPTIONS = [
  "Newest",
  "Oldest",
  "Name A-Z",
  "Name Z-A",
  "Number ASC",
  "Number DESC",
] as const;

export type SearchSortOption = (typeof SORT_OPTIONS)[number];
export type CardSortOption = SearchSortOption;
export type SetSortOption = Exclude<SearchSortOption, "Number ASC" | "Number DESC">;
export type SortScope = "cards" | "sets";

export const DEFAULT_CARD_SORT: CardSortOption = "Newest";
export const DEFAULT_SET_SORT: SetSortOption = "Newest";

export const CARD_SORT_GROUPS = [
  { title: "Release Date", options: ["Newest", "Oldest"] as const },
  { title: "Name", options: ["Name A-Z", "Name Z-A"] as const },
  { title: "Number", options: ["Number ASC", "Number DESC"] as const },
] as const;

export const SET_SORT_GROUPS = [
  { title: "Release Date", options: ["Newest", "Oldest"] as const },
  { title: "Name", options: ["Name A-Z", "Name Z-A"] as const },
] as const;

export function getSortGroups(scope: SortScope) {
  return scope === "sets" ? SET_SORT_GROUPS : CARD_SORT_GROUPS;
}

export function sanitizeCardSort(
  value: string | null | undefined,
): CardSortOption {
  if (
    value === "Newest" ||
    value === "Oldest" ||
    value === "Name A-Z" ||
    value === "Name Z-A" ||
    value === "Number ASC" ||
    value === "Number DESC"
  ) {
    return value;
  }
  return DEFAULT_CARD_SORT;
}

export function sanitizeSetSort(value: string | null | undefined): SetSortOption {
  if (
    value === "Newest" ||
    value === "Oldest" ||
    value === "Name A-Z" ||
    value === "Name Z-A"
  ) {
    return value;
  }
  return DEFAULT_SET_SORT;
}

export function sanitizeSortForScope(
  value: string | null | undefined,
  scope: SortScope,
): SearchSortOption {
  return scope === "sets" ? sanitizeSetSort(value) : sanitizeCardSort(value);
}

export function cardSortToOrderBy(sort: CardSortOption): string {
  if (sort === "Oldest") return "expansion.release_date,expansion_sort_order";
  if (sort === "Name A-Z") return "name";
  if (sort === "Name Z-A") return "-name";
  if (sort === "Number ASC") return "number";
  if (sort === "Number DESC") return "-number";
  return "-expansion.release_date,-expansion_sort_order";
}

export function setSortToOrderBy(sort: SetSortOption): string {
  if (sort === "Oldest") return "release_date";
  if (sort === "Name A-Z") return "name";
  if (sort === "Name Z-A") return "-name";
  return "-release_date";
}
