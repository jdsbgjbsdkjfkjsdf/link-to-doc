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
    const { is_today } = body as { is_today?: boolean };
    if (typeof is_today !== "boolean") {
      return NextResponse.json({ ok: false, error: "is_today must be boolean" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (is_today) {
      const { data: maxRow } = await supabase
        .from("links")
        .select("today_rank")
        .eq("is_today", true)
        .order("today_rank", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextRank = ((maxRow?.today_rank ?? 0) as number) + 1;

      const { data, error } = await supabase
        .from("links")
        .update({ is_today: true, today_rank: nextRank })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("links today set error", error);
        return NextResponse.json(
          { ok: false, error: error.message || "Update failed" },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, link: data as LinkRow });
    }

    const { data, error } = await supabase
      .from("links")
      .update({ is_today: false, today_rank: null })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("links today unset error", error);
      return NextResponse.json(
        { ok: false, error: error.message || "Update failed" },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, link: data as LinkRow });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("Missing required environment variable")) {
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
    console.error("POST /api/links/[id]/today", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
