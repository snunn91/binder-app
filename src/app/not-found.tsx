"use client";

import Lottie from "lottie-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.classList.contains("dark"));
    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    const animationPath = isDark
      ? "/assets/lotties/sleeping-snorlax-dark.json"
      : "/assets/lotties/sleeping-snorlax.json";

    void fetch(animationPath)
      .then((response) => response.json())
      .then((data) => {
        if (active) setAnimationData(data as object);
      })
      .catch(() => {
        if (active) setAnimationData(null);
      });

    return () => {
      active = false;
    };
  }, [isDark]);

  return (
    <section className="flex min-h-full items-center justify-center py-4">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-4 px-6 py-8 text-center">
        <div className="w-full max-w-sm">
          {animationData ? (
            <Lottie animationData={animationData} loop autoplay />
          ) : (
            <div className="aspect-square w-full rounded-xl bg-zinc-200/60 dark:bg-zinc-800/70" />
          )}
        </div>

        <h1 className="text-3xl font-exo font-bold text-zinc-700 dark:text-slate-100">
          404: Wild Snorlax Is Blocking This Route
        </h1>
        <p className="max-w-md text-sm font-exo text-zinc-600 dark:text-slate-300">
          The page fled before you could throw a Poke Ball. Head back to your
          binder and keep your collection journey going.
        </p>

        <Link
          href="/binders"
          className="relative flex items-center overflow-hidden rounded-full border border-zinc-300 bg-slate-200 px-4 py-2 text-sm font-exo font-medium text-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 before:transition-all before:duration-500 hover:text-slate-100 hover:before:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:before:bg-slate-100 dark:hover:text-zinc-700">
          <span className="relative z-10">Back to Binders</span>
        </Link>
      </div>
    </section>
  );
}
