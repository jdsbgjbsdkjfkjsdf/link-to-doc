/**
 * Clean page title: trim and remove common site suffixes like " | SiteName", " - SiteName".
 */

export function cleanTitle(title: string, hostname: string): string {
  let t = title.trim();
  if (!t) return t;

  const siteName = hostname.replace(/^www\./, "").split(".")[0];
  if (!siteName) return t;

  const patterns = [
    new RegExp(`\\s*[|\\-–—]\\s*${escapeRegex(siteName)}\\s*$`, "i"),
    new RegExp(`\\s*[|\\-–—]\\s*${escapeRegex(hostname)}\\s*$`, "i"),
  ];

  for (const p of patterns) {
    t = t.replace(p, "").trim();
  }
  return t;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
