/**
 * Estimate read time from HTML by stripping tags and counting words.
 * read_time_minutes = max(1, round(words / 220)).
 */

export function getWordCountFromHtml(html: string): number {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text.split(/\s+/).filter(Boolean);
  return words.length;
}

const WORDS_PER_MINUTE = 220;

export function estimateReadTimeMinutes(html: string): number {
  const words = getWordCountFromHtml(html);
  const minutes = Math.round(words / WORDS_PER_MINUTE);
  return Math.max(1, minutes);
}
