"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useAppSelector } from "@/lib/store/storeHooks";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  Search,
  BookOpen,
  Target,
  GripVertical,
  Wand2,
  BarChart2,
  Layers,
} from "lucide-react";

// ─── Shared animation constants ───────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const;

const stagger = (delay = 0.1) => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay } },
});

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

// ─── Screenshot section ────────────────────────────────────────────────────────

type ScreenshotSectionProps = {
  step: string;
  title: string;
  description: string;
  lightSrc: string;
  darkSrc: string;
  priority?: boolean;
  reverse?: boolean;
  imageClassName?: string;
};

function ScreenshotSection({
  step,
  title,
  description,
  lightSrc,
  darkSrc,
  priority = false,
  reverse = false,
  imageClassName,
}: ScreenshotSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const imageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [18, -18]);

  const slideImage = {
    hidden: { opacity: 0, x: reverse ? 40 : -40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.75, ease } },
  };
  const slideText = {
    hidden: { opacity: 0, x: reverse ? -40 : 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.75, ease } },
  };

  return (
    <motion.div
      className="grid items-center gap-x-12 gap-y-6 md:grid-cols-2"
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView={shouldReduceMotion ? undefined : "visible"}
      viewport={{ once: true, margin: "-80px" }}
      variants={shouldReduceMotion ? undefined : stagger(0.15)}>
      {/* Image */}
      <motion.div
        ref={imageRef}
        variants={shouldReduceMotion ? undefined : slideImage}
        className={`${reverse ? "md:order-2" : "md:order-1"} ${imageClassName ?? ""}`}>
        <div className="relative overflow-hidden rounded-2xl">
          <motion.div
            style={shouldReduceMotion ? undefined : { y }}
            className="will-change-transform">
            <Image
              src={lightSrc}
              alt={title}
              width={1706}
              height={1032}
              priority={priority}
              className="h-auto w-full object-cover opacity-[0.92] saturate-[0.96] dark:hidden"
            />
            <Image
              src={darkSrc}
              alt={title}
              width={1706}
              height={1032}
              priority={priority}
              className="hidden h-auto w-full object-cover opacity-90 saturate-[0.92] dark:block"
            />
          </motion.div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-slate-50 to-transparent dark:from-zinc-800" />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-slate-50 to-transparent dark:from-zinc-800" />
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-gradient-to-r from-slate-50/60 to-transparent dark:from-zinc-800/50" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-l from-slate-50/60 to-transparent dark:from-zinc-800/50" />
        </div>
      </motion.div>

      {/* Text */}
      <motion.div
        variants={shouldReduceMotion ? undefined : slideText}
        className={`space-y-3 ${reverse ? "md:order-1" : "md:order-2"}`}>
        <p className="font-exo text-xs font-semibold uppercase tracking-widest text-accent">
          {step}
        </p>
        <h2 className="font-exo text-3xl font-bold text-zinc-800 dark:text-slate-100 md:text-4xl">
          {title}
        </h2>
        <p className="font-exo text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 md:max-w-sm">
          {description}
        </p>
      </motion.div>
    </motion.div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border border-zinc-200/80 bg-white/60 p-5 backdrop-blur-sm transition-colors hover:border-accent/30 hover:bg-white/90 dark:border-zinc-700/50 dark:bg-zinc-700/30 dark:hover:border-accent/30 dark:hover:bg-zinc-700/50">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
        {icon}
      </div>
      <h3 className="mb-1 font-exo text-sm font-semibold text-zinc-800 dark:text-slate-100">
        {title}
      </h3>
      <p className="font-exo text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const shouldReduceMotion = useReducedMotion();
  const user = useAppSelector((state) => state.auth.user);
  const ctaHref = user ? "/binders" : "/signin/signup";
  const ctaLabel = user ? "Open Binders" : "Get Started Free";

  return (
    <div className="relative overflow-hidden">
      {/* ── Animated background blobs ── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute left-1/2 top-[-20rem] h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.38)_0%,rgba(125,211,252,0.16)_40%,transparent_70%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(56,189,248,0.30)_0%,rgba(56,189,248,0.12)_40%,transparent_70%)]"
          animate={
            shouldReduceMotion
              ? {}
              : { scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }
          }
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute left-[12%] top-[-8rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.22)_0%,transparent_68%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(6,182,212,0.18)_0%,transparent_70%)]" />
        <div className="absolute right-[10%] top-[-6rem] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(186,230,253,0.24)_0%,transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(56,189,248,0.16)_0%,transparent_72%)]" />
      </div>

      {/* ── Hero ── */}
      <motion.section
        className="mx-auto max-w-4xl px-4 pb-8 pt-10 text-center"
        initial={shouldReduceMotion ? false : "hidden"}
        animate={shouldReduceMotion ? undefined : "visible"}
        variants={shouldReduceMotion ? undefined : stagger(0.1)}>
        {/* Logo */}
        <motion.div
          variants={shouldReduceMotion ? undefined : fadeUp}
          className="mb-5 flex justify-center">
          <Image
            src="/assets/img/logo-light.png"
            alt="Binder"
            width={793}
            height={231}
            priority
            className="h-10 w-auto dark:hidden md:h-12"
          />
          <Image
            src="/assets/img/logo-dark.png"
            alt="Binder"
            width={793}
            height={231}
            priority
            className="hidden h-10 w-auto dark:block md:h-12"
          />
        </motion.div>

        {/* Badge */}
        <motion.div
          variants={shouldReduceMotion ? undefined : fadeUp}
          className="mb-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/[0.08] px-3.5 py-1.5 font-exo text-xs font-medium text-accent dark:bg-accent/[0.12]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Free to use · No credit card required
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={shouldReduceMotion ? undefined : fadeUp}
          className="text-4xl font-exo font-bold leading-tight text-zinc-800 dark:text-slate-100 md:text-6xl">
          Build Your Pokémon
          <br className="hidden md:block" /> Collection,{" "}
          <span className="relative inline-block">
            <span className="relative z-10 text-accent">Beautifully</span>
            <span className="pointer-events-none absolute inset-x-0 bottom-0.5 -z-10 h-3 rounded-full bg-accent/15 blur-sm" />
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={shouldReduceMotion ? undefined : fadeUp}
          className="mx-auto mt-5 max-w-lg font-exo text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 md:text-base">
          Less bulk box, more bangers. Search any card, build your pages, and
          track your progress toward the perfect collection — all in one place.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={shouldReduceMotion ? undefined : fadeUp}
          className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ctaHref}
            className="relative overflow-hidden rounded-full border border-accent bg-accent px-6 py-2.5 font-exo text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
            {ctaLabel}
          </Link>
        </motion.div>
      </motion.section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        className="mx-auto mt-20 max-w-5xl scroll-mt-20 px-4">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease }}
          className="mb-12 text-center">
          <p className="mb-2 font-exo text-xs font-semibold uppercase tracking-widest text-accent">
            How It Works
          </p>
          <h2 className="font-exo text-2xl font-bold text-zinc-800 dark:text-slate-100 md:text-3xl">
            Three steps to your perfect binder
          </h2>
        </motion.div>

        <motion.div
          className="relative grid gap-10 md:grid-cols-3 md:gap-6"
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={{ once: true, margin: "-60px" }}
          variants={shouldReduceMotion ? undefined : stagger(0.15)}>
          {/* Connecting line — desktop only */}
          <div
            className="pointer-events-none absolute left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] top-[1.2rem] hidden h-px text-zinc-300 dark:text-zinc-600 md:block"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, currentColor 0px, currentColor 4px, transparent 4px, transparent 12px)",
              backgroundSize: "12px 1px",
              animation: shouldReduceMotion
                ? undefined
                : "dash-flow 0.6s linear infinite",
            }}
          />

          {(
            [
              {
                n: "1",
                icon: <Search className="h-5 w-5" />,
                title: "Search Any Card",
                desc: "Browse the full Pokémon TCG catalog. Filter by set, rarity, or type to find exactly the cards you want.",
              },
              {
                n: "2",
                icon: <BookOpen className="h-5 w-5" />,
                title: "Build Your Binder",
                desc: "Add cards to binder pages — up to 9 per page, just like a real sleeve. Manage as many binders as you like.",
              },
              {
                n: "3",
                icon: <Target className="h-5 w-5" />,
                title: "Curate & Track",
                desc: "Drag cards to rearrange, set completion goals, and watch your collection come together page by page.",
              },
            ] as const
          ).map(({ n, icon, title, desc }) => (
            <motion.div
              key={n}
              variants={shouldReduceMotion ? undefined : fadeUp}
              className="flex flex-col items-center gap-3 text-center">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-md shadow-accent/30">
                {icon}
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 font-exo text-[9px] font-bold text-white dark:bg-zinc-950">
                  {n}
                </span>
              </div>
              <div>
                <h3 className="font-exo text-sm font-semibold text-zinc-800 dark:text-slate-100">
                  {title}
                </h3>
                <p className="mt-1 font-exo text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Screenshot Sections ── */}
      <div className="mx-auto mt-24 max-w-6xl space-y-24 px-4">
        <ScreenshotSection
          step="01 — Discover"
          title="Search Cards and Sets"
          description="Quickly search any card across the full Pokémon TCG catalog. Filter by set, rarity, and type — then add your picks directly to a binder page or stage them in the Bulk Box for later."
          lightSrc="/assets/img/search.png"
          darkSrc="/assets/img/search-dark.png"
          priority
        />
        <ScreenshotSection
          step="02 — Organise"
          title="Design Each Page Your Way"
          description="Every slot is yours to control. Add cards, rearrange them, and manage each page until the layout looks exactly right — whether you're building themed pages or tracking full-set runs."
          lightSrc="/assets/img/edit-binder.png"
          darkSrc="/assets/img/edit-binder-dark.png"
          reverse
          imageClassName="md:max-w-[68%] md:justify-self-start"
        />
        <ScreenshotSection
          step="03 — Curate"
          title="Drag, Drop, and Perfect It"
          description="Rearrange cards naturally with smooth drag-and-drop. Pick up any card and place it exactly where it belongs — swap positions, fill gaps, and shape each page until it's just right."
          lightSrc="/assets/img/drag-drop-v2.png"
          darkSrc="/assets/img/drag-drop-dark-2.png"
        />
      </div>

      {/* ── Features Grid ── */}
      <section className="mx-auto mt-28 max-w-5xl px-4">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease }}
          className="mb-10 text-center">
          <p className="mb-2 font-exo text-xs font-semibold uppercase tracking-widest text-accent">
            Features
          </p>
          <h2 className="font-exo text-2xl font-bold text-zinc-800 dark:text-slate-100 md:text-3xl">
            Everything a collector needs
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 gap-4 md:grid-cols-3"
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={{ once: true, margin: "-60px" }}
          variants={shouldReduceMotion ? undefined : stagger(0.08)}>
          <FeatureCard
            icon={<Search className="h-4 w-4" />}
            title="Smart Search"
            description="Find any card from any set instantly with fast, filtered search across the full TCG catalog."
          />
          <FeatureCard
            icon={<GripVertical className="h-4 w-4" />}
            title="Drag & Drop"
            description="Rearrange cards naturally — pick up, move, and drop into any slot with smooth interactions."
          />
          <FeatureCard
            icon={<Wand2 className="h-4 w-4" />}
            title="AI Suggestions"
            description="Let AI suggest the perfect cards to fill out your binder theme or complete a set."
          />
          <FeatureCard
            icon={<Target className="h-4 w-4" />}
            title="Goal Tracking"
            description="Set completion targets for each binder and track your progress toward the full collection."
          />
          <FeatureCard
            icon={<Layers className="h-4 w-4" />}
            title="Multiple Binders"
            description="Keep separate binders for different sets, eras, or collection themes — all in one account."
          />
          <FeatureCard
            icon={<BarChart2 className="h-4 w-4" />}
            title="Collection Value"
            description="Track the estimated market value of the cards across your binder at a glance."
          />
        </motion.div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto mb-16 mt-24 max-w-3xl px-4 text-center">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/[0.07] via-transparent to-sky-200/20 px-8 py-16 dark:from-accent/[0.12] dark:to-sky-900/20">
          {/* Decorative blobs inside card */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.28)_0%,transparent_70%)] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.18)_0%,transparent_70%)] blur-2xl" />

          <p className="mb-2 font-exo text-xs font-semibold uppercase tracking-widest text-accent">
            Ready to start?
          </p>
          <h2 className="mb-3 font-exo text-3xl font-bold text-zinc-800 dark:text-slate-100 md:text-4xl">
            Build your perfect binder today
          </h2>
          <p className="mx-auto mb-8 max-w-md font-exo text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Join collectors building beautiful, organised digital binders — free
            to start, no credit card required.
          </p>
          <Link
            href={ctaHref}
            className="inline-flex items-center rounded-full border border-accent bg-accent px-7 py-3 font-exo text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
            {ctaLabel}
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
