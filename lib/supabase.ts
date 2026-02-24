/**
 * Supabase clients.
 * - getSupabaseAdmin: service role (server-only, for API routes).
 * - createBrowserClient: anon key (client-side). Call createBrowserClient() in components.
 */

import { createClient } from "@supabase/supabase-js";

/** Required env var names for Supabase (used by health check and clients). */
export const REQUIRED_SUPABASE_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}.
Make sure it is defined in .env.local and restart the dev server.`);
  }
  return value;
}

/** Returns list of required Supabase env var names that are missing. */
export function getMissingSupabaseEnv(): readonly string[] {
  return REQUIRED_SUPABASE_ENV.filter((name) => !process.env[name]);
}

function warnIfMissingInDev(): void {
  if (process.env.NODE_ENV !== "production") {
    const missing = getMissingSupabaseEnv();
    if (missing.length > 0) {
      console.warn(
        "⚠️ Supabase env vars missing. Create .env.local and restart dev server."
      );
    }
  }
}

/** Server-only. Use in API routes for writes and bypass RLS. */
export function getSupabaseAdmin() {
  warnIfMissingInDev();
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

/** Client-side. Use in browser for optional future auth. */
export function createBrowserClient() {
  warnIfMissingInDev();
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, anonKey);
}
