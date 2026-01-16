"use client";

export default function useSetSearch() {
  return {
    input: "",
    setInput: (_value: string) => undefined,
    query: "",
    page: 1,
    results: [],
    totalCount: undefined,
    loading: false,
    error: null,
    onSubmit: (_event: React.FormEvent) => undefined,
    onPrev: () => undefined,
    onNext: () => undefined,
    pageSize: 20,
    runSearch: (_query: string, _page: number) => undefined,
  };
}
