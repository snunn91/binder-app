import {
  type DragEndEvent,
  type DragStartEvent,
  type SensorDescriptor,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import InsideCover from "@/components/binder/InsideCover";
import PagePanel from "@/components/binder/PagePanel";
import { Skeleton } from "@/components/ui/skeleton";
import type { BinderCard, BinderGoal } from "@/lib/services/binderService";

type BinderPage = {
  id: string;
  index: number;
  slots: number;
  cardOrder: (BinderCard | null)[];
};

type BinderSpreadContentProps = {
  loading: boolean;
  spreadIndex: number;
  currentPageIndex: number;
  totalPageSpreads: number;
  pagesSortedLength: number;
  layoutColumns: number;
  isTwoByTwoLayout: boolean;
  isFourByFourLayout: boolean;
  leftPage: BinderPage | null;
  rightPage: BinderPage | null;
  sensors: SensorDescriptor<Record<string, unknown>>[];
  activeId: string | null;
  binderName?: string;
  colorScheme?: string;
  showGoals?: boolean;
  filledSlots: number;
  totalSlots: number;
  goals: BinderGoal[];
  goalText: string;
  goalCharLimit: number;
  goalLimit: number;
  goalInputDisabled: boolean;
  goalSubmitDisabled: boolean;
  goalInputDisabledReason: string | null;
  goalCompleteDisabled: boolean;
  goalCompleteDisabledReason: string | null;
  activeGoalCount: number;
  isUpdatingGoals: boolean;
  isEditMode: boolean;
  onPrevSpread: () => void;
  onNextSpread: () => void;
  onGoalTextChange: (value: string) => void;
  onAddGoal: () => void;
  onCompleteGoal: (goalId: string) => Promise<void>;
  onAddCard: () => void;
  onDeleteCard: (pageId: string, slotIndex: number) => void;
  onToggleMissing: (pageId: string, slotIndex: number) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragEndForPage: (pageId: string) => (event: DragEndEvent) => void;
  onDragCancel: () => void;
};

export default function BinderSpreadContent({
  loading,
  spreadIndex,
  currentPageIndex,
  totalPageSpreads,
  pagesSortedLength,
  layoutColumns,
  isTwoByTwoLayout,
  isFourByFourLayout,
  leftPage,
  rightPage,
  sensors,
  activeId,
  binderName,
  colorScheme,
  showGoals,
  filledSlots,
  totalSlots,
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
  isEditMode,
  onPrevSpread,
  onNextSpread,
  onGoalTextChange,
  onAddGoal,
  onCompleteGoal,
  onAddCard,
  onDeleteCard,
  onToggleMissing,
  onDragStart,
  onDragEndForPage,
  onDragCancel,
}: BinderSpreadContentProps) {
  const gridClassName = isTwoByTwoLayout
    ? "mx-auto w-full max-w-[68rem] flex-none gap-3"
    : isFourByFourLayout
      ? "mx-auto w-full max-w-[68rem] flex-none gap-2"
      : "mx-auto w-full max-w-[68rem] flex-none gap-4";

  return (
    <div className="flex h-full min-w-0 flex-col items-center justify-start gap-2">
      <div className="flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-slate-200 px-2 py-1 dark:border-zinc-500 dark:bg-zinc-700">
        <button
          type="button"
          onClick={onPrevSpread}
          disabled={loading || spreadIndex === 0}
          aria-hidden={loading}
          className="flex h-6 w-6 shrink-0 items-center justify-center text-zinc-700 disabled:opacity-50 focus-visible:outline-none dark:text-slate-100">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[3.5rem] text-center text-xs font-exo font-medium text-zinc-700 dark:text-slate-100">
          {currentPageIndex}/{totalPageSpreads}
        </span>
        <button
          type="button"
          onClick={onNextSpread}
          disabled={loading || pagesSortedLength <= 1 || spreadIndex === 1}
          aria-hidden={loading}
          className="flex h-6 w-6 shrink-0 items-center justify-center text-zinc-700 disabled:opacity-50 focus-visible:outline-none dark:text-slate-100">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className={`grid min-w-0 grid-cols-2 ${gridClassName}`}>
        {loading ? (
          [0, 1].map((panelIndex) => (
            <div
              key={panelIndex}
              className={`rounded-xl border border-zinc-300 bg-gray-50 shadow-lg dark:border-zinc-500 dark:bg-zinc-900/25 ${
                isFourByFourLayout ? "p-1.5" : "p-3"
              }`}>
              <Skeleton className="h-4 w-20" />
              <div
                className={`${isFourByFourLayout ? "mt-2" : "mt-4"} grid ${
                  isTwoByTwoLayout
                    ? "gap-x-2 gap-y-7"
                    : isFourByFourLayout
                      ? "gap-1"
                      : "gap-2"
                }`}
                style={{
                  gridTemplateColumns: `repeat(${layoutColumns}, minmax(0, 1fr))`,
                }}>
                {Array.from({ length: layoutColumns * layoutColumns }).map(
                  (_, slotIndex) => (
                    <Skeleton
                      key={slotIndex}
                      className={`${
                        isTwoByTwoLayout
                          ? "aspect-[73/100] w-[84%] justify-self-center"
                          : isFourByFourLayout
                            ? "aspect-[3/4] w-[92%] justify-self-center"
                            : "aspect-[7/10] w-[84%] justify-self-center"
                      } rounded-lg`}
                    />
                  ),
                )}
              </div>
            </div>
          ))
        ) : (
          <>
            {spreadIndex === 0 ? (
              <InsideCover
                colorScheme={colorScheme}
                binderName={binderName}
                filledSlots={filledSlots}
                totalSlots={totalSlots}
                showGoals={showGoals}
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
            ) : (
              <PagePanel
                page={leftPage}
                layoutColumns={layoutColumns}
                sensors={sensors}
                activeId={activeId}
                colorScheme={colorScheme}
                onAddCard={onAddCard}
                onDeleteCard={onDeleteCard}
                onToggleMissing={onToggleMissing}
                isEditMode={isEditMode}
                onDragStart={onDragStart}
                onDragEnd={leftPage ? onDragEndForPage(leftPage.id) : () => {}}
                onDragCancel={onDragCancel}
              />
            )}

            <PagePanel
              page={rightPage}
              layoutColumns={layoutColumns}
              sensors={sensors}
              activeId={activeId}
              colorScheme={colorScheme}
              onAddCard={onAddCard}
              onDeleteCard={onDeleteCard}
              onToggleMissing={onToggleMissing}
              isEditMode={isEditMode}
              onDragStart={onDragStart}
              onDragEnd={rightPage ? onDragEndForPage(rightPage.id) : () => {}}
              onDragCancel={onDragCancel}
            />
          </>
        )}
      </div>
    </div>
  );
}
