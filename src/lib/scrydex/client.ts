import { assertScrydexEnabled } from "@/lib/catalog/sourceGate";

const BASE_URL = process.env.SCRYDEX_BASE_URL || "https://api.scrydex.com";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

export async function scrydexFetch<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  assertScrydexEnabled(`scrydexFetch(${endpoint})`);

  const apiKey = requiredEnv("SCRYDEX_API_KEY");
  const teamId = requiredEnv("SCRYDEX_TEAM_ID");
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: {
      "X-Api-Key": apiKey,
      "X-Team-ID": teamId,
    },
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Scrydex ${res.status}: ${text}`);
  return JSON.parse(text) as T;
}
