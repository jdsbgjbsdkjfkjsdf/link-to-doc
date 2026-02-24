/**
 * Build documents.batchUpdate requests for appending a checkbox item:
 * [ ] TITLE
 * summary (italic)
 * url
 *
 * Only the TITLE line is a checkbox; summary is italic subheadline; URL is a link.
 * Block is prefixed with one newline and ends with \n\n for exactly one blank line between entries.
 */

export type AppendBlock = {
  title: string;
  summary: string;
  url: string;
};

const PREFIX = "\n";

/**
 * Compute request payload for batchUpdate. insertionIndex is the 1-based index
 * where we insert (before the doc's final newline). Returns the array of requests
 * and the inserted text length.
 * Text = "\n" + title + "\n" + summary + "\n" + url + "\n\n" (one blank line between entries).
 */
export function buildAppendRequests(
  insertionIndex: number,
  block: AppendBlock,
  bulletPreset: "BULLET_CHECKBOX" | "BULLET_CHECKBOX_FILLED" = "BULLET_CHECKBOX"
): { requests: object[]; insertedLength: number } {
  const { title, summary, url } = block;

  const titleLine = `${title}\n`;
  const summaryLine = `${summary}\n`;
  const urlLine = `${url}\n\n`;
  const text = PREFIX + titleLine + summaryLine + urlLine;
  const insertedLength = text.length;

  const titleStart = insertionIndex + PREFIX.length;
  const titleEnd = titleStart + title.length + 1;
  const titleTextEndNoNl = titleStart + title.length;

  const summaryStart = titleEnd;
  const summaryEnd = summaryStart + summary.length;

  const urlStart = titleEnd + summaryLine.length;
  const urlEnd = urlStart + url.length;

  const requests: object[] = [
    {
      insertText: {
        location: { index: insertionIndex },
        text,
      },
    },
    {
      createParagraphBullets: {
        range: { startIndex: titleStart, endIndex: titleEnd },
        bulletPreset,
      },
    },
    {
      updateTextStyle: {
        range: { startIndex: titleStart, endIndex: titleTextEndNoNl },
        textStyle: { bold: true },
        fields: "bold",
      },
    },
    {
      updateTextStyle: {
        range: { startIndex: summaryStart, endIndex: summaryEnd },
        textStyle: { italic: true },
        fields: "italic",
      },
    },
    {
      updateTextStyle: {
        range: { startIndex: urlStart, endIndex: urlEnd },
        textStyle: { link: { url } },
        fields: "link",
      },
    },
  ];

  return { requests, insertedLength };
}
