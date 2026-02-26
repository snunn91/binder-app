"use client";

type QuickJumpSet = {
  id: string;
  name: string;
};

type QuickJumpSetsProps = {
  sets: QuickJumpSet[];
  onJump: (setId: string) => void;
};

export default function QuickJumpSets({ sets, onJump }: QuickJumpSetsProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="text-xs font-exo font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Quick Jump Sets
      </div>
      <div className="max-h-[calc(100vh-315px)] overflow-y-auto rounded-lg border border-zinc-300 bg-slate-100 p-2 dark:border-zinc-600 dark:bg-zinc-800/70">
        <div className="flex flex-col items-start gap-2.5">
          {sets.map((set) => (
            <button
              key={set.id}
              type="button"
              onClick={() => onJump(set.id)}
              className="text-xs text-left font-exo font-medium text-zinc-700 dark:text-slate-100">
              {set.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
