"use client";

import * as React from "react";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type CollapsiblePanelProps = {
  title?: string;
  triggerIcon: LucideIcon;
  children?: (expanded: boolean) => React.ReactNode;
  expandedWidth?: string;
  collapsedWidth?: string;
  defaultExpanded?: boolean;
};

export default function CollapsiblePanel({
  title,
  triggerIcon: TriggerIcon,
  children,
  expandedWidth = "w-56",
  collapsedWidth = "w-14",
  defaultExpanded = false,
}: CollapsiblePanelProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <div
      className={`shrink-0 rounded-xl border border-zinc-300 bg-gray-50 p-2 shadow-sm transition-all duration-300 ease-in-out dark:border-zinc-500 dark:bg-zinc-900/25 ${
        expanded ? expandedWidth : collapsedWidth
      }`}>
      <div className="flex flex-row items-center gap-4">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex p-2 items-center justify-center rounded-lg border border-zinc-300 bg-slate-200 text-zinc-700 transition hover:bg-slate-300 dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600"
          aria-expanded={expanded}
          aria-label="Toggle panel">
          {expanded ? (
            <X className="h-4 w-4" />
          ) : (
            <TriggerIcon className="h-4 w-4" />
          )}
        </button>
        {title ? (
          <div
            className={`text-sm font-exo font-medium text-zinc-700 dark:text-slate-100 ${
              expanded ? "block" : "hidden"
            }`}>
            {title}
          </div>
        ) : null}
      </div>

      {children ? <div className="mt-3">{children(expanded)}</div> : null}
    </div>
  );
}
