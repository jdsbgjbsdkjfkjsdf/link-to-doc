/**
 * Build documents.batchUpdate requests for appending a checkbox item:
 * [ ] TITLE
 *     summary (italic)
 *     url (link)
 *
 * The whole block is ONE paragraph (soft line breaks between lines) so that when
 * the checkbox is checked, strikethrough applies to the entire entry, not just the title.
 * Block is prefixed with \n and ends with \n\n for exactly one blank line between entries.
 */

export type AppendBlock = {
  title: string;
  summary: string;
  url: string;
};

const PREFIX = "\n";
/** Soft line break (Shift+Enter) — same paragraph, so checkbox strikethrough covers all lines. */
const LINE_BREAK = "\u000b";

/**
 * Compute request payload for batchUpdate. insertionIndex is the 1-based index
 * where we insert (before the doc's final newline). Returns the array of requests
 * and the inserted text length.
 * Text = "\n" + title + softBreak + summary + softBreak + url + "\n\n".
 */
export function buildAppendRequests(
  insertionIndex: number,
  block: AppendBlock,
  bulletPreset: "BULLET_CHECKBOX" | "BULLET_CHECKBOX_FILLED" = "BULLET_CHECKBOX"
): { requests: object[]; insertedLength: number } {
  const { title, summary, url } = block;

  const text =
    PREFIX + title + LINE_BREAK + summary + LINE_BREAK + url + "\n\n";
  const insertedLength = text.length;

  const titleStart = insertionIndex + PREFIX.length;
  const titleEnd = titleStart + title.length;
  const summaryStart = titleEnd + LINE_BREAK.length;
  const summaryEnd = summaryStart + summary.length;
  const urlStart = summaryEnd + LINE_BREAK.length;
  const urlEnd = urlStart + url.length;

  const blockEnd = urlEnd;

  const requests: object[] = [
    {
      insertText: {
        location: { index: insertionIndex },
        text,
      },
    },
    {
      createParagraphBullets: {
        range: { startIndex: titleStart, endIndex: blockEnd },
        bulletPreset,
      },
    },
    {
      updateTextStyle: {
        range: { startIndex: titleStart, endIndex: titleEnd },
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
