/**
 * Shared health check logic. Returns payload for /api/health and /api/setup-info.
 */

import {
  getSupabaseAdmin,
  getMissingSupabaseEnv,
  REQUIRED_SUPABASE_ENV,
} from "@/lib/supabase";

export type HealthPayload = {
  ok: boolean;
  error?: string;
  required?: readonly string[];
  hint?: string;
  details?: string;
  db?: { ok: boolean };
  openai?: { configured: boolean };
  env?: {
    hasSupabaseUrl: boolean;
    hasAnonKey: boolean;
    hasServiceRoleKey: boolean;
  };
};

export async function getHealthPayload(): Promise<HealthPayload> {
  const env = {
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  const openai = { configured: Boolean(process.env.OPENAI_API_KEY) };

  const missing = getMissingSupabaseEnv();
  if (missing.length > 0) {
    const errorMsg =
      missing.length === 1
        ? `Missing ${missing[0]} in .env.local.`
        : `Missing Supabase environment variables: ${missing.join(", ")}`;
    return {
      ok: false,
      error: errorMsg,
      required: [...REQUIRED_SUPABASE_ENV],
      hint: "Create a .env.local file in the project root and restart npm run dev.",
      env,
      openai,
    };
  }

  let db = { ok: true as boolean };
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("links").select("id").limit(1).maybeSingle();
    if (error) {
      db = { ok: false };
      return {
        ok: false,
        error: "Database unreachable. Confirm schema.sql was run in Supabase.",
        details: error.message,
        db,
        openai,
        env,
      };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB connection failed";
    return {
      ok: false,
      error: message,
      db: { ok: false },
      openai,
      env,
    };
  }

  return { ok: true, db, openai, env };
}
