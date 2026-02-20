"use client";

import {
  Box,
  EllipsisVertical,
  Pencil,
  Plus,
  Save,
  Settings,
  X,
} from "lucide-react";

type BinderActionToggleProps = {
  isActionMenuOpen: boolean;
  isEditMode: boolean;
  hasEditSessionChanges: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  bulkBoxCount: number;
  onOpenAddCards: () => void;
  onOpenBulkBox: () => void;
  onSave: () => void | Promise<void>;
  onEdit: () => void | Promise<void>;
  onOpenSettings: () => void;
  onToggleMenu: () => void;
};

export default function BinderActionToggle({
  isActionMenuOpen,
  isEditMode,
  hasEditSessionChanges,
  hasUnsavedChanges,
  isSaving,
  bulkBoxCount,
  onOpenAddCards,
  onOpenBulkBox,
  onSave,
  onEdit,
  onOpenSettings,
  onToggleMenu,
}: BinderActionToggleProps) {
  return (
    <div className="fixed bottom-14 right-12 z-40">
      <div
        className={`absolute bottom-14 right-0 flex flex-col items-end gap-2 transition-all duration-300 ${
          isActionMenuOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}>
        <button
          type="button"
          onClick={onOpenAddCards}
          className="group relative flex h-12 items-center overflow-hidden rounded-full border border-accent bg-accent px-4 text-sm font-exo font-medium text-white shadow-lg transition-all duration-300 hover:pr-5 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-accent dark:bg-accent dark:text-white dark:hover:bg-accent/90">
          <Plus className="relative z-10 h-4 w-4 shrink-0" />
          <span className="relative z-10 max-w-0 overflow-hidden whitespace-nowrap pl-0 transition-all duration-300 group-hover:max-w-20 group-hover:pl-2">
            Add card
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenBulkBox}
          className="group relative flex h-12 items-center rounded-full border border-zinc-300 bg-slate-200 px-4 text-sm font-exo font-medium text-zinc-700 shadow-lg transition-all duration-300 hover:pr-5 hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600">
          <span className="absolute -right-1.5 -top-1.5 z-20 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-exo font-semibold leading-none text-white">
            {bulkBoxCount}
          </span>
          <Box className="h-4 w-4 shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap pl-0 transition-all duration-300 group-hover:max-w-20 group-hover:pl-2">
            Bulk box
          </span>
        </button>

        <button
          type="button"
          onClick={() => void onSave()}
          disabled={!hasUnsavedChanges || isSaving}
          aria-label={isSaving ? "Saving changes" : "Save changes"}
          className={`group flex h-12 items-center overflow-hidden rounded-full border px-4 text-sm font-exo font-medium shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent ${
            hasUnsavedChanges && !isSaving
              ? "border-red-600 bg-red-500 text-white animate-[pulse_3s_ease-in-out_infinite] hover:pr-5 hover:bg-red-600 dark:border-red-500 dark:bg-red-600 dark:text-white dark:hover:bg-red-500"
              : "cursor-not-allowed border-zinc-300 bg-slate-200 text-zinc-700 opacity-70 dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100"
          }`}>
          <Save className="h-4 w-4 shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap pl-0 transition-all duration-300 group-hover:max-w-16 group-hover:pl-2">
            {isSaving ? "Saving..." : "Save"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => void onEdit()}
          className={`group flex h-12 items-center overflow-hidden rounded-full border px-4 text-sm font-exo font-medium shadow-lg transition-all duration-300 hover:pr-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent ${
            isEditMode && hasEditSessionChanges
              ? "border-emerald-600 bg-emerald-500 text-white hover:bg-emerald-600 dark:border-emerald-500 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500"
              : "border-zinc-300 bg-slate-200 text-zinc-700 hover:bg-slate-300 dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600"
          }`}>
          {isEditMode && hasEditSessionChanges ? (
            <Save className="h-4 w-4 shrink-0" />
          ) : isEditMode ? (
            <X className="h-4 w-4 shrink-0" />
          ) : (
            <Pencil className="h-4 w-4 shrink-0" />
          )}
          <span className="max-w-0 overflow-hidden whitespace-nowrap pl-0 transition-all duration-300 group-hover:max-w-16 group-hover:pl-2">
            {isEditMode ? (hasEditSessionChanges ? "Save" : "Cancel") : "Edit"}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="group flex h-12 items-center overflow-hidden rounded-full border border-zinc-300 bg-slate-200 px-4 text-sm font-exo font-medium text-zinc-700 shadow-lg transition-all duration-300 hover:pr-5 hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600">
          <Settings className="h-4 w-4 shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap pl-0 transition-all duration-300 group-hover:max-w-20 group-hover:pl-2">
            Settings
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={onToggleMenu}
        aria-expanded={isActionMenuOpen}
        aria-label={isActionMenuOpen ? "Hide actions" : "Show actions"}
        className={`flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent ${
          hasUnsavedChanges
            ? "border-red-600 bg-red-500 text-white hover:bg-red-600 dark:border-red-500 dark:bg-red-600 dark:text-white dark:hover:bg-red-500"
            : "border-zinc-300 bg-slate-200 text-zinc-700 hover:bg-slate-300 dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600"
        }`}>
        <EllipsisVertical className="h-4 w-4" />
        <span className="sr-only">Actions</span>
      </button>
    </div>
  );
}
