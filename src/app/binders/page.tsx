"use client";

import { getBinderColorSchemeClasses } from "@/config/binderColorSchemes";
import { useAppSelector } from "@/lib/store/storeHooks";
import AddBinderModal from "@/modals/AddBinderModal";
import Link from "next/link";

const binderDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatBinderCreatedAt(createdAt?: string | null) {
  if (!createdAt) return "Unknown";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return binderDateFormatter.format(date);
}

export default function BindersPage() {
  const user = useAppSelector((state) => state.auth.user);
  const binders = useAppSelector((state) => state.binders.items);

  return (
    <div
      className={`flex w-full ${
        binders.length === 0
          ? "min-h-[calc(100vh-var(--header-h))] items-center justify-center"
          : ""
      }`}>
      {binders.length === 0 && (
        <div className="w-full max-w-5xl px-6 py-10 text-center bg-gray-50 border border-zinc-300 rounded-xl shadow-xl backdrop-blur-sm dark:bg-zinc-900/25 dark:border-zinc-500">
          <p className="text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
            Welcome{user?.displayName ? `, ${user.displayName}` : ""}.
          </p>

          <>
            <h1 className="mt-2 text-4xl font-exo font-bold text-zinc-700 dark:text-slate-100">
              Your Binders
            </h1>
            <p className="max-w-xl mx-auto mt-2 text-base font-exo text-zinc-700 dark:text-slate-100">
              This is your dashboard space. Soon you’ll be able to organize,
              track, and showcase your collections here.
            </p>
          </>

          <div className="flex justify-center mt-6">
            {user ? (
              <AddBinderModal />
            ) : (
              <p className="text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
                You need to{" "}
                <Link
                  href="/signin"
                  className="font-bold text-sky-700 underline underline-offset-2">
                  sign in
                </Link>{" "}
                or{" "}
                <Link
                  href="/signin/signup"
                  className="font-bold text-sky-700 underline underline-offset-2">
                  sign up
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      )}
      {binders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 w-full gap-4 my-5 text-left">
          {binders.map((binder) => (
            <Link
              href={`/binders/binder/${binder.id}`}
              key={binder.id}
              className={`group relative min-h-52 overflow-hidden rounded-xl border p-4 font-exo text-zinc-700 shadow-lg dark:text-slate-100 ${
                getBinderColorSchemeClasses(binder.colorScheme).card
              }`}>
              <div className="relative z-10 flex h-full min-h-44 flex-col justify-between">
                <h2 className="text-xl font-semibold tracking-wide">{binder.name}</h2>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-slate-300">
                    Created {formatBinderCreatedAt(binder.createdAt)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-slate-100">
                    {binder.filledCards ?? 0} / {binder.totalSlots ?? 0} cards
                  </p>
                </div>
              </div>
              <div
                className={`pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full blur-2xl ${
                  getBinderColorSchemeClasses(binder.colorScheme).orb
                }`}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 to-transparent dark:from-white/5" />
            </Link>
          ))}
          <div className="relative min-h-52 p-4 text-sm font-exo font-medium text-zinc-700 bg-gray-50 border border-zinc-300 rounded-xl shadow-lg dark:text-slate-100 dark:bg-zinc-900/25 dark:border-zinc-500">
            <div className="flex h-full items-center justify-center">
              <AddBinderModal />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
