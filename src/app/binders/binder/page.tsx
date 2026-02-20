"use client";

import { getBinderColorSchemeClasses } from "@/config/binderColorSchemes";
import { useAppSelector } from "@/lib/store/storeHooks";
import AddBinderModal from "@/modals/AddBinderModal";
import Link from "next/link";

export default function BindersPage() {
  const user = useAppSelector((state) => state.auth.user);
  const binders = useAppSelector((state) => state.binders.items);

  return (
    <div
      className={`flex w-full px-[10px] md:px-0 ${
        binders.length === 0
          ? "min-h-[calc(100vh-var(--header-h)-169px)] items-center justify-center"
          : ""
      }`}>
      {binders.length === 0 && (
        <div className="w-full max-w-5xl px-6 py-10 text-center bg-gray-50 border border-zinc-300 rounded-xl shadow-xl backdrop-blur-sm dark:bg-zinc-900/25 dark:border-zinc-500">
          <p className="text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
            Welcome{user?.displayName ? `, ${user.displayName}` : ""}.
          </p>

          <>
            <h1 className="mt-2 text-3xl font-exo font-bold text-zinc-700 dark:text-slate-100">
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
        <div className="grid w-full grid-cols-1 gap-4 py-5 text-left [@media(max-width:767px)_and_(orientation:landscape)]:grid-cols-2 md:grid-cols-3">
          {binders.map((binder) => (
            <Link
              href={`/binders/binder/${binder.id}`}
              key={binder.id}
              className={`relative min-h-52 overflow-hidden rounded-xl border p-4 text-sm font-exo font-medium text-zinc-700 shadow-lg dark:text-slate-100 ${
                getBinderColorSchemeClasses(binder.colorScheme).card
              }`}>
              <span>{binder.name}</span>
              <div
                className={`pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full blur-2xl ${
                  getBinderColorSchemeClasses(binder.colorScheme).orb
                }`}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 to-transparent dark:from-white/5" />
              <div className="absolute bottom-4 right-4 rounded-full border border-zinc-300/60 bg-white/60 px-2 py-0.5 text-xs capitalize dark:border-zinc-600/60 dark:bg-zinc-900/50">
                {binder.colorScheme ?? "default"}
              </div>
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
