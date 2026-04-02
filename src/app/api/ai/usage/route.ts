export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const AI_PROMPT_LIMIT = 5;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = getSupabaseServiceClient();
    const { data: userData, error: authError } =
      await serviceClient.auth.getUser(token);
    if (authError || !userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = userData.user.id;

    const exemptUsers = (process.env.AI_RATE_LIMIT_EXEMPT_USERS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (exemptUsers.includes(userId)) {
      return NextResponse.json({ used: 0, resetAt: null });
    }

    const { data } = await serviceClient
      .from("ai_prompt_usage")
      .select("prompt_count, cooldown_started_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) {
      return NextResponse.json({ used: 0, resetAt: null });
    }

    const { prompt_count, cooldown_started_at } = data as {
      prompt_count: number;
      cooldown_started_at: string | null;
    };

    if (cooldown_started_at) {
      const elapsed = Date.now() - new Date(cooldown_started_at).getTime();
      if (elapsed < COOLDOWN_MS) {
        const resetAt = new Date(
          new Date(cooldown_started_at).getTime() + COOLDOWN_MS,
        ).toISOString();
        return NextResponse.json({ used: AI_PROMPT_LIMIT, resetAt });
      }
      // Cooldown has expired — treat as reset (don't write here; generate-cards will reset on next use)
      return NextResponse.json({ used: 0, resetAt: null });
    }

    return NextResponse.json({ used: prompt_count, resetAt: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch usage";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
