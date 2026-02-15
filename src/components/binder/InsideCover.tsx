"use client";

type InsideCoverProps = {
  colorScheme?: string;
};

export default function InsideCover({ colorScheme = "default" }: InsideCoverProps) {
  const coverColorSchemeClassName = {
    default: "bg-gray-50 border-zinc-300 dark:bg-zinc-900/25 dark:border-zinc-500",
    red: "bg-red-950/25 border-transparent",
    blue: "bg-blue-950/25 border-transparent",
    green: "bg-green-950/25 border-transparent",
    yellow: "bg-yellow-950/25 border-transparent",
  }[colorScheme] ?? "bg-gray-50 border-zinc-300 dark:bg-zinc-900/25 dark:border-zinc-500";

  return (
    <div className={`${coverColorSchemeClassName} rounded-xl border shadow-lg`} />
  );
}
