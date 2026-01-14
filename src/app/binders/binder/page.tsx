"use client";

import { useAppSelector } from "@/lib/store/storeHooks";
import AddBinderModal from "@/components/AddBinderModal";
import Link from "next/link";
import Image from "next/image";

export default function BindersPage() {
  const user = useAppSelector((state) => state.auth.user);
  const binders = useAppSelector((state) => state.binders.items);
  const themeClasses: Record<string, string> = {
    "pokeball-theme": "",
    "flareon-theme": "",
    "jolteon-theme": "",
    "vaporeon-theme": "",
  };

  const themeImages: Record<
    string,
    { light: string; dark: string; alt: string }
  > = {
    "pokeball-theme": {
      light: "/assets/binderImages/pokeball-final.png",
      dark: "/assets/binderImages/pokeball-final-inv.png",
      alt: "Pokeball theme",
    },
    "flareon-theme": {
      light: "/assets/binderImages/flareon-final.png",
      dark: "/assets/binderImages/flareon-final-inv.png",
      alt: "Flareon theme",
    },
    "jolteon-theme": {
      light: "/assets/binderImages/jolteon-final.png",
      dark: "/assets/binderImages/jolteon-final-inv.png",
      alt: "Jolteon theme",
    },
    "vaporeon-theme": {
      light: "/assets/binderImages/vaporeon-final.png",
      dark: "/assets/binderImages/vaporeon-final-inv.png",
      alt: "Vaporeon theme",
    },
  };

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
        <div className="grid grid-cols-2 md:grid-cols-3 w-full gap-4 my-5 text-left">
          {binders.map((binder) => (
            <Link
              href={`/binders/binder/${binder.id}`}
              key={binder.id}
              className="relative min-h-52 p-4 text-sm font-exo font-medium text-zinc-700 bg-gray-50 border border-zinc-300 rounded-xl shadow-lg overflow-hidden dark:text-slate-100 dark:bg-zinc-900/25 dark:border-zinc-500">
              <span>{binder.name}</span>
              <div className="absolute -top-10 -right-16 w-64 h-64 overflow-hidden ">
                <Image
                  src={
                    themeImages[binder.theme]?.light ??
                    themeImages["pokeball-theme"].light
                  }
                  alt={themeImages[binder.theme]?.alt ?? "Binder theme"}
                  fill
                  className="block object-contain dark:hidden"
                />
                <Image
                  src={
                    themeImages[binder.theme]?.dark ??
                    themeImages["pokeball-theme"].dark
                  }
                  alt={themeImages[binder.theme]?.alt ?? "Binder theme"}
                  fill
                  className="hidden object-contain dark:block"
                />
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
