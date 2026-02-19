import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const SCRYDEX_BASE_URL = process.env.SCRYDEX_BASE_URL || "https://api.scrydex.com";
const EXPANSIONS_ENDPOINT = "/pokemon/v1/en/expansions";
const DEFAULT_PAGE_SIZE = 100;

function parseArgs(argv) {
  const out = {
    pageSize: DEFAULT_PAGE_SIZE,
    maxPages: null,
    dryRun: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") out.help = true;
    else if (arg === "--dry-run") out.dryRun = true;
    else if (arg.startsWith("--page-size=")) {
      out.pageSize = Number(arg.split("=")[1]);
    } else if (arg.startsWith("--max-pages=")) {
      const raw = Number(arg.split("=")[1]);
      out.maxPages = Number.isFinite(raw) && raw > 0 ? raw : null;
    }
  }

  if (!Number.isFinite(out.pageSize) || out.pageSize <= 0) {
    throw new Error("Invalid --page-size value");
  }

  return out;
}

function parseEnvFile(content) {
  const entries = {};
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

function loadLocalEnv() {
  const cwd = process.cwd();
  const envPaths = [".env.local", ".env"].map((name) => path.join(cwd, name));

  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;
    const parsed = parseEnvFile(fs.readFileSync(envPath, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function normalizeReleaseDate(value) {
  if (typeof value !== "string" || value.length === 0) return null;

  const withDashes = value.replace(/\//g, "-");
  const timestamp = Date.parse(withDashes);
  if (Number.isNaN(timestamp)) return null;

  return new Date(timestamp).toISOString().slice(0, 10);
}

function toExpansionRow(expansion) {
  return {
    id: String(expansion.id),
    name: String(expansion.name),
    series: typeof expansion.series === "string" ? expansion.series : null,
    total: typeof expansion.total === "number" ? expansion.total : null,
    printed_total:
      typeof expansion.printed_total === "number" ? expansion.printed_total : null,
    language: typeof expansion.language === "string" ? expansion.language : null,
    language_code:
      typeof expansion.language_code === "string" ? expansion.language_code : null,
    release_date: normalizeReleaseDate(expansion.release_date),
    is_online_only: expansion.is_online_only === true,
    logo: typeof expansion.logo === "string" ? expansion.logo : null,
    symbol: typeof expansion.symbol === "string" ? expansion.symbol : null,
    updated_at: new Date().toISOString(),
  };
}

async function fetchExpansionsPage({ apiKey, teamId, page, pageSize }) {
  const url = new URL(`${SCRYDEX_BASE_URL}${EXPANSIONS_ENDPOINT}`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("page_size", String(pageSize));
  url.searchParams.set("q", "is_online_only:false");
  url.searchParams.set(
    "select",
    "id,name,series,total,printed_total,language,language_code,release_date,is_online_only,logo,symbol",
  );

  const res = await fetch(url.toString(), {
    headers: {
      "X-Api-Key": apiKey,
      "X-Team-ID": teamId,
    },
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Scrydex ${res.status}: ${text}`);
  }

  const json = JSON.parse(text);
  const data = Array.isArray(json?.data) ? json.data : [];
  const totalCount = typeof json?.totalCount === "number" ? json.totalCount : undefined;

  return { data, totalCount };
}

function chunk(list, size) {
  const output = [];
  for (let i = 0; i < list.length; i += size) {
    output.push(list.slice(i, i + size));
  }
  return output;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log("Usage: node scripts/ingest-expansions.mjs [--dry-run] [--page-size=100] [--max-pages=2]");
    process.exit(0);
  }

  loadLocalEnv();

  const apiKey = requiredEnv("SCRYDEX_API_KEY");
  const teamId = requiredEnv("SCRYDEX_TEAM_ID");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase =
    !args.dryRun && supabaseUrl && serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;

  if (!args.dryRun) {
    if (!supabaseUrl) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
    }

    if (!serviceRoleKey) {
      throw new Error(
        "Missing SUPABASE_SERVICE_ROLE_KEY. Live ingest writes require service role key.",
      );
    }

    if (!supabase) {
      throw new Error("Failed to initialize Supabase client for live ingest");
    }
  }

  let page = 1;
  let totalCount;
  let requestCount = 0;
  const collected = [];

  while (true) {
    if (args.maxPages !== null && requestCount >= args.maxPages) break;

    const { data, totalCount: currentTotal } = await fetchExpansionsPage({
      apiKey,
      teamId,
      page,
      pageSize: args.pageSize,
    });

    requestCount += 1;
    if (typeof currentTotal === "number") totalCount = currentTotal;

    const validRows = data
      .filter((row) => row && typeof row === "object" && row.id && row.name)
      .map(toExpansionRow);

    collected.push(...validRows);

    console.log(
      `Fetched page ${page}: ${validRows.length} expansions (running total: ${collected.length})`,
    );

    if (data.length < args.pageSize) break;
    if (typeof totalCount === "number" && collected.length >= totalCount) break;

    page += 1;
  }

  if (collected.length === 0) {
    console.log("No expansions returned. Nothing to upsert.");
    return;
  }

  if (args.dryRun) {
    console.log(`Dry run complete. Would upsert ${collected.length} expansions.`);
    console.log(`Estimated Scrydex credits used: ${requestCount}`);
    return;
  }

  const batches = chunk(collected, 500);
  let upserted = 0;

  for (const [idx, batch] of batches.entries()) {
    const { error } = await supabase
      .from("expansions")
      .upsert(batch, { onConflict: "id", ignoreDuplicates: false });

    if (error) {
      throw new Error(`Supabase upsert failed on batch ${idx + 1}: ${error.message}`);
    }

    upserted += batch.length;
    console.log(`Upserted batch ${idx + 1}/${batches.length} (${batch.length} rows)`);
  }

  const { error: cleanupError, count: removedOnlineCount } = await supabase
    .from("expansions")
    .delete({ count: "exact" })
    .eq("is_online_only", true);

  if (cleanupError) {
    throw new Error(`Failed to remove online-only expansions: ${cleanupError.message}`);
  }

  console.log("Expansions ingest complete.");
  console.log(`Fetched: ${collected.length}`);
  console.log(`Upserted: ${upserted}`);
  console.log(`Removed online-only expansions: ${removedOnlineCount ?? 0}`);
  console.log(`Scrydex requests used: ${requestCount}`);
  if (typeof totalCount === "number") {
    console.log(`Scrydex reported totalCount: ${totalCount}`);
  }
}

run().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Ingest failed: ${message}`);
  process.exit(1);
});
