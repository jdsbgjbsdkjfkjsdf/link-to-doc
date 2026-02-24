import { NextResponse } from "next/server";
import { google } from "googleapis";
import { countCheckedTitleParagraphs } from "@/lib/count-read";

const CACHE_TTL_MS = 5000;

let cache: { docId: string; value: number; ts: number } | null = null;

function getCachedCount(docId: string): number | null {
  if (!cache || cache.docId !== docId) return null;
  if (Date.now() - cache.ts >= CACHE_TTL_MS) return null;
  return cache.value;
}

function setCachedCount(docId: string, value: number): void {
  cache = { docId, value, ts: Date.now() };
}

export async function GET() {
  try {
    const docId = process.env.GOOGLE_DOC_ID as string;
    if (!docId) {
      return NextResponse.json(
        { ok: false, error: "GOOGLE_DOC_ID not configured" },
        { status: 500 }
      );
    }

    const cached = getCachedCount(docId);
    if (cached !== null) {
      return NextResponse.json({ ok: true, count: cached });
    }

    const creds = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON as string
    );
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/documents"],
    });
    const docs = google.docs({ version: "v1", auth });

    const doc = await docs.documents.get({ documentId: docId });
    const content = doc.data.body?.content as Parameters<
      typeof countCheckedTitleParagraphs
    >[0];
    const count = countCheckedTitleParagraphs(content);

    setCachedCount(docId, count);

    return NextResponse.json({ ok: true, count });
  } catch (error: unknown) {
    console.error("[read-count]", error);
    const err = error as { code?: number; message?: string };
    if (err.code === 403) {
      return NextResponse.json(
        { ok: false, error: "Access denied to document" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { ok: false, error: err.message ?? "Failed to get read count" },
      { status: 500 }
    );
  }
}
