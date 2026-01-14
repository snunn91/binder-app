"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/lib/store/storeHooks";
import {
  fetchBinderById,
  fetchBinderPages,
} from "@/lib/firebase/services/binderService";

type BinderPage = {
  id: string;
  index: number;
  slots: number;
  cardOrder: (string | null)[];
};

export default function BinderDetailPage() {
  const params = useParams<{ binderId: string }>();
  const binderId = params?.binderId;
  const user = useAppSelector((state) => state.auth.user);
  const [binder, setBinder] = useState<{
    id: string;
    name: string;
    layout: string;
    theme: string;
  } | null>(null);
  const [pages, setPages] = useState<BinderPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !binderId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const [binderData, pagesData] = await Promise.all([
        fetchBinderById(user.uid, binderId),
        fetchBinderPages(user.uid, binderId),
      ]);
      if (!mounted) return;
      setBinder(binderData);
      setPages(pagesData);
      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [binderId, user]);

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-h))] items-center justify-center">
        <div className="w-full max-w-3xl px-6 py-10 text-center bg-gray-50 border border-zinc-300 rounded-xl shadow-xl backdrop-blur-sm dark:bg-zinc-900/25 dark:border-zinc-500">
          <p className="text-base font-exo font-medium text-zinc-700 dark:text-slate-100">
            Please sign in to view this binder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      <div className="w-full px-6 py-10 bg-gray-50 border border-zinc-300 rounded-xl shadow-xl backdrop-blur-sm dark:bg-zinc-900/25 dark:border-zinc-500">
        <p className="text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
          Binder
        </p>
        <h1 className="mt-2 text-3xl font-exo font-bold text-zinc-700 dark:text-slate-100">
          {binder?.name ?? "Loading..."}
        </h1>
        <p className="mt-2 text-sm font-exo text-zinc-700 dark:text-slate-100">
          Layout: {binder?.layout ?? "—"} · Theme: {binder?.theme ?? "—"}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {loading && (
          <div className="p-4 text-sm font-exo text-zinc-700 dark:text-slate-100">
            Loading pages...
          </div>
        )}
        {!loading &&
          pages.map((page) => (
            <div
              key={page.id}
              className="p-4 bg-gray-50 border border-zinc-300 rounded-xl shadow-lg dark:bg-zinc-900/25 dark:border-zinc-500">
              <p className="text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
                Page {page.index}
              </p>
              <p className="mt-1 text-sm font-exo text-zinc-700 dark:text-slate-100">
                Slots: {page.slots}
              </p>
              <p className="mt-1 text-xs font-exo text-zinc-700 dark:text-slate-100">
                Cards: {page.cardOrder.filter(Boolean).length} / {page.slots}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
