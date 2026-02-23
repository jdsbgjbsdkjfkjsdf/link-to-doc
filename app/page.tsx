"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

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
    } catch (err: any) {
      setStatus({ type: "err", msg: err?.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl border rounded-xl p-6">
        <h1 className="text-2xl font-semibold">Reading List</h1>
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
