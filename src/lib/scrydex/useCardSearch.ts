"use client";

import * as React from "react";
import { sanitizeRarityFilters } from "@/lib/scrydex/rarity";
import { sanitizeTypeFilters } from "@/lib/scrydex/type";
import {
  DEFAULT_CARD_SORT,
  sanitizeCardSort,
  type CardSortOption,
} from "@/lib/scrydex/sort";

export type CardSearchPreview = {
  id: string;
  name: string;
  number?: string;
  rarity?: string;
  expansion?: { id?: string; name?: string };
  image?: { small?: string; large?: string };
};

type ApiResponse = {
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

export default function useCardSearch(
  pageSize = 24,
  rarityFilters: string[] = [],
  typeFilters: string[] = [],
  sortBy: CardSortOption = DEFAULT_CARD_SORT,
) {
  const [input, setInput] = React.useState("");
  const [query, setQuery] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [results, setResults] = React.useState<CardSearchPreview[]>([]);
  const [totalCount, setTotalCount] = React.useState<number | undefined>(
    undefined,
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);
  const hasLoadedDefaultRef = React.useRef(false);
  const normalizedRarities = React.useMemo(
    () => sanitizeRarityFilters(rarityFilters),
    [rarityFilters],
  );
  const normalizedTypes = React.useMemo(
    () => sanitizeTypeFilters(typeFilters),
    [typeFilters],
  );
  const rarityKey = normalizedRarities.join("|");
  const typeKey = normalizedTypes.join("|");
  const normalizedSort = sanitizeCardSort(sortBy);

  const runDefault = React.useCallback(
    async (nextPage: number) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      await waitForNextPaint();
      if (controller.signal.aborted) return;

      try {
        const params = new URLSearchParams({
          mode: "recent",
          page: String(nextPage),
          page_size: String(pageSize),
          sort: normalizedSort,
        });
        normalizedRarities.forEach((rarity) => params.append("rarity", rarity));
        normalizedTypes.forEach((type) => params.append("type", type));

        const res = await fetch(`/api/cards/search?${params.toString()}`, {
          signal: controller.signal,
        });

        const json = (await res.json()) as ApiResponse;
        if (!res.ok) throw new Error(json?.error || "Search failed");

        setResults(json.results ?? []);
        setTotalCount(json.totalCount);
        setQuery("");
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
    [normalizedRarities, normalizedSort, normalizedTypes, pageSize],
  );

  const runSearch = React.useCallback(
    async (nextQuery: string, nextPage: number) => {
      const q = nextQuery.trim();
      if (q.length < 2) {
        setError("Type at least 2 characters.");
        setResults([]);
        setTotalCount(undefined);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      await waitForNextPaint();
      if (controller.signal.aborted) return;

      try {
        const params = new URLSearchParams({
          q,
          page: String(nextPage),
          page_size: String(pageSize),
          sort: normalizedSort,
        });
        normalizedRarities.forEach((rarity) => params.append("rarity", rarity));
        normalizedTypes.forEach((type) => params.append("type", type));

        const res = await fetch(`/api/cards/search?${params.toString()}`, {
          signal: controller.signal,
        });

        const json = (await res.json()) as ApiResponse;
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
    [normalizedRarities, normalizedSort, normalizedTypes, pageSize],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();

    setPage(1);

    if (q.length < 2) {
      setQuery("");
      void runDefault(1);
      return;
    }

    setQuery(q);
    void runSearch(q, 1);
  }

  function onPrev() {
    const nextPage = Math.max(1, page - 1);
    setPage(nextPage);
    if (query.trim().length < 2) void runDefault(nextPage);
    else void runSearch(query, nextPage);
  }

  function onNext() {
    const nextPage = page + 1;
    setPage(nextPage);
    if (query.trim().length < 2) void runDefault(nextPage);
    else void runSearch(query, nextPage);
  }

  const reset = React.useCallback(() => {
    abortRef.current?.abort();
    setInput("");
    setQuery("");
    setPage(1);
    setError(null);
    setResults([]);
    setTotalCount(undefined);
    void runDefault(1);
  }, [runDefault]);

  React.useEffect(() => {
    if (hasLoadedDefaultRef.current) return;
    hasLoadedDefaultRef.current = true;
    void runDefault(1);
  }, [runDefault]);

  React.useEffect(() => {
    if (!hasLoadedDefaultRef.current) return;
    setPage(1);
    if (query.trim().length < 2) void runDefault(1);
    else void runSearch(query, 1);
  }, [normalizedSort, query, rarityKey, typeKey, runDefault, runSearch]);

  return {
    input,
    setInput,
    query,
    page,
    results,
    totalCount,
    loading,
    error,
    onSubmit,
    onPrev,
    onNext,
    pageSize,
    runSearch,
    runDefault,
    reset,
  };
}
