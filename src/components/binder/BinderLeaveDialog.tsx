import { binderMessages } from "@/config/binderMessages";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LeaveBinderDialogProps = {
  isOpen: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onStay: () => void;
  onSaveAndLeave: () => void;
  onDiscardAndLeave: () => void;
};

export default function LeaveBinderDialog({
  isOpen,
  isSaving,
  onOpenChange,
  onStay,
  onSaveAndLeave,
  onDiscardAndLeave,
}: LeaveBinderDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle>{binderMessages.leaveModal.title}</DialogTitle>
          <DialogDescription>
            {binderMessages.leaveModal.description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex gap-2 sm:justify-end sm:space-x-0">
          <button
            type="button"
            onClick={onStay}
            className="rounded-full border border-zinc-300 bg-slate-200 px-4 py-2 text-sm font-exo font-medium text-zinc-700 transition hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600">
            {binderMessages.leaveModal.stay}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={onSaveAndLeave}
            className="rounded-full border border-emerald-600 bg-emerald-500 px-4 py-2 text-sm font-exo font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500">
            {isSaving ? "Saving..." : binderMessages.leaveModal.saveAndLeave}
          </button>
          <button
            type="button"
            onClick={onDiscardAndLeave}
            className="rounded-full border border-red-400 bg-red-500 px-4 py-2 text-sm font-exo font-medium text-white transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-red-400 dark:bg-red-600 dark:hover:bg-red-500">
            {binderMessages.leaveModal.discardAndLeave}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
