import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const SCRYDEX_BASE_URL = process.env.SCRYDEX_BASE_URL || "https://api.scrydex.com";
const EXPANSIONS_ENDPOINT_PREFIX = "/pokemon/v1/en/expansions";
const DEFAULT_PAGE_SIZE = 100;

function parseArgs(argv) {
  const out = {
    pageSize: DEFAULT_PAGE_SIZE,
    maxPages: null,
    startSet: 1,
    maxSets: null,
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
    } else if (arg.startsWith("--start-set=")) {
      const raw = Number(arg.split("=")[1]);
      out.startSet = Number.isFinite(raw) && raw > 0 ? raw : 1;
    } else if (arg.startsWith("--max-sets=")) {
      const raw = Number(arg.split("=")[1]);
      out.maxSets = Number.isFinite(raw) && raw > 0 ? raw : null;
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

function normalizeDate(value) {
  if (typeof value !== "string" || value.length === 0) return null;

  const withDashes = value.replace(/\//g, "-");
  const timestamp = Date.parse(withDashes);
  if (Number.isNaN(timestamp)) return null;

  return new Date(timestamp).toISOString().slice(0, 10);
}

function toStringArray(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((v) => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function pickFrontImage(images) {
  if (!Array.isArray(images)) return { small: null, large: null };

  const records = images.filter((img) => img && typeof img === "object");
  if (records.length === 0) return { small: null, large: null };

  const front =
    records.find((img) => typeof img.type === "string" && img.type === "front") ??
    records[0];

  const small = typeof front.small === "string" ? front.small : null;
  const large = typeof front.large === "string" ? front.large : null;

  return { small, large };
}

function toCardRow(card, expansionId, expansionName) {
  if (!card || typeof card !== "object") return null;

  const id = typeof card.id === "string" ? card.id : null;
  const name = typeof card.name === "string" ? card.name : null;
  if (!id || !name) return null;

  const expansion =
    card.expansion && typeof card.expansion === "object" ? card.expansion : null;

  if (expansion && expansion.is_online_only === true) {
    return null;
  }

  const rowExpansionId =
    expansion && typeof expansion.id === "string" ? expansion.id : expansionId;
  const rowExpansionName =
    expansion && typeof expansion.name === "string" ? expansion.name : expansionName;
  const rowExpansionReleaseDate =
    expansion && typeof expansion.release_date === "string"
      ? normalizeDate(expansion.release_date)
      : null;

  const expansionSortOrder =
    typeof card.expansion_sort_order === "number" ? card.expansion_sort_order : null;

  const { small: imageSmall, large: imageLarge } = pickFrontImage(card.images);

  return {
    id,
    name,
    number: typeof card.number === "string" ? card.number : null,
    rarity: typeof card.rarity === "string" ? card.rarity : null,
    artist: typeof card.artist === "string" ? card.artist : null,
    supertype: typeof card.supertype === "string" ? card.supertype : null,
    subtypes: toStringArray(card.subtypes),
    types: toStringArray(card.types),
    rules: toStringArray(card.rules),
    image_small: imageSmall,
    image_large: imageLarge,
    expansion_id: rowExpansionId,
    expansion_name: rowExpansionName,
    expansion_release_date: rowExpansionReleaseDate,
    expansion_sort_order: expansionSortOrder,
    language: typeof card.language === "string" ? card.language : null,
    language_code:
      typeof card.language_code === "string" ? card.language_code : null,
    is_online_only: false,
    updated_at: new Date().toISOString(),
  };
}

async function fetchSetCardsPage({ apiKey, teamId, setId, page, pageSize }) {
  const url = new URL(`${SCRYDEX_BASE_URL}${EXPANSIONS_ENDPOINT_PREFIX}/${setId}/cards`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("page_size", String(pageSize));
  url.searchParams.set(
    "select",
    "id,name,number,rarity,artist,supertype,subtypes,types,rules,images,expansion,language,language_code,expansion_sort_order",
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
    throw new Error(`Scrydex ${res.status} on set ${setId}, page ${page}: ${text}`);
  }

  const json = JSON.parse(text);
  const data = Array.isArray(json?.data) ? json.data : [];
  const totalCount = typeof json?.totalCount === "number" ? json.totalCount : undefined;

  return { data, totalCount };
}

async function upsertCardsBatch(supabase, rows, setId, page) {
  const { error } = await supabase
    .from("cards")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: false });

  if (error) {
    throw new Error(
      `Supabase upsert failed for set ${setId}, page ${page}: ${error.message}`,
    );
  }
}

async function fetchOfflineExpansions(supabaseRead, startSet, maxSets) {
  const { data, error } = await supabaseRead
    .from("expansions")
    .select("id,name")
    .eq("is_online_only", false)
    .order("release_date", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Failed to load expansions from Supabase: ${error.message}`);
  }

  const all = (data ?? [])
    .filter((row) => row && typeof row.id === "string")
    .map((row) => ({ id: row.id, name: typeof row.name === "string" ? row.name : row.id }));

  const offset = Math.max(0, startSet - 1);
  const sliced = all.slice(offset, maxSets ? offset + maxSets : undefined);

  return {
    totalAvailable: all.length,
    selected: sliced,
  };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(
      "Usage: node scripts/ingest-cards.mjs [--dry-run] [--page-size=100] [--start-set=1] [--max-sets=20] [--max-pages=50]",
    );
    process.exit(0);
  }

  loadLocalEnv();

  const apiKey = requiredEnv("SCRYDEX_API_KEY");
  const teamId = requiredEnv("SCRYDEX_TEAM_ID");
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const supabaseRead = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseWrite =
    !args.dryRun && serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;

  if (!args.dryRun && !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Live ingest writes require service role key.",
    );
  }

  if (!args.dryRun && !supabaseWrite) {
    throw new Error("Failed to initialize Supabase client for live ingest");
  }

  const { totalAvailable, selected } = await fetchOfflineExpansions(
    supabaseRead,
    args.startSet,
    args.maxSets,
  );

  if (selected.length === 0) {
    console.log("No eligible expansions found for ingest.");
    return;
  }

  console.log(
    `Using ${selected.length} expansion(s) from Supabase (offline only). Total available offline expansions: ${totalAvailable}`,
  );

  let requestCount = 0;
  let rawCardCount = 0;
  let keptCardCount = 0;
  let upsertedCardCount = 0;
  let skippedOnlineCount = 0;
  let stoppedByMaxPages = false;

  for (let setIndex = 0; setIndex < selected.length; setIndex += 1) {
    const set = selected[setIndex];
    let page = 1;

    while (true) {
      if (args.maxPages !== null && requestCount >= args.maxPages) {
        stoppedByMaxPages = true;
        break;
      }

      const { data } = await fetchSetCardsPage({
        apiKey,
        teamId,
        setId: set.id,
        page,
        pageSize: args.pageSize,
      });

      requestCount += 1;
      rawCardCount += data.length;

      const transformed = [];
      for (const card of data) {
        const row = toCardRow(card, set.id, set.name);
        if (!row) {
          if (
            card &&
            typeof card === "object" &&
            card.expansion &&
            typeof card.expansion === "object" &&
            card.expansion.is_online_only === true
          ) {
            skippedOnlineCount += 1;
          }
          continue;
        }
        transformed.push(row);
      }

      keptCardCount += transformed.length;

      console.log(
        `[${setIndex + 1}/${selected.length}] ${set.id} page ${page}: raw=${data.length}, kept=${transformed.length}, running kept=${keptCardCount}`,
      );

      if (!args.dryRun && transformed.length > 0) {
        await upsertCardsBatch(supabaseWrite, transformed, set.id, page);
        upsertedCardCount += transformed.length;
      }

      if (data.length < args.pageSize) break;
      page += 1;
    }

    if (stoppedByMaxPages) break;
  }

  console.log(args.dryRun ? "Cards dry run complete." : "Cards ingest complete.");
  console.log(`Requests used: ${requestCount}`);
  console.log(`Raw cards fetched: ${rawCardCount}`);
  console.log(`Cards retained (non-online): ${keptCardCount}`);
  console.log(`Cards skipped (online-only expansions): ${skippedOnlineCount}`);
  if (!args.dryRun) {
    console.log(`Cards upserted: ${upsertedCardCount}`);
  }
  if (stoppedByMaxPages) {
    console.log("Stopped early due to --max-pages limit.");
  }
}

run().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Ingest failed: ${message}`);
  process.exit(1);
});
