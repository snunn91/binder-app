"use client";

import * as React from "react";
import { sanitizeRarityFilters } from "@/lib/scrydex/rarity";
import { sanitizeTypeFilters } from "@/lib/scrydex/type";
import {
  DEFAULT_CARD_SORT,
  sanitizeCardSort,
  sanitizeSetSort,
  type SearchSortOption,
} from "@/lib/scrydex/sort";

export type SetSearchPreview = {
  id: string;
  name: string;
  series?: string;
  total?: number;
  releaseDate?: string;
  releaseYear?: number;
  logo?: string;
  symbol?: string;
};

export type CardSearchPreview = {
  id: string;
  name: string;
  number?: string;
  rarity?: string;
  priceUsd?: number;
  expansion?: { id?: string; name?: string };
  image?: { small?: string; large?: string };
};

type SetsApiResponse = {
  results: SetSearchPreview[];
  cached: boolean;
  page: number;
  pageSize: number;
  totalCount?: number;
  error?: string;
};

type CardsApiResponse = {
  results: CardSearchPreview[];
  cached: boolean;
  page: number;
  pageSize: number;
  totalCount?: number;
  error?: string;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Search failed";
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

// Must stay in sync with API max page size cap in /api/cards/search.
const ALL_SETS_PAGE_SIZE = 50;
const MAX_SET_PAGES = 500;

export default function useSetSearch(opts?: {
  language?: "us" | "jp";
  setsPageSize?: number;
  cardsPageSize?: number;
  rarityFilters?: string[];
  typeFilters?: string[];
  sortBy?: SearchSortOption;
}) {
  const language = opts?.language ?? "us";
  const setsPageSize = opts?.setsPageSize ?? 15;
  const cardsPageSize = opts?.cardsPageSize ?? 24;
  const normalizedRarities = React.useMemo(
    () => sanitizeRarityFilters(opts?.rarityFilters),
    [opts?.rarityFilters],
  );
  const normalizedTypes = React.useMemo(
    () => sanitizeTypeFilters(opts?.typeFilters),
    [opts?.typeFilters],
  );
  const rarityKey = normalizedRarities.join("|");
  const typeKey = normalizedTypes.join("|");
  const normalizedCardSort = sanitizeCardSort(opts?.sortBy ?? DEFAULT_CARD_SORT);
  const normalizedSetSort = sanitizeSetSort(opts?.sortBy ?? DEFAULT_CARD_SORT);

  // SearchBar state for SETS mode (used for set search OR set-card search)
  const [input, setInput] = React.useState("");
  const [query, setQuery] = React.useState<string>("");

  const [selectedSet, setSelectedSet] = React.useState<SetSearchPreview | null>(
    null,
  );

  const [page, setPage] = React.useState(1);
  const [results, setResults] = React.useState<
    Array<SetSearchPreview | CardSearchPreview>
  >([]);
  const [totalCount, setTotalCount] = React.useState<number | undefined>(
    undefined,
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);
  const hasLoadedDefaultRef = React.useRef(false);

  const view: "sets" | "setCards" = selectedSet ? "setCards" : "sets";
  const pageSize = view === "sets" ? setsPageSize : cardsPageSize;

  function abortAndNewController() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller;
  }

  const runDefaultSets = React.useCallback(
    async () => {
      const controller = abortAndNewController();
      setLoading(true);
      setError(null);
      await waitForNextPaint();
      if (controller.signal.aborted) return;

      try {
        const allSets: SetSearchPreview[] = [];
        let currentPage = 1;
        let knownTotal: number | undefined = undefined;

        while (currentPage <= MAX_SET_PAGES) {
          const res = await fetch(
            `/api/cards/search?type=sets&language=${language}&mode=recent&page=${currentPage}&page_size=${ALL_SETS_PAGE_SIZE}&sort=${normalizedSetSort}`,
            { signal: controller.signal },
          );

          const json = (await res.json()) as SetsApiResponse;
          if (!res.ok) throw new Error(json?.error || "Search failed");

          const pageResults = json.results ?? [];
          knownTotal = json.totalCount;
          allSets.push(...pageResults);

          if (pageResults.length < ALL_SETS_PAGE_SIZE) break;
          if (knownTotal !== undefined && allSets.length >= knownTotal) break;
          currentPage += 1;
        }

        setPage(1);
        setResults(allSets);
        setTotalCount(knownTotal ?? allSets.length);
      } catch (err: unknown) {
        const name =
          typeof err === "object" && err !== null && "name" in err
            ? String((err as { name?: unknown }).name)
            : "";
        if (name !== "AbortError") {
          setError(getErrorMessage(err));
          setResults([]);
          setTotalCount(undefined);
        }
      } finally {
        setLoading(false);
      }
    },
    [language, normalizedSetSort],
  );

  const runDefaultSetCards = React.useCallback(
    async (setId: string, nextPage: number) => {
      const controller = abortAndNewController();
      setLoading(true);
      setError(null);
      await waitForNextPaint();
      if (controller.signal.aborted) return;

      try {
        const params = new URLSearchParams({
          language,
          mode: "recent",
          set: setId,
          page: String(nextPage),
          page_size: String(cardsPageSize),
          sort: normalizedCardSort,
        });
        normalizedRarities.forEach((rarity) => params.append("rarity", rarity));
        normalizedTypes.forEach((type) => params.append("type", type));

        const res = await fetch(`/api/cards/search?${params.toString()}`, {
          signal: controller.signal,
        });

        const json = (await res.json()) as CardsApiResponse;
        if (!res.ok) throw new Error(json?.error || "Search failed");

        setResults(json.results ?? []);
        setTotalCount(json.totalCount);
      } catch (err: unknown) {
        const name =
          typeof err === "object" && err !== null && "name" in err
            ? String((err as { name?: unknown }).name)
            : "";
        if (name !== "AbortError") {
          setError(getErrorMessage(err));
          setResults([]);
          setTotalCount(undefined);
        }
      } finally {
        setLoading(false);
      }
    },
    [language, cardsPageSize, normalizedCardSort, normalizedRarities, normalizedTypes],
  );

  const runSearchSets = React.useCallback(
    async (nextQuery: string) => {
      const q = nextQuery.trim();
      if (q.length < 2) {
        setError("Type at least 2 characters.");
        setResults([]);
        setTotalCount(undefined);
        return;
      }

      const controller = abortAndNewController();
      setLoading(true);
      setError(null);
      await waitForNextPaint();
      if (controller.signal.aborted) return;

      try {
        const allSets: SetSearchPreview[] = [];
        let currentPage = 1;
        let knownTotal: number | undefined = undefined;

        while (currentPage <= MAX_SET_PAGES) {
          const res = await fetch(
            `/api/cards/search?type=sets&language=${language}&q=${encodeURIComponent(q)}&page=${currentPage}&page_size=${ALL_SETS_PAGE_SIZE}&sort=${normalizedSetSort}`,
            { signal: controller.signal },
          );

          const json = (await res.json()) as SetsApiResponse;
          if (!res.ok) throw new Error(json?.error || "Search failed");

          const pageResults = json.results ?? [];
          knownTotal = json.totalCount;
          allSets.push(...pageResults);

          if (pageResults.length < ALL_SETS_PAGE_SIZE) break;
          if (knownTotal !== undefined && allSets.length >= knownTotal) break;
          currentPage += 1;
        }

        setPage(1);
        setResults(allSets);
        setTotalCount(knownTotal ?? allSets.length);
      } catch (err: unknown) {
        const name =
          typeof err === "object" && err !== null && "name" in err
            ? String((err as { name?: unknown }).name)
            : "";
        if (name !== "AbortError") {
          setError(getErrorMessage(err));
          setResults([]);
          setTotalCount(undefined);
        }
      } finally {
        setLoading(false);
      }
    },
    [language, normalizedSetSort],
  );

  const runSearchSetCards = React.useCallback(
    async (setId: string, nextQuery: string, nextPage: number) => {
      const q = nextQuery.trim();
      if (q.length < 2) {
        setError("Type at least 2 characters.");
        setResults([]);
        setTotalCount(undefined);
        return;
      }

      const controller = abortAndNewController();
      setLoading(true);
      setError(null);
      await waitForNextPaint();
      if (controller.signal.aborted) return;

      try {
        const params = new URLSearchParams({
          language,
          q,
          set: setId,
          page: String(nextPage),
          page_size: String(cardsPageSize),
          sort: normalizedCardSort,
        });
        normalizedRarities.forEach((rarity) => params.append("rarity", rarity));
        normalizedTypes.forEach((type) => params.append("type", type));

        const res = await fetch(`/api/cards/search?${params.toString()}`, {
          signal: controller.signal,
        });

        const json = (await res.json()) as CardsApiResponse;
        if (!res.ok) throw new Error(json?.error || "Search failed");

        setResults(json.results ?? []);
        setTotalCount(json.totalCount);
      } catch (err: unknown) {
        const name =
          typeof err === "object" && err !== null && "name" in err
            ? String((err as { name?: unknown }).name)
            : "";
        if (name !== "AbortError") {
          setError(getErrorMessage(err));
          setResults([]);
          setTotalCount(undefined);
        }
      } finally {
        setLoading(false);
      }
    },
    [language, cardsPageSize, normalizedCardSort, normalizedRarities, normalizedTypes],
  );

  function clearSearchState() {
    setInput("");
    setQuery("");
    setPage(1);
    setError(null);
    setResults([]);
    setTotalCount(undefined);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    setPage(1);

    if (selectedSet) {
      if (q.length < 2) {
        setQuery("");
        void runDefaultSetCards(selectedSet.id, 1);
        return;
      }
      setQuery(q);
      void runSearchSetCards(selectedSet.id, q, 1);
      return;
    }

    // no selected set -> search sets
    if (q.length < 2) {
      setQuery("");
      void runDefaultSets();
      return;
    }

    setQuery(q);
    void runSearchSets(q);
  }

  function onPrev() {
    if (!selectedSet) return;

    const nextPage = Math.max(1, page - 1);
    setPage(nextPage);

    if (query.trim().length < 2) void runDefaultSetCards(selectedSet.id, nextPage);
    else void runSearchSetCards(selectedSet.id, query, nextPage);
  }

  function onNext() {
    if (!selectedSet) return;

    const nextPage = page + 1;
    setPage(nextPage);

    if (query.trim().length < 2) void runDefaultSetCards(selectedSet.id, nextPage);
    else void runSearchSetCards(selectedSet.id, query, nextPage);
  }

  function selectSet(set: SetSearchPreview) {
    clearSearchState();
    setSelectedSet(set);
    void runDefaultSetCards(set.id, 1);
  }

  function backToSets() {
    clearSearchState();
    setSelectedSet(null);
    void runDefaultSets();
  }

  // initial load: default sets
  React.useEffect(() => {
    if (hasLoadedDefaultRef.current) return;
    hasLoadedDefaultRef.current = true;
    void runDefaultSets();
  }, [runDefaultSets]);

  React.useEffect(() => {
    if (!hasLoadedDefaultRef.current || selectedSet) return;
    setPage(1);
    if (query.trim().length < 2) void runDefaultSets();
    else void runSearchSets(query);
  }, [language, normalizedSetSort, query, runDefaultSets, runSearchSets, selectedSet]);

  React.useEffect(() => {
    if (!hasLoadedDefaultRef.current || !selectedSet) return;
    setPage(1);
    if (query.trim().length < 2) void runDefaultSetCards(selectedSet.id, 1);
    else void runSearchSetCards(selectedSet.id, query, 1);
  }, [
    normalizedCardSort,
    normalizedSetSort,
    language,
    query,
    rarityKey,
    typeKey,
    runDefaultSetCards,
    runSearchSetCards,
    selectedSet,
  ]);

  return {
    // SearchBar state
    input,
    setInput,
    query,
    onSubmit,

    // view state
    view,
    selectedSet,
    selectSet,
    backToSets,

    // list state
    page,
    pageSize,
    results,
    totalCount,
    loading,
    error,
    onPrev,
    onNext,

    // for debugging/testing if needed
    runDefaultSets,
    runDefaultSetCards,
  };
}
