import { describe, it, expect } from "vitest";
import { countCheckedTitleParagraphs } from "./count-read";

type DocContent = Parameters<typeof countCheckedTitleParagraphs>[0];

describe("countCheckedTitleParagraphs", () => {
  it("counts a list-item paragraph with bold + all runs strikethrough", () => {
    const content: DocContent = [
      {
        paragraph: {
          bullet: { listId: "kix.1" },
          elements: [
            {
              textRun: {
                content: "Example Title",
                textStyle: { bold: true, strikethrough: true },
              },
            },
            {
              textRun: {
                content: "\v",
                textStyle: { strikethrough: true },
              },
            },
          ],
        },
      },
    ];
    expect(countCheckedTitleParagraphs(content)).toBe(1);
  });

  it("does NOT count a normal paragraph with strikethrough (no listId)", () => {
    const content: DocContent = [
      {
        paragraph: {
          elements: [
            {
              textRun: {
                content: "Some struck text",
                textStyle: { strikethrough: true },
              },
            },
          ],
        },
      },
    ];
    expect(countCheckedTitleParagraphs(content)).toBe(0);
  });

  it("does NOT count a list item where only one run has strikethrough", () => {
    const content: DocContent = [
      {
        paragraph: {
          bullet: { listId: "kix.1" },
          elements: [
            {
              textRun: {
                content: "Title part ",
                textStyle: { bold: true, strikethrough: true },
              },
            },
            {
              textRun: {
                content: "summary part",
                textStyle: { bold: false, strikethrough: false },
              },
            },
          ],
        },
      },
    ];
    expect(countCheckedTitleParagraphs(content)).toBe(0);
  });

  it("does NOT count a list item with no bold (summary-only style)", () => {
    const content: DocContent = [
      {
        paragraph: {
          bullet: { listId: "kix.1" },
          elements: [
            {
              textRun: {
                content: "Only italic summary",
                textStyle: { italic: true, strikethrough: true },
              },
            },
          ],
        },
      },
    ];
    expect(countCheckedTitleParagraphs(content)).toBe(0);
  });

  it("does NOT count when bullet is missing", () => {
    const content: DocContent = [
      {
        paragraph: {
          elements: [
            {
              textRun: {
                content: "Bold and struck",
                textStyle: { bold: true, strikethrough: true },
              },
            },
          ],
        },
      },
    ];
    expect(countCheckedTitleParagraphs(content)).toBe(0);
  });

  it("does NOT count when listId is empty", () => {
    const content: DocContent = [
      {
        paragraph: {
          bullet: {},
          elements: [
            {
              textRun: {
                content: "Bold and struck",
                textStyle: { bold: true, strikethrough: true },
              },
            },
          ],
        },
      },
    ];
    expect(countCheckedTitleParagraphs(content)).toBe(0);
  });

  it("returns 0 for empty or invalid content", () => {
    expect(countCheckedTitleParagraphs(undefined)).toBe(0);
    expect(countCheckedTitleParagraphs([])).toBe(0);
  });

  it("counts multiple matching paragraphs", () => {
    const content: DocContent = [
      {
        paragraph: {
          bullet: { listId: "a" },
          elements: [
            { textRun: { content: "One", textStyle: { bold: true, strikethrough: true } } },
          ],
        },
      },
      {
        paragraph: {
          bullet: { listId: "a" },
          elements: [
            { textRun: { content: "Two", textStyle: { bold: true, strikethrough: true } } },
          ],
        },
      },
    ];
    expect(countCheckedTitleParagraphs(content)).toBe(2);
  });
});
