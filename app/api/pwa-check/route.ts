import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const publicDir = path.join(process.cwd(), "public");
const appDir = path.join(process.cwd(), "app");

export async function GET() {
  const hasPublicManifest = fs.existsSync(path.join(publicDir, "manifest.webmanifest"));
  const hasRouteManifest = fs.existsSync(path.join(appDir, "manifest.ts"));
  const hasSw = fs.existsSync(path.join(publicDir, "sw.js"));

  let icons: string[] = [];
  if (fs.existsSync(publicDir)) {
    icons = fs.readdirSync(publicDir).filter((f) => {
      const lower = f.toLowerCase();
      return lower.startsWith("icon") || lower === "apple-touch-icon.png";
    });
  }

  return NextResponse.json({
    ok: true,
    hasPublicManifest,
    hasRouteManifest,
    hasSw,
    icons,
  });
}
