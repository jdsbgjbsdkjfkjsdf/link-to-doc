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
    const { is_long_read } = body as { is_long_read?: boolean };
    if (typeof is_long_read !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "is_long_read must be boolean" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    if (is_long_read) {
      const { data: maxRow } = await supabase
        .from("links")
        .select("long_read_rank")
        .eq("is_long_read", true)
        .order("long_read_rank", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextRank = ((maxRow?.long_read_rank ?? 0) as number) + 1;

      const { data, error } = await supabase
        .from("links")
        .update({ is_long_read: true, long_read_rank: nextRank })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("links long-read set error", error);
        return NextResponse.json(
          { ok: false, error: error.message || "Update failed" },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, link: data as LinkRow });
    }

    const { data, error } = await supabase
      .from("links")
      .update({ is_long_read: false, long_read_rank: null })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("links long-read unset error", error);
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
    console.error("POST /api/links/[id]/long-read", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
