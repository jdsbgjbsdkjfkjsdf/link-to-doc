/**
 * Startup env check: ensure .env.local exists, required Supabase vars are set and real.
 * Creates .env.local from .env.example if missing. Loads from project root.
 * Exit 1 if any required var is missing or still a placeholder.
 */

import path from "path";
import fs from "fs";
import { config } from "dotenv";

const root = process.cwd();
const envLocalPath = path.resolve(root, ".env.local");
const envExamplePath = path.resolve(root, ".env.example");

// 1) Ensure .env.local exists
if (!fs.existsSync(envLocalPath)) {
  if (!fs.existsSync(envExamplePath)) {
    console.error("❌ .env.example not found. Cannot create .env.local.");
    process.exit(1);
  }
  const example = fs.readFileSync(envExamplePath, "utf-8");
  fs.writeFileSync(envLocalPath, example, "utf-8");
  console.log("Created .env.local from .env.example.");
  console.error("\n⚠️  Fill in real Supabase values in .env.local, then run npm run check:env again.");
  process.exit(1);
}

// Load .env.local from project root
config({ path: envLocalPath });

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const PLACEHOLDERS = [
  "https://your-project.supabase.co",
  "your-anon-key",
  "your-service-role-key",
];

const missing = REQUIRED.filter((name) => {
  const v = process.env[name];
  return v === undefined || v === "";
});

if (missing.length > 0) {
  console.error("❌ Missing Supabase env vars:");
  missing.forEach((name) => console.error("  -", name));
  console.error("\nCreate .env.local from .env.example and restart.");
  process.exit(1);
}

// 2) Check for blank or placeholder values
const values = REQUIRED.map((name) => ({ name, value: (process.env[name] || "").trim() }));
const emptyOrPlaceholder = values.filter(({ name, value }) => {
  if (!value) return true;
  const lower = value.toLowerCase();
  if (lower.includes("your-project") || lower.includes("your-anon") || lower.includes("your-service-role")) return true;
  if (PLACEHOLDERS.some((p) => value === p)) return true;
  return false;
});

if (emptyOrPlaceholder.length > 0) {
  console.error("❌ Supabase env vars are present but empty or placeholders.");
  emptyOrPlaceholder.forEach(({ name }) => console.error("  -", name));
  console.error("\nOpen .env.local and paste real values from Supabase → Project Settings → API.");
  process.exit(1);
}

// 3) Print first 10 chars (masked) of each
console.log("Supabase env (first 10 chars):");
for (const { name, value } of values) {
  const masked = value.length <= 10 ? value + "..." : value.slice(0, 10) + "...";
  console.log(`  ${name}: ${masked}`);
}

console.log("\n✅ Supabase env vars detected.");
console.log("\nTo fill or update .env.local:");
console.log("  1. Open Supabase → Project Settings → API");
console.log("  2. Copy: Project URL, anon public key, service_role key");
console.log("  3. Paste into .env.local (replace placeholder lines)");
console.log("  4. Restart: npm run dev");
