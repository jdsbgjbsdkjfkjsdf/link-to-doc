import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import type { HealthPayload } from "@/lib/health-types";
import { getMissingSupabaseEnv } from "@/lib/supabase";
import { getHealthPayload } from "@/lib/health";

export async function GET() {
  try {
    const missingEnv = [...getMissingSupabaseEnv()];
    let schemaSql = "";
    try {
      const path = join(process.cwd(), "supabase", "schema.sql");
      schemaSql = readFileSync(path, "utf-8");
    } catch {
      schemaSql = "-- supabase/schema.sql not found";
    }
    const health: HealthPayload = await getHealthPayload();

    return NextResponse.json({
      ok: true,
      missingEnv,
      schemaSql,
      health,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Setup info failed";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
