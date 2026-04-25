export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type MoveBulkBoxCardRequest = {
  binderId?: string;
  cardIndex?: number;
};

type MoveBulkBoxCardResult = {
  page: {
    id: string;
    index: number;
    slots: number;
    cardOrder: unknown;
  };
  bulkBoxCards: unknown;
};

export async function POST(req: Request) {
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

    const body = (await req.json()) as MoveBulkBoxCardRequest;
    const binderId =
      typeof body.binderId === "string" ? body.binderId.trim() : "";
    const cardIndex =
      typeof body.cardIndex === "number" && Number.isInteger(body.cardIndex)
        ? body.cardIndex
        : -1;

    if (!binderId) {
      return NextResponse.json(
        { error: "Binder ID is required" },
        { status: 400 },
      );
    }

    if (cardIndex < 0) {
      return NextResponse.json(
        { error: "Card index must be a non-negative integer" },
        { status: 400 },
      );
    }

    const { data, error } = await serviceClient.rpc(
      "move_bulk_box_card_to_binder",
      {
        p_user_id: userData.user.id,
        p_binder_id: binderId,
        p_card_index: cardIndex,
      },
    );

    if (error) {
      const message = error.message || "Failed to move card from Bulk Box";
      const status =
        message.includes("Binder has no free slots") ||
        message.includes("Card not found in bulk box") ||
        message.includes("Binder not found")
          ? 400
          : 500;

      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json(data as MoveBulkBoxCardResult);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to move card from Bulk Box";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
