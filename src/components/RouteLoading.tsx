"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";

type RouteLoadingProps = {
  message?: string;
};

export default function RouteLoading({
  message = "Loading your page...",
}: RouteLoadingProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    let active = true;

    void fetch("/assets/lotties/pikachu-loading.json")
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
  }, []);

  return (
    <section className="flex min-h-full items-center justify-center py-4">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-2 px-6 py-8 text-center">
        <div className="w-full max-w-[220px]">
          {animationData ? (
            <Lottie animationData={animationData} loop autoplay />
          ) : (
            <div className="aspect-square w-full rounded-xl bg-zinc-200/60 dark:bg-zinc-800/70" />
          )}
        </div>
        <p className="text-sm font-nunito font-medium text-zinc-700 dark:text-slate-100">
          {message}
        </p>
      </div>
    </section>
  );
}
