const CARD_SOURCE_API = "API";
const CARD_SOURCE_DB = "DB";

function normalizeCardSource(rawSource: string | undefined): string {
  const source = rawSource?.trim().toUpperCase();
  if (source === CARD_SOURCE_DB) return CARD_SOURCE_DB;
  return CARD_SOURCE_API;
}

export function getCardSource(): "API" | "DB" {
  const source = normalizeCardSource(process.env.CARD_SOURCE);
  return source === CARD_SOURCE_DB ? "DB" : "API";
}

export function isScrydexDisabled(): boolean {
  const disabled = process.env.DISABLE_SCRYDEX?.trim().toLowerCase();
  return disabled === "true" || getCardSource() === CARD_SOURCE_DB;
}

export function assertScrydexEnabled(context: string): void {
  if (!isScrydexDisabled()) return;

  const message =
    `Scrydex is disabled in this environment. Blocked access from ${context}. ` +
    `Set CARD_SOURCE=API and DISABLE_SCRYDEX=false to re-enable.`;

  // Keep this loud so unexpected API usage is visible in logs.
  console.error(message);
  throw new Error(message);
}
