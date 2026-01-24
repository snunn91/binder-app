"use client";

import * as React from "react";

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

export default function useCardSearch(pageSize = 24) {
  const [input, setInput] = React.useState("");
  const [query, setQuery] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [results, setResults] = React.useState<CardSearchPreview[]>([]);
  const [totalCount, setTotalCount] = React.useState<number | undefined>(
    undefined,
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);
  const hasLoadedDefaultRef = React.useRef(false);

  const runDefault = React.useCallback(
    async (nextPage: number) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/cards/search?mode=recent&page=${nextPage}&page_size=${pageSize}`,
          { signal: controller.signal },
        );

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
    [pageSize],
  );

  async function runSearch(nextQuery: string, nextPage: number) {
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

    try {
      const res = await fetch(
        `/api/cards/search?q=${encodeURIComponent(q)}&page=${nextPage}&page_size=${pageSize}`,
        { signal: controller.signal },
      );

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
  }

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
