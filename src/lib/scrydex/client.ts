const BASE_URL = process.env.SCRYDEX_BASE_URL || "https://api.scrydex.com";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

const SCRYDEX = {
  apiKey: requiredEnv("SCRYDEX_API_KEY"),
  teamId: requiredEnv("SCRYDEX_TEAM_ID"),
} as const;

export async function scrydexFetch<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: {
      "X-Api-Key": SCRYDEX.apiKey,
      "X-Team-ID": SCRYDEX.teamId,
    },
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Scrydex ${res.status}: ${text}`);
  return JSON.parse(text) as T;
}
