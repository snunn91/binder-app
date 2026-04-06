"use client";

import { getBinderColorSchemeClasses } from "@/config/binderColorSchemes";
import type { BinderGoal } from "@/lib/services/binderService";
import GoalsPanel from "@/components/binder/GoalsPanel";
import BinderProgress from "@/components/binder/BinderProgress";
import BinderValue from "@/components/binder/BinderValue";

type InsideCoverProps = {
  colorScheme?: string;
  binderName?: string;
  filledSlots?: number;
  totalSlots?: number;
  binderTotalUsd?: number;
  showGoals?: boolean;
  showStats?: boolean;
  goals: BinderGoal[];
  goalText: string;
  goalCharLimit: number;
  goalLimit: number;
  goalInputDisabled: boolean;
  goalSubmitDisabled: boolean;
  goalInputDisabledReason?: string | null;
  goalCompleteDisabled: boolean;
  goalCompleteDisabledReason?: string | null;
  activeGoalCount: number;
  isUpdatingGoals: boolean;
  onGoalTextChange: (value: string) => void;
  onAddGoal: () => void;
  onCompleteGoal: (goalId: string) => Promise<void>;
};

export default function InsideCover({
  colorScheme = "default",
  binderName,
  filledSlots = 0,
  totalSlots = 0,
  binderTotalUsd = 0,
  showGoals = true,
  showStats = true,
  goals,
  goalText,
  goalCharLimit,
  goalLimit,
  goalInputDisabled,
  goalSubmitDisabled,
  goalInputDisabledReason,
  goalCompleteDisabled,
  goalCompleteDisabledReason,
  activeGoalCount,
  isUpdatingGoals,
  onGoalTextChange,
  onAddGoal,
  onCompleteGoal,
}: InsideCoverProps) {
  const coverColorSchemeClassName =
    getBinderColorSchemeClasses(colorScheme).panel;

  return (
    <div
      className={`${coverColorSchemeClassName} flex flex-col justify-between rounded-xl p-6 shadow-lg`}>
      <p className="text-center text-5xl font-nunito font-semibold capitalize tracking-wide text-zinc-700 dark:text-slate-100">
        {binderName || "Binder"}
      </p>
      <div className="flex flex-col gap-y-8 w-full max-w-xl">
        {showGoals ? (
          <GoalsPanel
            goals={goals}
            goalText={goalText}
            goalCharLimit={goalCharLimit}
            goalLimit={goalLimit}
            goalInputDisabled={goalInputDisabled}
            goalSubmitDisabled={goalSubmitDisabled}
            goalInputDisabledReason={goalInputDisabledReason}
            goalCompleteDisabled={goalCompleteDisabled}
            goalCompleteDisabledReason={goalCompleteDisabledReason}
            activeGoalCount={activeGoalCount}
            isUpdatingGoals={isUpdatingGoals}
            onGoalTextChange={onGoalTextChange}
            onAddGoal={onAddGoal}
            onCompleteGoal={onCompleteGoal}
          />
        ) : null}
        {showStats ? (
          <div>
            <BinderValue binderTotalUsd={binderTotalUsd} />
            <BinderProgress filledSlots={filledSlots} totalSlots={totalSlots} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
