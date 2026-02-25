import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { LinkRow } from "@/lib/db-types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    }

    const body = await req.json();
    const { direction } = body as { direction?: "up" | "down" };
    if (direction !== "up" && direction !== "down") {
      return NextResponse.json(
        { ok: false, error: "direction must be 'up' or 'down'" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: current, error: currErr } = await supabase
      .from("links")
      .select("id, long_read_rank")
      .eq("id", id)
      .eq("is_long_read", true)
      .single();

    if (currErr || !current) {
      return NextResponse.json(
        { ok: false, error: "Link not in Long Reads or not found" },
        { status: 404 }
      );
    }

    const currentRank = current.long_read_rank as number;
    const isUp = direction === "up";

    const neighbourQuery = supabase
      .from("links")
      .select("id, long_read_rank")
      .eq("is_long_read", true);
    const { data: neighbour } = isUp
      ? await neighbourQuery
          .lt("long_read_rank", currentRank)
          .order("long_read_rank", { ascending: false })
          .limit(1)
          .maybeSingle()
      : await neighbourQuery
          .gt("long_read_rank", currentRank)
          .order("long_read_rank", { ascending: true })
          .limit(1)
          .maybeSingle();

    if (!neighbour) {
      return NextResponse.json({ ok: true, link: current });
    }

    const neighbourRank = neighbour.long_read_rank as number;
    const neighbourId = neighbour.id;

    await supabase.from("links").update({ long_read_rank: neighbourRank }).eq("id", id);
    await supabase.from("links").update({ long_read_rank: currentRank }).eq("id", neighbourId);

    const { data: updated } = await supabase
      .from("links")
      .select("*")
      .eq("id", id)
      .single();

    return NextResponse.json({ ok: true, link: updated as LinkRow });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("Missing required environment variable")) {
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
    console.error("POST /api/links/[id]/long-read-move", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
