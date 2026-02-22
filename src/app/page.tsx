"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppSelector } from "@/lib/store/storeHooks";

type ScreenshotProps = {
  title: string;
  description: string;
  lightSrc: string;
  darkSrc: string;
  priority?: boolean;
  reverse?: boolean;
  imageSizeClassName?: string;
};

function ScreenshotCard({
  title,
  description,
  lightSrc,
  darkSrc,
  priority = false,
  reverse = false,
  imageSizeClassName,
}: ScreenshotProps) {
  return (
    <section className="grid items-center gap-x-8 gap-y-4 md:grid-cols-2">
      <div
        className={`${
          reverse
            ? "md:order-2 md:justify-self-start"
            : "md:order-1 md:justify-self-end"
        } ${imageSizeClassName ?? ""}`}>
        <div className="relative w-full">
          <Image
            src={lightSrc}
            alt={title}
            width={1706}
            height={1032}
            priority={priority}
            className="relative z-10 h-auto w-full rounded-xl object-cover opacity-92 saturate-[0.96] dark:hidden"
          />
          <Image
            src={darkSrc}
            alt={title}
            width={1706}
            height={1032}
            priority={priority}
            className="relative z-10 hidden h-auto w-full rounded-xl object-cover opacity-90 saturate-[0.92] dark:block"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-t from-slate-50 to-transparent dark:from-zinc-800" />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 bg-gradient-to-b from-slate-50 to-transparent dark:from-zinc-800" />
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-12 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-zinc-800/45" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-12 bg-gradient-to-l from-slate-50/50 to-transparent dark:from-zinc-800/45" />
          <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-br from-white/16 via-transparent to-transparent dark:from-white/8" />
        </div>
      </div>

      <div
        className={`space-y-2 ${
          reverse
            ? "md:order-1 md:justify-self-end"
            : "md:order-2 md:justify-self-start"
        }`}>
        <h2 className="text-3xl font-exo font-semibold text-zinc-800 dark:text-slate-100 md:text-4xl">
          {title}
        </h2>
        <p className="text-sm font-exo text-zinc-600 dark:text-zinc-300 md:max-w-xs">
          {description}
        </p>
      </div>
    </section>
  );
}

export default function Home() {
  const user = useAppSelector((state) => state.auth.user);
  const ctaHref = user ? "/binders" : "/signin/signup";
  const ctaLabel = user ? "Open Binders" : "Sign Up";

  return (
    <div className="relative overflow-hidden pb-12 pt-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-18rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.34)_0%,rgba(125,211,252,0.16)_34%,rgba(125,211,252,0.06)_55%,transparent_74%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(56,189,248,0.30)_0%,rgba(56,189,248,0.14)_36%,rgba(56,189,248,0.05)_58%,transparent_76%)]" />
        <div className="absolute left-[20%] top-[-8rem] h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.20)_0%,transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(6,182,212,0.18)_0%,transparent_72%)]" />
        <div className="absolute right-[18%] top-[-7rem] h-[19rem] w-[19rem] rounded-full bg-[radial-gradient(circle,rgba(186,230,253,0.20)_0%,transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(56,189,248,0.16)_0%,transparent_72%)]" />
      </div>

      <section className="mx-auto max-w-5xl px-4 text-center">
        <p className="text-xs font-exo font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Binder App
        </p>
        <h1 className="mt-3 text-4xl font-exo font-bold text-zinc-800 dark:text-slate-100 md:text-5xl">
          Build Your Pokemon Collection, Beautifully
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-exo text-zinc-600 dark:text-zinc-300">
          Search cards in seconds, build your binder page by page, and curate
          your collection with a workflow that stays fast and intuitive.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href={ctaHref}
            className="relative flex items-center overflow-hidden rounded-full border border-accent bg-accent px-5 py-2 text-sm font-exo font-medium text-white shadow-lg transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
            {ctaLabel}
          </Link>
        </div>
      </section>

      <div className="mx-auto mt-20 grid max-w-8xl gap-8 px-4">
        <ScreenshotCard
          title="Search Cards and Sets"
          description="Quickly search cards and sets, then add picks directly to your binder or stage them in the Bulk Box for later."
          lightSrc="/assets/img/search.png"
          darkSrc="/assets/img/search-dark.png"
          priority
        />

        <ScreenshotCard
          title="Design Each Page Your Way"
          description="Arrange cards exactly how you want and manage every slot with quick actions."
          lightSrc="/assets/img/edit-binder.png"
          darkSrc="/assets/img/edit-binder-dark.png"
          reverse
          imageSizeClassName="md:max-w-[65%]"
        />

        <ScreenshotCard
          title="Drag, Drop, and Curate"
          description="Move cards naturally with drag-and-drop to shape each binder page exactly how you want it."
          lightSrc="/assets/img/drag-drop-v2.png"
          darkSrc="/assets/img/drag-drop-dark-2.png"
        />
      </div>
    </div>
  );
}
