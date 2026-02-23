import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: Request) {
  try {
    const { url, note } = await req.json();

    if (!url || !url.startsWith("http")) {
      return NextResponse.json(
        { ok: false, error: "Invalid URL" },
        { status: 400 }
      );
    }

    const creds = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON as string
    );

    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/documents"],
    });

    const client = await auth.getClient();
    const docs = google.docs({ version: "v1", auth });

    const docId = process.env.GOOGLE_DOC_ID as string;

    const doc = await docs.documents.get({
      documentId: docId,
    });

    const content = doc.data.body?.content;
    const endIndex =
      content && content.length > 0
        ? content[content.length - 1].endIndex! - 1
        : 1;

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: process.env.TZ || "America/New_York",
    });

    const textLine = note
      ? `• ${url} — ${note} (${timestamp})\n`
      : `• ${url} (${timestamp})\n`;

    const insertionIndex = endIndex;
    const urlStartIndex = insertionIndex + 2; // after "• "
    const urlEndIndex = urlStartIndex + url.length;

    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: insertionIndex },
              text: textLine,
            },
          },
          {
            updateTextStyle: {
              range: {
                startIndex: urlStartIndex,
                endIndex: urlEndIndex,
              },
              textStyle: { link: { url } },
              fields: "link",
            },
          },
        ],
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error(error);

    const err = error as { code?: number; message?: string; response?: { data?: { error?: { message?: string } } } };
    const is403 =
      err.code === 403 ||
      (typeof err.message === "string" &&
        (err.message.includes("has not been used") || err.message.includes("disabled")));

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
