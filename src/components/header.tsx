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

  //Disappear on scroll
  const [showNav, setShowNav] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const updateNavVisibility = () => {
      if (window.scrollY < 10) {
        setShowNav(true);
        return;
      }

      if (window.scrollY > lastScrollY) {
        // Scrolling down → hide nav
        setShowNav(false);
      } else {
        // Scrolling up → show nav
        setShowNav(true);
      }

      lastScrollY = window.scrollY;
    };

    window.addEventListener("scroll", updateNavVisibility);

    return () => {
      window.removeEventListener("scroll", updateNavVisibility);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 dark:bg-zinc-800/10 bg-slate-100/10 border-b border-zinc-300 backdrop-blur-xs h-fit py-5 flex items-center transition-transform duration-300 ${
        showNav ? "translate-y-0" : "-translate-y-full"
      }`}>
      <div className="list-none flex items-center justify-between w-full px-8 gap-x-2">
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
            className="relative overflow-hidden flex items-center gap-2 px-2 py-1 rounded-full font-medium text-sm font-exo border border-zinc-700 text-zinc-700 dark:text-slate-100 dark:border-slate-100 bg-slate-100 dark:bg-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 dark:before:bg-slate-100 before:transition-all before:duration-500 hover:before:w-full hover:text-slate-100 dark:hover:text-zinc-700">
            <span className="relative z-10">Logout</span>
          </button>
        ) : (
          <Link
            as={"button"}
            href="/signin"
            className="relative overflow-hidden flex items-center gap-2 px-2 py-1 rounded-full font-medium text-sm font-exo border border-zinc-700 text-zinc-700 dark:text-slate-100 dark:border-slate-100 bg-slate-100 dark:bg-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 dark:before:bg-slate-100 before:transition-all before:duration-500 hover:before:w-full hover:text-slate-100 dark:hover:text-zinc-700">
            <span className="relative z-10">Login</span>
          </Link>
        )}
      </div>
    </header>
  );
}
