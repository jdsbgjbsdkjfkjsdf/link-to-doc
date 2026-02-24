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
    const { is_read } = body as { is_read?: boolean };
    if (typeof is_read !== "boolean") {
      return NextResponse.json({ ok: false, error: "is_read must be boolean" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const update: { is_read: boolean; read_at: string | null } = {
      is_read,
      read_at: is_read ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from("links")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("links toggle error", error);
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
    console.error("POST /api/links/[id]/toggle", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
