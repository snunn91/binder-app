type DeleteAllBinderPageCardsProps = {
  disabled: boolean;
  onDeleteAll: () => void;
};

export default function DeleteAllBinderPageCards({
  disabled,
  onDeleteAll,
}: DeleteAllBinderPageCardsProps) {
  return (
    <div className="fixed right-6 top-[calc(var(--header-h)+2.5rem)] z-40">
      <button
        type="button"
        onClick={onDeleteAll}
        disabled={disabled}
        className="rounded-full border border-red-500 bg-red-500 px-4 py-1.5 text-xs font-exo font-semibold text-white shadow-lg transition hover:bg-red-600 disabled:cursor-not-allowed disabled:border-zinc-400 disabled:bg-zinc-400 dark:disabled:border-zinc-600 dark:disabled:bg-zinc-700">
        Delete all
      </button>
    </div>
  );
}
