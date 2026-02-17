export type BinderColorScheme = "default" | "red" | "blue" | "green" | "yellow";

type BinderColorSchemeClasses = {
  panel: string;
  card: string;
  orb: string;
};

export const binderColorSchemeClasses: Record<
  BinderColorScheme,
  BinderColorSchemeClasses
> = {
  default: {
    panel: "bg-gray-50 border-zinc-300 dark:bg-zinc-900/25 dark:border-zinc-500",
    card: "bg-gray-50 border-zinc-300 dark:bg-zinc-900/25 dark:border-zinc-500",
    orb: "bg-zinc-300/35 dark:bg-zinc-700/35",
  },
  red: {
    panel: "bg-red-400 border-red-500 dark:bg-red-800/30 dark:border-red-500/45",
    card: "bg-red-400 border-red-500 dark:bg-red-800/30 dark:border-red-500/45",
    orb: "bg-red-600/50 dark:bg-red-400/35",
  },
  blue: {
    panel: "bg-blue-200 border-blue-300 dark:bg-sky-800/25 dark:border-sky-700/40",
    card: "bg-blue-200 border-blue-300 dark:bg-sky-800/25 dark:border-sky-700/40",
    orb: "bg-blue-600/45 dark:bg-sky-400/30",
  },
  green: {
    panel:
      "bg-green-200 border-green-300 dark:bg-emerald-900/25 dark:border-emerald-700/40",
    card: "bg-green-200 border-green-300 dark:bg-emerald-900/25 dark:border-emerald-700/40",
    orb: "bg-green-500/40 dark:bg-emerald-500/30",
  },
  yellow: {
    panel: "bg-yellow-200 border-yellow-300 dark:bg-yellow-500/25 dark:border-yellow-300/45",
    card: "bg-yellow-200 border-yellow-300 dark:bg-yellow-500/25 dark:border-yellow-300/45",
    orb: "bg-yellow-500/60 dark:bg-yellow-300/40",
  },
};

export function getBinderColorSchemeClasses(colorScheme?: string) {
  return (
    binderColorSchemeClasses[colorScheme as BinderColorScheme] ??
    binderColorSchemeClasses.default
  );
}
