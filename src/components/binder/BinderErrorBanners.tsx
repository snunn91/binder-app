type ErrorBannersProps = {
  addCardsError: string | null;
  saveError: string | null;
};

export default function ErrorBanners({
  addCardsError,
  saveError,
}: ErrorBannersProps) {
  return (
    <>
      {addCardsError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {addCardsError}
        </div>
      ) : null}
      {saveError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {saveError}
        </div>
      ) : null}
    </>
  );
}
