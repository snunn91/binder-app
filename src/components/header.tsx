"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { logOut } from "@/lib/firebase/auth";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logOut();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="w-full border-b border-zinc-200/60 bg-white/70 px-6 py-4 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-950/60">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="text-lg font-exo font-semibold text-zinc-800 dark:text-zinc-100">
          Binder
        </Link>

        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-full border border-zinc-700 bg-zinc-700 px-5 py-2 text-sm font-exo font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-100 dark:bg-slate-100 dark:text-zinc-800 dark:hover:bg-white">
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        ) : (
          <Link
            href="/signin"
            className="rounded-full border border-zinc-700 bg-zinc-700 px-5 py-2 text-sm font-exo font-semibold text-white transition hover:bg-zinc-800 dark:border-slate-100 dark:bg-slate-100 dark:text-zinc-800 dark:hover:bg-white">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
