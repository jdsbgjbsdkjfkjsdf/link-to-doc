import { NextResponse } from "next/server";
import type { HealthPayload } from "@/lib/health-types";
import { getHealthPayload } from "@/lib/health";

export async function GET() {
  const payload: HealthPayload = await getHealthPayload();
  return NextResponse.json(payload, {
    status: payload.ok ? 200 : 500,
  });
}
