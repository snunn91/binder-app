"use client";

import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, XCircle } from "lucide-react";

type StatusBoxType = "info" | "warning" | "error";

type StatusBoxProps = {
  type: StatusBoxType;
  text?: string;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

const statusStyles: Record<StatusBoxType, string> = {
  info: "border border-accent/35 bg-accent/12 text-accent dark:border-accent/45 dark:bg-accent/20 dark:text-slate-100",
  warning:
    "border border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-700/50 dark:bg-yellow-950/35 dark:text-yellow-200",
  error:
    "border border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200",
};

function getDefaultIcon(type: StatusBoxType) {
  if (type === "warning") return <AlertTriangle className="h-4 w-4 shrink-0" />;
  if (type === "error") return <XCircle className="h-4 w-4 shrink-0" />;
  return <AlertCircle className="h-4 w-4 shrink-0" />;
}

export default function StatusBox({
  type,
  text,
  icon,
  className = "",
  children,
}: StatusBoxProps) {
  return (
    <div
      role="status"
      className={`mt-2 flex items-start gap-2 rounded-md px-2.5 py-2 text-[11px] font-exo font-medium ${statusStyles[type]} ${className}`}>
      {icon ?? getDefaultIcon(type)}
      <span className="leading-4 mb-0">{children ?? text}</span>
    </div>
  );
}
