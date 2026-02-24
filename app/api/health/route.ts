import { NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  getMissingSupabaseEnv,
  REQUIRED_SUPABASE_ENV,
} from "@/lib/supabase";

export async function GET() {
  const env = {
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  const openai = { configured: Boolean(process.env.OPENAI_API_KEY) };

  const missing = getMissingSupabaseEnv();
  if (missing.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing Supabase environment variables",
        required: [...REQUIRED_SUPABASE_ENV],
        hint: "Create a .env.local file in the project root and restart npm run dev.",
      },
      { status: 500 }
    );
  }

  let db = { ok: true as boolean };
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("links").select("id").limit(1).maybeSingle();
    if (error) {
      db = { ok: false };
      return NextResponse.json(
        {
          ok: false,
          error: "Database connection failed",
          details: error.message,
          db,
          openai,
          env,
        },
        { status: 500 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB connection failed";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        db: { ok: false },
        openai,
        env,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    db,
    openai,
    env,
  });
}
