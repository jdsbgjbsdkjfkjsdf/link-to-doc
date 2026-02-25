import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { fetchUrlMetadataWithHtml } from "@/lib/metadata";
import { cleanTitle } from "@/lib/clean-title";
import { isDescriptionUseless, generateOneLineSummary } from "@/lib/summary";
import { estimateReadTimeMinutes } from "@/lib/read-time";
import type { LinkRow } from "@/lib/db-types";

const SUMMARY_MAX = 140;

function normalizeUrl(input: string): string {
  const u = input.trim();
  if (!u) return u;
  if (!/^https?:\/\//i.test(u)) return `https://${u}`;
  return u;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url: rawUrl } = body as { url?: string };
    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json({ ok: false, error: "url is required" }, { status: 400 });
    }

    const url = normalizeUrl(rawUrl);
    if (!url.startsWith("http")) {
      return NextResponse.json({ ok: false, error: "Invalid URL" }, { status: 400 });
    }

    const metadata = await fetchUrlMetadataWithHtml(url);
    const title = cleanTitle(metadata.title, metadata.hostname);
    const domain = metadata.hostname || null;

    let summary: string;
    if (
      metadata.description &&
      metadata.description.length >= 10 &&
      metadata.description.length <= 200 &&
      !isDescriptionUseless(metadata.description)
    ) {
      summary = metadata.description.replace(/\n/g, " ").trim();
      if (summary.length > SUMMARY_MAX) summary = summary.slice(0, SUMMARY_MAX - 3) + "...";
    } else {
      summary = await generateOneLineSummary(url, title, metadata.description || "");
      if (summary.length > SUMMARY_MAX) summary = summary.slice(0, SUMMARY_MAX - 3) + "...";
    }

    const read_time_minutes = metadata.html
      ? estimateReadTimeMinutes(metadata.html)
      : 1;
    const description = metadata.description?.slice(0, 500) || null;

    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("links")
      .select("id, is_read, read_at")
      .eq("url", url)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase
        .from("links")
        .update({
          domain,
          title,
          summary,
          description,
          read_time_minutes,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("links update error", error);
        return NextResponse.json(
          { ok: false, error: error.message || "Update failed" },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, link: updated as LinkRow });
    }

    const { data: inserted, error } = await supabase
      .from("links")
      .insert({
        url,
        domain,
        title,
        summary,
        description,
        read_time_minutes,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("links insert error", error);
      return NextResponse.json(
        { ok: false, error: error.message || "Insert failed" },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, link: inserted as LinkRow });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("Missing required environment variable")) {
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
    console.error("POST /api/links", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isReadParam = searchParams.get("is_read");
    const isLongReadParam = searchParams.get("is_long_read");
    const query = searchParams.get("query")?.trim() || "";

    const supabase = getSupabaseAdmin();
    let q = supabase.from("links").select("*");

    if (isLongReadParam === "true") {
      q = q.eq("is_long_read", true).order("long_read_rank", { ascending: true, nullsFirst: false });
    } else {
      q = q.order("created_at", { ascending: false });
    }

    if (isReadParam === "true") q = q.eq("is_read", true);
    else if (isReadParam === "false") q = q.eq("is_read", false);

    if (query) {
      const escaped = query.replace(/%/g, "\\%").replace(/_/g, "\\_");
      q = q.or(`title.ilike.%${escaped}%,url.ilike.%${escaped}%`);
    }

    const { data, error } = await q;

    if (error) {
      console.error("links list error", error);
      return NextResponse.json(
        { ok: false, error: error.message || "Fetch failed" },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, links: (data || []) as LinkRow[] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("Missing required environment variable")) {
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
    console.error("GET /api/links", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
