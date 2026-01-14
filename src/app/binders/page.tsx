"use client";

import { useAppSelector } from "@/lib/store/storeHooks";
import AddBinderModal from "@/components/AddBinderModal";
import Link from "next/link";

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 w-full gap-4 my-5 text-left">
          {binders.map((binder) => (
            <Link
              href={`/binders/binder/${binder.id}`}
              key={binder.id}
              className="relative min-h-52 p-4 text-sm font-exo font-medium text-white bg-red-500 rounded-xl shadow-lg">
              {binder.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
