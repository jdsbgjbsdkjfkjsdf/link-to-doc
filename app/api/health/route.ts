import { NextResponse } from "next/server";
import { getHealthPayload } from "@/lib/health";

export async function GET() {
  const payload = await getHealthPayload();
  return NextResponse.json(payload, {
    status: payload.ok ? 200 : 500,
  });
}
