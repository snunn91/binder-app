"use client";

import { useAppSelector } from "@/lib/storeHooks";

export default function BindersPage() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center py-16">
      <div className="w-full max-w-3xl rounded-xl border border-zinc-300 bg-gray-50 px-6 py-10 text-center shadow-xl backdrop-blur-sm dark:border-zinc-500 dark:bg-zinc-900/25">
        <p className="text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
          Welcome{user?.displayName ? `, ${user.displayName}` : ""}.
        </p>
        <h1 className="mt-2 text-3xl font-exo font-bold text-zinc-700 dark:text-slate-100">
          Your Binders
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base font-exo text-zinc-700 dark:text-slate-100">
          This is your dashboard space. Soon you’ll be able to organize,
          track, and showcase your collections here.
        </p>
      </div>
    </div>
  );
}
