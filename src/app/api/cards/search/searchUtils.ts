export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function getString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export function getNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export function getArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
