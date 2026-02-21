import { Box, Plus } from "lucide-react";

type MobileBinderPanelProps = {
  bulkBoxCount: number;
  onOpenAddCards: () => void;
  onOpenBulkBox: () => void;
};

export default function MobileBinderPanel({
  bulkBoxCount,
  onOpenAddCards,
  onOpenBulkBox,
}: MobileBinderPanelProps) {
  return (
    <div className="flex h-full items-start justify-center px-3 pt-2">
      <div className="w-full max-w-xl rounded-xl border border-zinc-300 bg-gray-50 p-4 shadow-lg dark:border-zinc-500 dark:bg-zinc-900/25">
        <h2 className="text-base font-exo font-semibold text-zinc-700 dark:text-slate-100">
          Mobile Mode
        </h2>
        <p className="mt-1 text-xs font-exo text-zinc-600 dark:text-zinc-300">
          Binders are hidden on mobile. You can add cards to Bulk Box in list
          view here, then move cards into binder slots on tablet or desktop.
        </p>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onOpenAddCards}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-accent text-white shadow-lg transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-accent dark:bg-accent dark:text-white dark:hover:bg-accent/90">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add card</span>
          </button>
          <button
            type="button"
            onClick={onOpenBulkBox}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-slate-200 text-zinc-700 shadow-lg transition hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600">
            <span className="absolute -right-1 -top-1 z-20 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-exo font-semibold leading-none text-white">
              {bulkBoxCount}
            </span>
            <Box className="h-4 w-4" />
            <span className="sr-only">Open Bulk Box</span>
          </button>
        </div>
      </div>
    </div>
  );
}
