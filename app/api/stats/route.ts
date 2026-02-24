import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const [unreadRes, readRes, todayRes] = await Promise.all([
      supabase.from("links").select("id", { count: "exact", head: true }).eq("is_read", false),
      supabase.from("links").select("id", { count: "exact", head: true }).eq("is_read", true),
      supabase.from("links").select("id", { count: "exact", head: true }).eq("is_today", true),
    ]);

    const unreadCount = unreadRes.count ?? 0;
    const readCount = readRes.count ?? 0;
    const todayCount = todayRes.count ?? 0;

    if (unreadRes.error || readRes.error || todayRes.error) {
      const err = unreadRes.error || readRes.error || todayRes.error;
      console.error("stats error", err);
      return NextResponse.json(
        { ok: false, error: err?.message || "Fetch failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      unreadCount,
      readCount,
      todayCount,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("Missing required environment variable")) {
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
    console.error("GET /api/stats", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
