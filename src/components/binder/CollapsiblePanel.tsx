"use client";

import * as React from "react";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type CollapsiblePanelProps = {
  title?: string;
  triggerIcon: LucideIcon;
  children?: (
    expanded: boolean,
    setExpanded: (next: boolean) => void,
    showLabels: boolean,
  ) => React.ReactNode;
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
  const [showLabels, setShowLabels] = React.useState(defaultExpanded);
  const showTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (showTimerRef.current) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }

    if (expanded) {
      setShowLabels(false);
      showTimerRef.current = window.setTimeout(() => {
        setShowLabels(true);
        showTimerRef.current = null;
      }, 160);
      return;
    }

    setShowLabels(false);
  }, [expanded]);

  return (
    <div
      className={`shrink-0  transition-all duration-300 ease-in-out ${
        expanded ? expandedWidth : collapsedWidth
      }`}>
      <div
        className={`flex flex-row items-center justify-start ${
          expanded ? "gap-x-4" : ""
        }`}>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center justify-center rounded-lg bg-slate-200 p-2 text-zinc-700 transition hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600 ${
            expanded ? "" : "w-full"
          }`}
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
              showLabels ? "block" : "hidden"
            }`}>
            {title}
          </div>
        ) : null}
      </div>

      {children ? (
        <div className="mt-3">
          {children(expanded, setExpanded, showLabels)}
        </div>
      ) : null}
    </div>
  );
}
