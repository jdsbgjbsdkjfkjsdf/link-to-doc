import { NextResponse } from "next/server";
import { google } from "googleapis";
import { fetchUrlMetadata } from "@/lib/metadata";
import { cleanTitle } from "@/lib/clean-title";
import {
  isDescriptionUseless,
  generateOneLineSummary,
} from "@/lib/summary";
import { buildAppendRequests } from "@/lib/build-append-requests";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, dryRun } = body as { url?: string; note?: string; dryRun?: boolean };

    if (!url || !url.startsWith("http")) {
      return NextResponse.json(
        { ok: false, error: "Invalid URL" },
        { status: 400 }
      );
    }

    const metadata = await fetchUrlMetadata(url);
    const title = cleanTitle(metadata.title, metadata.hostname);
    let summary =
      metadata.description && !isDescriptionUseless(metadata.description)
        ? metadata.description.replace(/\n/g, " ").trim()
        : "";

    if (!summary) {
      summary = await generateOneLineSummary(
        url,
        title,
        metadata.description
      );
    } else if (summary.length > 140) {
      summary = summary.slice(0, 137) + "...";
    }

    const block = {
      title,
      summary: summary || "(No summary available)",
      url,
    };

    const docId = process.env.GOOGLE_DOC_ID as string;
    if (!docId) {
      return NextResponse.json(
        { ok: false, error: "GOOGLE_DOC_ID not configured" },
        { status: 500 }
      );
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
    const docEndIndex = doc.data.body?.content?.at(-1)?.endIndex ?? 1;
    const docWasEmpty = docEndIndex <= 2;
    const insertionIndex = docWasEmpty
      ? 1
      : Math.max(1, docEndIndex - 1);

    const { requests, insertedLength } = buildAppendRequests(
      insertionIndex,
      block
    );

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        block: { title: block.title, summary: block.summary, url: block.url },
        insertionIndex,
        insertedLength,
        docEndIndex,
        ...(docWasEmpty && { docWasEmpty: true }),
        batchUpdatePayload: {
          documentId: docId,
          requestBody: { requests },
        },
      });
    }

    try {
      await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: { requests },
      });
    } catch (bulletError: unknown) {
      const err = bulletError as { message?: string; response?: { data?: { error?: { message?: string } } } };
      const msg = typeof err.message === "string" ? err.message : err.response?.data?.error?.message ?? "";
      const isBulletReject =
        /bullet|bulletPreset|BULLET_CHECKBOX/i.test(msg);
      if (isBulletReject) {
        const { requests: fallbackRequests } = buildAppendRequests(
          insertionIndex,
          block,
          "BULLET_CHECKBOX_FILLED"
        );
        await docs.documents.batchUpdate({
          documentId: docId,
          requestBody: { requests: fallbackRequests },
        });
        console.log("[append] Used BULLET_CHECKBOX_FILLED after BULLET_CHECKBOX was rejected:", msg);
      } else {
        throw bulletError;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error(error);

    const err = error as {
      code?: number;
      message?: string;
      response?: { data?: { error?: { message?: string } } };
    };
    const is403 =
      err.code === 403 ||
      (typeof err.message === "string" &&
        (err.message.includes("has not been used") ||
          err.message.includes("disabled")));

    if (is403) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Google Docs API has not been used in this project or it is disabled. Enable the Google Docs API in Google Cloud Console for the correct project and wait a few minutes.",
        },
        { status: 403 }
      );
    }

    let errorMessage = "Server error";
    if (typeof err.message === "string" && err.message) {
      errorMessage = err.message;
    } else if (err.response?.data?.error?.message) {
      errorMessage = err.response.data.error.message;
    }

    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
