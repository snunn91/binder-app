"use client";

import * as React from "react";

type CardSearchPreview = {
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

export default function CardSearch() {
  const [input, setInput] = React.useState("");
  const [query, setQuery] = React.useState<string>("");

  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const [results, setResults] = React.useState<CardSearchPreview[]>([]);
  const [totalCount, setTotalCount] = React.useState<number | undefined>(
    undefined
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);

  async function runSearch(nextQuery: string, nextPage: number) {
    const q = nextQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setTotalCount(undefined);
      setError("Type at least 2 characters.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/cards/search?q=${encodeURIComponent(
          q
        )}&page=${nextPage}&page_size=${pageSize}`,
        { signal: controller.signal }
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
    setQuery(q);
    setPage(1);
    void runSearch(q, 1);
  }

  function onPrev() {
    const nextPage = Math.max(1, page - 1);
    setPage(nextPage);
    void runSearch(query, nextPage);
  }

  function onNext() {
    const nextPage = page + 1;
    setPage(nextPage);
    void runSearch(query, nextPage);
  }

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = (page - 1) * pageSize + results.length;
  const hasPrev = page > 1;
  const hasNext =
    totalCount === undefined
      ? results.length === pageSize
      : endIndex < totalCount;

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search cards (e.g. Pikachu)… then press Enter"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md border border-zinc-300 bg-slate-200 px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-slate-100">
          Search
        </button>
      </form>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {query ? (
        <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300">
          <div>
            Results for{" "}
            <span className="font-medium text-zinc-900 dark:text-white">
              {query}
            </span>
            {totalCount !== undefined ? (
              <span className="ml-2 text-zinc-500 dark:text-zinc-400">
                ({totalCount.toLocaleString()} total)
              </span>
            ) : null}
          </div>

          <div className="text-zinc-500 dark:text-zinc-400">
            {results.length > 0 ? (
              <span>
                {startIndex}–{endIndex}
              </span>
            ) : (
              <span>—</span>
            )}
          </div>
        </div>
      ) : null}

      {loading ? <div className="text-sm text-zinc-500">Searching…</div> : null}

      {!loading && query && results.length === 0 && !error ? (
        <div className="text-sm text-zinc-500">No results.</div>
      ) : null}

      {results.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((card) => (
              <div
                key={card.id}
                className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <div className="aspect-[63/88] w-full bg-zinc-100 dark:bg-zinc-800">
                  {card.image?.small ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.image.small}
                      alt={card.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                      No image
                    </div>
                  )}
                </div>

                <div className="space-y-0.5 p-2">
                  <div className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                    {card.name}
                  </div>
                  <div className="truncate text-xs text-zinc-500">
                    {card.expansion?.name ?? "Unknown set"}
                    {card.number ? ` • #${card.number}` : ""}
                    {card.rarity ? ` • ${card.rarity}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onPrev}
              disabled={!hasPrev || loading}
              className="rounded-md border border-zinc-300 bg-slate-200 px-3 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-slate-100">
              Prev
            </button>

            <div className="text-sm text-zinc-600 dark:text-zinc-300">
              Page <span className="font-medium">{page}</span>
            </div>

            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext || loading}
              className="rounded-md border border-zinc-300 bg-slate-200 px-3 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-slate-100">
              Next
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
