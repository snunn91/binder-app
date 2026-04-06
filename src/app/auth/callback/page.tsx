"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import RouteLoading from "@/components/RouteLoading";
import { supabase } from "@/lib/supabase/client";

function normalizeNextPath(rawNext: string | null): string {
  if (!rawNext) return "/binders";
  try {
    const url = new URL(rawNext, "https://dummy.invalid");
    if (url.origin !== "https://dummy.invalid") return "/binders";
    const path = url.pathname;
    if (!path.startsWith("/") || path.startsWith("//")) return "/binders";
    return path;
  } catch {
    return "/binders";
  }
}

function parseErrorMessage(rawError: string | null) {
  if (!rawError) return null;
  try {
    return decodeURIComponent(rawError.replace(/\+/g, " "));
  } catch {
    return rawError;
  }
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(
    () => normalizeNextPath(searchParams.get("next")),
    [searchParams],
  );

  useEffect(() => {
    let mounted = true;

    const finishAuth = async () => {
      const authError =
        parseErrorMessage(searchParams.get("error_description")) ??
        parseErrorMessage(searchParams.get("error"));
      if (authError) {
        if (!mounted) return;
        setError(authError);
        return;
      }

      const code = searchParams.get("code");

      try {
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
          if (!mounted) return;
        }

        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        if (data.session) {
          router.replace(nextPath);
          return;
        }

        router.replace("/signin?confirmed=1");
      } catch (e) {
        if (!mounted) return;
        setError((e as Error)?.message ?? "Could not complete sign-in.");
      }
    };

    void finishAuth();

    return () => {
      mounted = false;
    };
  }, [nextPath, router, searchParams]);

  if (!error) {
    return <RouteLoading message="Finishing your sign-in..." />;
  }

  return (
    <div className="flex min-h-[calc(100vh-var(--header-h)-169px)] items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-xl border border-zinc-300 bg-gray-50 p-6 text-center shadow-xl dark:border-zinc-500 dark:bg-zinc-900/25">
        <h1 className="text-xl font-nunito font-bold text-zinc-700 dark:text-slate-100">
          Confirmation link failed
        </h1>
        <p className="mt-2 text-sm font-nunito font-medium text-red-400">
          {error}
        </p>
        <p className="mt-4 text-sm font-nunito text-zinc-700 dark:text-slate-100">
          Try signing in manually or request a new confirmation link.
        </p>
        <div className="mt-4">
          <Link
            href="/signin"
            className="font-bold text-sky-700 underline underline-offset-2">
            Go to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
