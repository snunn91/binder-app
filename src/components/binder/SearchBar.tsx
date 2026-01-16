"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  loading: boolean;
  mode: "cards" | "sets";
  placeholder?: string;
};

const placeholders: Record<SearchBarProps["mode"], string> = {
  cards: "Search cards (e.g. Pikachu)… then press Enter",
  sets: "Search sets (e.g. Base Set)… then press Enter",
};

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  loading,
  mode,
  placeholder,
}: SearchBarProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? placeholders[mode]}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md border border-zinc-300 bg-slate-200 px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-slate-100">
        Search
      </button>
    </form>
  );
}
