"use client";

type InsideCoverProps = {
  colorScheme?: string;
  binderName?: string;
};

export default function InsideCover({
  colorScheme = "default",
  binderName,
}: InsideCoverProps) {
  const coverColorSchemeClassName =
    {
      default:
        "bg-gray-50 border-zinc-300 dark:bg-zinc-900/25 dark:border-zinc-500",
      red: "bg-red-950/25 border-transparent",
      blue: "bg-blue-950/25 border-transparent",
      green: "bg-green-950/25 border-transparent",
      yellow: "bg-yellow-950/25 border-transparent",
    }[colorScheme] ??
    "bg-gray-50 border-zinc-300 dark:bg-zinc-900/25 dark:border-zinc-500";

  return (
    <div
      className={`${coverColorSchemeClassName} flex justify-center rounded-xl border p-6 shadow-lg`}>
      <p className="text-center text-5xl font-exo font-semibold tracking-wide text-zinc-700 dark:text-slate-100">
        {binderName || "Binder"}
      </p>
    </div>
  );
}
