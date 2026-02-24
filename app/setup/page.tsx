"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { HealthPayload } from "@/lib/health-types";

type SetupInfo = {
  ok: boolean;
  missingEnv: string[];
  schemaSql: string;
  health: HealthPayload | null;
};

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

export default function SetupPage() {
  const [info, setInfo] = useState<SetupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyDone, setCopyDone] = useState(false);
  const [templateCopyDone, setTemplateCopyDone] = useState(false);
  const [healthResult, setHealthResult] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  useEffect(() => {
    fetch("/api/setup-info", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setInfo(data);
      })
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, []);

  const ENV_TEMPLATE = `NEXT_PUBLIC_SUPABASE_URL=<paste Project URL here>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste anon public key here>
SUPABASE_SERVICE_ROLE_KEY=<paste service_role key here>`;

  function copySchema() {
    if (!info?.schemaSql) return;
    navigator.clipboard.writeText(info.schemaSql);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  }

  function copyTemplate() {
    navigator.clipboard.writeText(ENV_TEMPLATE);
    setTemplateCopyDone(true);
    setTimeout(() => setTemplateCopyDone(false), 2000);
  }

  async function runHealthCheck() {
    setHealthLoading(true);
    setHealthResult(null);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      setHealthResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setHealthResult(err instanceof Error ? err.message : "Request failed");
    } finally {
      setHealthLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-2xl">
          <p className="text-neutral-500">Loading setup info…</p>
        </div>
      </main>
    );
  }

  if (!info?.ok) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-2xl">
          <p className="text-red-600">Could not load setup info. Check the dev server.</p>
          <Link href="/" className="mt-4 inline-block text-sm underline">
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  const { missingEnv, schemaSql, health } = info;
  const envOk = missingEnv.length === 0;
  const dbOk = health?.db?.ok ?? false;
  const allOk = health?.ok === true;
  const details =
    health && !health.ok && "details" in health ? health.details ?? "" : "";
  const tableNotFound =
    !dbOk &&
    (String(health?.ok === false ? health.error ?? "" : "").toLowerCase().includes("could not find the table") ||
      details.toLowerCase().includes("could not find the table"));

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900">Setup Wizard</h1>
          <Link href="/" className="text-sm text-neutral-600 underline hover:text-neutral-900">
            ← Back to home
          </Link>
        </div>

        <p className="text-neutral-600">
          Follow these steps to configure Supabase and get the app running locally.
        </p>

        {/* Step 1 */}
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-medium">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                envOk ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {envOk ? "✓" : "1"}
            </span>
            Create .env.local and add required keys
          </h2>
          <p className="mb-3 text-sm text-neutral-500">
            Copy <code className="rounded bg-neutral-100 px-1">.env.example</code> to{" "}
            <code className="rounded bg-neutral-100 px-1">.env.local</code> in the project root.
          </p>
          <p className="mb-2 text-sm font-medium text-neutral-700">Required keys:</p>
          <ul className="list-inside list-disc text-sm text-neutral-600">
            {REQUIRED_KEYS.map((key) => (
              <li key={key}>
                <code className="rounded bg-neutral-100 px-1">{key}</code>
                {missingEnv.includes(key) && (
                  <span className="ml-2 text-amber-600">(missing)</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Step 2 */}
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-medium">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-sm text-neutral-700">
              2
            </span>
            Paste Supabase URL, anon key, and service_role key
          </h2>
          <p className="mb-2 text-sm text-neutral-600">
            In Supabase: <strong>Project Settings → API</strong>. Copy:
          </p>
          <ul className="list-inside list-disc text-sm text-neutral-600">
            <li>
              <strong>Project URL</strong> → <code className="rounded bg-neutral-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>
            </li>
            <li>
              <strong>anon public</strong> key → <code className="rounded bg-neutral-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            </li>
            <li>
              <strong>service_role</strong> key → <code className="rounded bg-neutral-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> (keep secret)
            </li>
          </ul>
          <p className="mt-3 text-sm font-medium text-neutral-700">Show me exactly what to paste</p>
          <p className="mb-2 text-xs text-neutral-500">Template (not real secrets — replace the placeholders in .env.local)</p>
          <pre className="max-h-32 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-800">
            <code>{ENV_TEMPLATE}</code>
          </pre>
          <button
            type="button"
            onClick={copyTemplate}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {templateCopyDone ? "Copied!" : "Copy template"}
          </button>
        </section>

        {/* Step 3 */}
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-medium">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-sm text-neutral-700">
              3
            </span>
            Run schema in Supabase SQL Editor
          </h2>
          <p className="mb-3 text-sm text-neutral-500">
            In Supabase: <strong>SQL Editor → New query</strong>. Paste the SQL below and run it.
          </p>
          <div className="relative">
            <pre className="max-h-64 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-800">
              <code>{schemaSql || "-- (no schema loaded)"}</code>
            </pre>
            <button
              type="button"
              onClick={copySchema}
              className="mt-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {copyDone ? "Copied!" : "Copy SQL"}
            </button>
          </div>
        </section>

        {/* Step 4 */}
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-medium">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-sm text-neutral-700">
              4
            </span>
            Restart the dev server
          </h2>
          <p className="text-sm text-neutral-600">
            Stop the server (<kbd className="rounded border bg-neutral-100 px-1">Ctrl+C</kbd>) and run{" "}
            <code className="rounded bg-neutral-100 px-1">npm run dev</code> or{" "}
            <code className="rounded bg-neutral-100 px-1">npm run dev:3001</code> again.
          </p>
        </section>

        {/* Step 5 */}
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-medium">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                allOk ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-700"
              }`}
            >
              {allOk ? "✓" : "5"}
            </span>
            Verify /api/health
          </h2>
          <div className="space-y-2 text-sm">
            <p>
              Health:{" "}
              {health?.ok ? (
                <span className="font-medium text-emerald-700">ok</span>
              ) : (
                <span className="text-red-600">{health && !health.ok ? health.error ?? "error" : "—"}</span>
              )}
            </p>
            <p>
              Database:{" "}
              {dbOk ? (
                <span className="font-medium text-emerald-700">ok</span>
              ) : tableNotFound ? (
                <span className="text-red-600">
                  The links table does not exist. Run schema.sql in Supabase SQL Editor.
                </span>
              ) : (
                <span className="text-amber-600">unreachable or schema not run</span>
              )}
            </p>
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="inline-block text-neutral-600 underline hover:text-neutral-900"
            >
              Open /api/health →
            </a>
          </div>
          <p className="mt-3 text-sm font-medium text-neutral-700">Is it working?</p>
          <button
            type="button"
            disabled={healthLoading}
            onClick={runHealthCheck}
            className="mt-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {healthLoading ? "Running…" : "Run health check"}
          </button>
          {healthResult !== null && (
            <pre className="mt-3 max-h-48 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-800">
              <code>{healthResult}</code>
            </pre>
          )}
        </section>
      </div>
    </main>
  );
}
