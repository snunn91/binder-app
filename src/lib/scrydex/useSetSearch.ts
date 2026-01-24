"use client";

import * as React from "react";

export type SetSearchPreview = {
  id: string;
  name: string;
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

export default function useSetSearch(opts?: {
  setsPageSize?: number;
  cardsPageSize?: number;
}) {
  const setsPageSize = opts?.setsPageSize ?? 12;
  const cardsPageSize = opts?.cardsPageSize ?? 20;

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
    async (nextPage: number) => {
      const controller = abortAndNewController();
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/cards/search?type=sets&mode=recent&page=${nextPage}&page_size=${setsPageSize}`,
          { signal: controller.signal },
        );

        const json = (await res.json()) as SetsApiResponse;
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
    [setsPageSize],
  );

  const runDefaultSetCards = React.useCallback(
    async (setId: string, nextPage: number) => {
      const controller = abortAndNewController();
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/cards/search?mode=recent&set=${encodeURIComponent(
            setId,
          )}&page=${nextPage}&page_size=${cardsPageSize}`,
          { signal: controller.signal },
        );

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
    [cardsPageSize],
  );

  async function runSearchSets(nextQuery: string, nextPage: number) {
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

    try {
      const res = await fetch(
        `/api/cards/search?type=sets&q=${encodeURIComponent(q)}&page=${nextPage}&page_size=${setsPageSize}`,
        { signal: controller.signal },
      );

      const json = (await res.json()) as SetsApiResponse;
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

  async function runSearchSetCards(
    setId: string,
    nextQuery: string,
    nextPage: number,
  ) {
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

    try {
      const res = await fetch(
        `/api/cards/search?q=${encodeURIComponent(q)}&set=${encodeURIComponent(
          setId,
        )}&page=${nextPage}&page_size=${cardsPageSize}`,
        { signal: controller.signal },
      );

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
  }

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
      void runDefaultSets(1);
      return;
    }

    setQuery(q);
    void runSearchSets(q, 1);
  }

  function onPrev() {
    const nextPage = Math.max(1, page - 1);
    setPage(nextPage);

    if (selectedSet) {
      if (query.trim().length < 2)
        void runDefaultSetCards(selectedSet.id, nextPage);
      else void runSearchSetCards(selectedSet.id, query, nextPage);
      return;
    }

    if (query.trim().length < 2) void runDefaultSets(nextPage);
    else void runSearchSets(query, nextPage);
  }

  function onNext() {
    const nextPage = page + 1;
    setPage(nextPage);

    if (selectedSet) {
      if (query.trim().length < 2)
        void runDefaultSetCards(selectedSet.id, nextPage);
      else void runSearchSetCards(selectedSet.id, query, nextPage);
      return;
    }

    if (query.trim().length < 2) void runDefaultSets(nextPage);
    else void runSearchSets(query, nextPage);
  }

  function selectSet(set: SetSearchPreview) {
    clearSearchState();
    setSelectedSet(set);
    void runDefaultSetCards(set.id, 1);
  }

  function backToSets() {
    clearSearchState();
    setSelectedSet(null);
    void runDefaultSets(1);
  }

  // initial load: default sets
  React.useEffect(() => {
    if (hasLoadedDefaultRef.current) return;
    hasLoadedDefaultRef.current = true;
    void runDefaultSets(1);
  }, [runDefaultSets]);

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
