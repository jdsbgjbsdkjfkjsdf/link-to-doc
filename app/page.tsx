"use client";

import { useState, useEffect } from "react";

const POLL_INTERVAL_MS = 10_000;

export default function Home() {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [articlesRead, setArticlesRead] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/read-count");
        const data = await res.json();
        if (res.ok && data.ok && typeof data.count === "number") {
          setArticlesRead(data.count);
        }
      } catch {
        // ignore poll errors
      }
    }
    fetchCount();
    const id = setInterval(fetchCount, POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchCount();
    };
    const onFocus = () => fetchCount();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const res = await fetch("/api/append", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), note: note.trim() || undefined }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to append");
      }

      setUrl("");
      setNote("");
      setStatus({ type: "ok", msg: "Added to Google Doc ✅" });
      const countRes = await fetch("/api/read-count");
      const countData = await countRes.json();
      if (countRes.ok && countData.ok && typeof countData.count === "number") {
        setArticlesRead(countData.count);
      }
    } catch (err: any) {
      setStatus({ type: "err", msg: err?.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl border rounded-xl p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold">Reading List</h1>
          <p className="text-sm tabular-nums text-neutral-600">
            Articles Read:{" "}
            <span className="font-medium underline decoration-neutral-400 decoration-2 underline-offset-2">
              {articlesRead ?? "—"}
            </span>
          </p>
        </div>
        <p className="text-sm opacity-80 mt-1">
          Paste a link and it will append to your Google Doc.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why you saved it"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full border rounded-lg px-3 py-2 font-medium"
          >
            {loading ? "Adding..." : "Add to Doc"}
          </button>

          {status && (
            <div
              className={`text-sm ${
                status.type === "ok" ? "text-green-700" : "text-red-700"
              }`}
            >
              {status.msg}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
