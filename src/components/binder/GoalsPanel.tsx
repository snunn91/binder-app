"use client";

import type { BinderGoal } from "@/lib/firebase/services/binderService";
import StatusBox from "@/components/ui/StatusBox";

type GoalsPanelProps = {
  goals: BinderGoal[];
  goalText: string;
  goalCharLimit: number;
  goalLimit: number;
  goalInputDisabled: boolean;
  goalSubmitDisabled: boolean;
  goalInputDisabledReason?: string | null;
  activeGoalCount: number;
  isUpdatingGoals: boolean;
  onGoalTextChange: (value: string) => void;
  onAddGoal: () => void;
  onCompleteGoal: (goalId: string) => void;
};

export default function GoalsPanel({
  goals,
  goalText,
  goalCharLimit,
  goalLimit,
  goalInputDisabled,
  goalSubmitDisabled,
  goalInputDisabledReason,
  activeGoalCount,
  isUpdatingGoals,
  onGoalTextChange,
  onAddGoal,
  onCompleteGoal,
}: GoalsPanelProps) {
  return (
    <section className="mt-4 rounded-xl border border-zinc-300/70 bg-white/55 p-3 dark:border-zinc-600/70 dark:bg-zinc-950/25">
      <div className="flex items-center justify-between">
        <p className="text-sm font-exo font-semibold text-zinc-700 dark:text-slate-100">
          Goals
        </p>
        <p className="text-xs font-exo font-medium text-zinc-600 dark:text-slate-200">
          {activeGoalCount}/{goalLimit} active
        </p>
      </div>

      {goals.length === 0 ? (
        <p className="mt-2 text-xs font-exo font-medium text-zinc-600 dark:text-slate-200">
          No goals yet.
        </p>
      ) : (
        <ul className="mt-2 max-h-36 space-y-2 overflow-y-auto pr-1">
          {goals.map((goal) => (
            <li
              key={goal.id}
              className="flex items-center gap-2 rounded-md border border-zinc-300/80 bg-white/70 px-2 py-2 dark:border-zinc-600/80 dark:bg-zinc-900/35">
              <input
                type="checkbox"
                checked={goal.completed}
                disabled={goal.completed || isUpdatingGoals}
                onChange={() => onCompleteGoal(goal.id)}
                className="h-4 w-4 shrink-0 rounded border-zinc-400 accent-accent disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-500"
              />
              <span
                className={`flex-1 text-xs font-exo font-medium ${
                  goal.completed
                    ? "text-zinc-500 line-through dark:text-slate-300"
                    : "text-zinc-700 dark:text-slate-100"
                }`}>
                {goal.text}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 pt-3">
        <textarea
          id="goal-text"
          value={goalText}
          rows={2}
          maxLength={goalCharLimit}
          disabled={goalInputDisabled}
          onChange={(event) => onGoalTextChange(event.target.value)}
          placeholder="Write your next goal..."
          className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-exo text-zinc-700 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-slate-100 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-exo font-medium text-zinc-600 dark:text-slate-300">
            {goalText.length}/{goalCharLimit}
          </span>
          <button
            type="button"
            onClick={onAddGoal}
            disabled={goalSubmitDisabled}
            className="rounded-full border border-accent bg-accent px-4 py-1.5 text-xs font-exo font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:border-zinc-400 disabled:bg-zinc-400 dark:disabled:border-zinc-600 dark:disabled:bg-zinc-700">
            Add goal
          </button>
        </div>
        {goalInputDisabledReason ? (
          <StatusBox type="info" text={goalInputDisabledReason} />
        ) : null}
      </div>
    </section>
  );
}
