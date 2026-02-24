/**
 * Count checked checkbox title lines in a Google Doc (list item + bold + fully strikethrough).
 * Used for "Articles Read" counter. Avoids false positives from random strikethrough.
 */

type TextRun = {
  content?: string;
  textStyle?: { bold?: boolean; strikethrough?: boolean };
};

type StructuralElement = {
  startIndex?: number;
  endIndex?: number;
  paragraph?: {
    bullet?: { listId?: string };
    elements?: Array<{ textRun?: TextRun }>;
  };
};

function hasContent(run: TextRun): boolean {
  const c = run.content ?? "";
  return /[a-zA-Z0-9]/.test(c);
}

/**
 * Count paragraphs that are: list item (checkbox), title-like (has bold run), and fully checked (all content runs strikethrough).
 */
export function countCheckedTitleParagraphs(
  content: StructuralElement[] | undefined
): number {
  if (!content || !Array.isArray(content)) return 0;
  let count = 0;
  for (const el of content) {
    const para = el.paragraph;
    if (!para?.elements) continue;

    const runs =
      para.elements.flatMap((e) => (e.textRun ? [e.textRun] : [])) ?? [];
    const runsWithContent = runs.filter(hasContent);
    if (runsWithContent.length === 0) continue;

    const isListItem = !!(para.bullet && para.bullet.listId);
    const isTitleLike = runsWithContent.some(
      (r) => r.textStyle?.bold === true
    );
    const isChecked =
      runsWithContent.length > 0 &&
      runsWithContent.every((r) => r.textStyle?.strikethrough === true);

    if (isListItem && isTitleLike && isChecked) count++;
  }
  return count;
}
