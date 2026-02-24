import { describe, it, expect } from "vitest";
import { getWordCountFromHtml, estimateReadTimeMinutes } from "./read-time";

describe("read-time", () => {
  it("strips tags and counts words", () => {
    const html = "<p>Hello world</p><div>foo bar</div>";
    expect(getWordCountFromHtml(html)).toBe(4);
  });

  it("returns at least 1 minute", () => {
    expect(estimateReadTimeMinutes("<p>short</p>")).toBe(1);
  });
});
