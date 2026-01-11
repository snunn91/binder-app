"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme-preference";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(preference: ThemePreference) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const effective = preference === "system" ? getSystemTheme() : preference;

  root.classList.toggle("dark", effective === "dark");
  root.style.colorScheme = effective;
}

function readStoredPreference(): ThemePreference | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (value === "light" || value === "dark" || value === "system") return value;
  return null;
}

function storePreference(value: ThemePreference) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, value);
}

export default function ThemeToggle() {
  const [preference, setPreference] = React.useState<ThemePreference>("system");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    const stored = readStoredPreference() ?? "system";
    setPreference(stored);
    applyTheme(stored);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handler = () => {
      const current = readStoredPreference() ?? preference;
      if (current === "system") applyTheme("system");
    };

    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [mounted, preference]);

  const effectiveTheme = mounted
    ? preference === "system"
      ? getSystemTheme()
      : preference
    : "light";

  const Icon = effectiveTheme === "dark" ? Moon : Sun;

  const setTheme = (next: ThemePreference) => {
    setPreference(next);
    storePreference(next);
    applyTheme(next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className=" text-zinc-700 dark:text-slate-100 cursor-pointer"
          aria-label="Toggle theme">
          <Icon className="h-2 w-2" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-44 border border-zinc-300 bg-gray-50 dark:border-zinc-500 dark:bg-zinc-900">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Laptop className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
