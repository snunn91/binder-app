"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { logOut } from "@/lib/firebase/auth";
import { useAppSelector } from "@/lib/storeHooks";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function Header() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await logOut();
      toast.success("Signed out successfully");
    } finally {
      setIsSigningOut(false);
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
      className={`fixed top-0 left-0 w-full z-50 dark:bg-zinc-800/10 bg-slate-100/10 border-b border-zinc-300 dark:border-zinc-500 backdrop-blur-xs h-fit py-5 flex items-center transition-transform duration-300 ${
        showNav ? "translate-y-0" : "-translate-y-full"
      }`}>
      <div className="list-none flex items-center justify-between w-full px-8 gap-x-2">
        <Link
          href="/"
          className="text-lg font-exo font-semibold text-zinc-800 dark:text-zinc-100">
          Binder
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <Link
              href="/binders"
              className="text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
              Binders
            </Link>
          )}
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={isSigningOut}
              className="relative overflow-hidden flex items-center gap-2 px-2 py-1 rounded-full font-medium text-sm font-exo border border-zinc-300 text-zinc-700 dark:text-slate-100 dark:border-zinc-500 bg-slate-100 dark:bg-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 dark:before:bg-slate-100 before:transition-all before:duration-500 hover:before:w-full hover:text-slate-100 dark:hover:text-zinc-700">
              <span className="relative z-10">Sign Out</span>
            </button>
          ) : (
            <Link
              href="/signin"
              className="relative overflow-hidden flex items-center gap-2 px-2 py-1 rounded-full font-medium text-sm font-exo border border-zinc-300 text-zinc-700 dark:text-slate-100 dark:border-zinc-500 bg-slate-100 dark:bg-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 dark:before:bg-slate-100 before:transition-all before:duration-500 hover:before:w-full hover:text-slate-100 dark:hover:text-zinc-700">
              <span className="relative z-10">Sign In</span>
            </Link>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
