"use client";

import { useState, useEffect, useCallback } from "react";

type LinkItem = {
  id: string;
  url: string;
  domain: string | null;
  title: string | null;
  summary: string | null;
  is_read: boolean;
  read_time_minutes: number | null;
  created_at: string;
};

const SEARCH_DEBOUNCE_MS = 300;

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function Home() {
  const [tab, setTab] = useState<"unread" | "read">("unread");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [linksError, setLinksError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ unreadCount: number; readCount: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [healthFailed, setHealthFailed] = useState<boolean | null>(null);

  // Initial health check
  useEffect(() => {
    let cancelled = false;
    fetch("/api/health", { cache: "no-store" })
      .then((res) => {
        if (cancelled) return;
        setHealthFailed(!res.ok);
      })
      .catch(() => {
        if (!cancelled) setHealthFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStats({ unreadCount: data.unreadCount ?? 0, readCount: data.readCount ?? 0 });
      }
    } catch {
      // keep previous stats
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchLinks = useCallback(async () => {
    setLinksLoading(true);
    setLinksError(null);
    try {
      const params = new URLSearchParams();
      params.set("is_read", tab === "read" ? "true" : "false");
      if (searchDebounced) params.set("query", searchDebounced);
      const res = await fetch(`/api/links?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setLinksError(data?.error ?? `HTTP ${res.status}`);
        setLinks([]);
        return;
      }
      setLinks((data.links ?? []) as LinkItem[]);
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : "Failed to load");
      setLinks([]);
    } finally {
      setLinksLoading(false);
    }
  }, [tab, searchDebounced]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const url = addUrl.trim();
    if (!url) return;
    setStatus(null);
    setAddLoading(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error ?? "Failed to add link");
      }
      setAddUrl("");
      setStatus({ type: "ok", msg: "Added to inbox" });
      await Promise.all([fetchLinks(), fetchStats()]);
    } catch (err: unknown) {
      setStatus({
        type: "err",
        msg: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setAddLoading(false);
    }
  }

  async function handleToggle(link: LinkItem) {
    setTogglingId(link.id);
    try {
      const res = await fetch(`/api/links/${link.id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: !link.is_read }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        await Promise.all([fetchLinks(), fetchStats()]);
      }
    } finally {
      setTogglingId(null);
    }
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-4 md:p-6">
      {healthFailed === true && (
        <div
          className="mb-4 w-full rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          Supabase not configured or database unreachable. Check{" "}
          <a href="/api/health" target="_blank" rel="noreferrer" className="underline">
            /api/health
          </a>{" "}
          for details.
        </div>
      )}
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-neutral-900">Reading Inbox</h1>
          <div className="flex gap-3">
            <div className="rounded-full bg-amber-100 px-4 py-2 text-center">
              <span className="text-xs font-medium text-amber-800">Unread</span>
              <div className="text-xl font-bold tabular-nums text-amber-900">
                {statsLoading ? "—" : (stats?.unreadCount ?? 0)}
              </div>
            </div>
            <div className="rounded-full bg-emerald-100 px-4 py-2 text-center">
              <span className="text-xs font-medium text-emerald-800">Read</span>
              <div className="text-xl font-bold tabular-nums text-emerald-900">
                {statsLoading ? "—" : (stats?.readCount ?? 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Add link */}
        <form onSubmit={handleAdd} className="mb-6 flex gap-2">
          <input
            type="url"
            value={addUrl}
            onChange={(e) => setAddUrl(e.target.value)}
            placeholder="Paste URL to save..."
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            disabled={addLoading}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {addLoading ? "Adding…" : "Add link"}
          </button>
        </form>
        {status && (
          <p
            className={`mb-4 text-sm ${status.type === "ok" ? "text-green-700" : "text-red-600"}`}
          >
            {status.msg}
          </p>
        )}

        {/* Tabs */}
        <div className="mb-3 flex gap-1 rounded-lg bg-neutral-200 p-1">
          <button
            type="button"
            onClick={() => setTab("unread")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              tab === "unread" ? "bg-white text-neutral-900 shadow" : "text-neutral-600"
            }`}
          >
            Unread
          </button>
          <button
            type="button"
            onClick={() => setTab("read")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              tab === "read" ? "bg-white text-neutral-900 shadow" : "text-neutral-600"
            }`}
          >
            Read
          </button>
        </div>

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or URL..."
          className="mb-4 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          aria-label="Search"
        />

        {/* List */}
        {linksError && (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {linksError}
          </p>
        )}
        {linksLoading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : links.length === 0 ? (
          <p className="text-sm text-neutral-500">
            {tab === "unread" ? "No unread links." : "No read links."}
          </p>
        ) : (
          <ul className="space-y-3">
            {links.map((link) => (
              <li
                key={link.id}
                className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-500"
                    >
                      {link.title || link.url}
                    </a>
                    {link.summary && (
                      <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{link.summary}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
                      {link.domain && <span>{link.domain}</span>}
                      {link.read_time_minutes != null && (
                        <span>{link.read_time_minutes} min read</span>
                      )}
                      <span>{formatDate(link.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => copyLink(link.url)}
                      className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                      title="Copy link"
                      aria-label="Copy link"
                    >
                      <CopyIcon />
                    </button>
                    <button
                      type="button"
                      disabled={togglingId === link.id}
                      onClick={() => handleToggle(link)}
                      className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                    >
                      {togglingId === link.id
                        ? "…"
                        : link.is_read
                          ? "Mark unread"
                          : "Mark read"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}
