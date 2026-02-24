import { describe, it, expect } from "vitest";
import { buildAppendRequests } from "./build-append-requests";
import { cleanTitle } from "./clean-title";
import { isDescriptionUseless } from "./summary";

const PREFIX = "\n";
const LINE_BREAK = "\u000b";

describe("buildAppendRequests", () => {
  it("builds insertText, createParagraphBullets, and updateTextStyle requests with correct indices", () => {
    const insertionIndex = 100;
    const block = {
      title: "Example Article",
      summary: "A short summary here.",
      url: "https://example.com/page",
    };
    const expectedText =
      PREFIX + block.title + LINE_BREAK + block.summary + LINE_BREAK + block.url + "\n\n";
    const { requests, insertedLength } = buildAppendRequests(
      insertionIndex,
      block
    );

    expect(requests).toHaveLength(5);

    const insertReq = requests[0] as { insertText: { location: { index: number }; text: string } };
    expect(insertReq.insertText.location.index).toBe(insertionIndex);
    expect(insertReq.insertText.text).toBe(expectedText);
    expect(insertedLength).toBe(expectedText.length);

    const titleStart = insertionIndex + PREFIX.length;
    const titleEnd = titleStart + block.title.length;
    const summaryStart = titleEnd + LINE_BREAK.length;
    const summaryEnd = summaryStart + block.summary.length;
    const urlStart = summaryEnd + LINE_BREAK.length;
    const urlEnd = urlStart + block.url.length;

    const bulletReq = requests[1] as {
      createParagraphBullets: { range: { startIndex: number; endIndex: number }; bulletPreset: string };
    };
    expect(bulletReq.createParagraphBullets.bulletPreset).toBe("BULLET_CHECKBOX");
    expect(bulletReq.createParagraphBullets.range.startIndex).toBe(titleStart);
    expect(bulletReq.createParagraphBullets.range.endIndex).toBe(urlEnd);

    const boldReq = requests[2] as {
      updateTextStyle: { range: { startIndex: number; endIndex: number }; textStyle: { bold: boolean }; fields: string };
    };
    expect(boldReq.updateTextStyle.textStyle.bold).toBe(true);
    expect(boldReq.updateTextStyle.range.startIndex).toBe(titleStart);
    expect(boldReq.updateTextStyle.range.endIndex).toBe(titleEnd);

    const italicReq = requests[3] as {
      updateTextStyle: { range: { startIndex: number; endIndex: number }; textStyle: { italic: boolean }; fields: string };
    };
    expect(italicReq.updateTextStyle.textStyle.italic).toBe(true);
    expect(italicReq.updateTextStyle.range.startIndex).toBe(summaryStart);
    expect(italicReq.updateTextStyle.range.endIndex).toBe(summaryEnd);

    const linkReq = requests[4] as {
      updateTextStyle: { range: { startIndex: number; endIndex: number }; textStyle: { link: { url: string } }; fields: string };
    };
    expect(linkReq.updateTextStyle.textStyle.link.url).toBe(block.url);
    expect(linkReq.updateTextStyle.range.startIndex).toBe(urlStart);
    expect(linkReq.updateTextStyle.range.endIndex).toBe(urlEnd);
  });

  it("checkbox range covers entire block so strikethrough applies to title + summary + url", () => {
    const insertionIndex = 50;
    const block = {
      title: "Title",
      summary: "Summary",
      url: "https://u.org",
    };
    const { requests } = buildAppendRequests(insertionIndex, block);

    const titleStart = insertionIndex + PREFIX.length;
    const titleEnd = titleStart + block.title.length;
    const summaryStart = titleEnd + LINE_BREAK.length;
    const summaryEnd = summaryStart + block.summary.length;
    const urlStart = summaryEnd + LINE_BREAK.length;
    const urlEnd = urlStart + block.url.length;

    const bulletReq = requests[1] as {
      createParagraphBullets: { range: { startIndex: number; endIndex: number } };
    };
    expect(bulletReq.createParagraphBullets.range).toEqual({
      startIndex: titleStart,
      endIndex: urlEnd,
    });

    const boldReq = requests[2] as {
      updateTextStyle: { range: { startIndex: number; endIndex: number } };
    };
    expect(boldReq.updateTextStyle.range).toEqual({
      startIndex: titleStart,
      endIndex: titleEnd,
    });

    const linkReq = requests[4] as {
      updateTextStyle: {
        range: { startIndex: number; endIndex: number };
        textStyle: { link: { url: string } };
      };
    };
    expect(linkReq.updateTextStyle.range.startIndex).toBe(urlStart);
    expect(linkReq.updateTextStyle.range.endIndex).toBe(urlEnd);
    expect(
      linkReq.updateTextStyle.range.endIndex - linkReq.updateTextStyle.range.startIndex
    ).toBe(block.url.length);
  });
});

describe("cleanTitle", () => {
  it("trims whitespace", () => {
    expect(cleanTitle("  Foo  ", "example.com")).toBe("Foo");
  });

  it("removes | SiteName suffix", () => {
    expect(cleanTitle("Article Title | Example", "example.com")).toBe("Article Title");
  });

  it("removes - SiteName suffix", () => {
    expect(cleanTitle("Article Title - Example", "example.com")).toBe("Article Title");
  });

  it("leaves title unchanged when no suffix", () => {
    expect(cleanTitle("Just a Title", "other.com")).toBe("Just a Title");
  });
});

describe("isDescriptionUseless", () => {
  it("returns true for empty or very short", () => {
    expect(isDescriptionUseless("")).toBe(true);
    expect(isDescriptionUseless("short")).toBe(true);
  });

  it("returns true for cookie/privacy/terms", () => {
    expect(isDescriptionUseless("Cookie policy and stuff")).toBe(true);
    expect(isDescriptionUseless("Privacy policy")).toBe(true);
  });

  it("returns false for a normal description", () => {
    expect(isDescriptionUseless("This page explains how to use the API.")).toBe(false);
  });
});
