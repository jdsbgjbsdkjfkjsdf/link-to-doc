/**
 * Fetch a URL and extract title and description from HTML.
 * Preference: og:title → <title> → hostname; og:description → meta description → "".
 */

function getMetaContent(html: string, attr: "property" | "name", value: string): string | null {
  const regex = new RegExp(
    `<meta[^>]+${attr}=["']${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );
  const m = html.match(regex);
  if (m) return m[1].trim();
  const reverse = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
    "i"
  );
  const m2 = html.match(reverse);
  return m2 ? m2[1].trim() : null;
}

function getTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/<[^>]+>/g, "").trim() : null;
}

export type UrlMetadata = {
  title: string;
  description: string;
  hostname: string;
};

export type UrlMetadataWithHtml = UrlMetadata & { html?: string };

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  const result = await fetchUrlMetadataWithHtml(url);
  return { title: result.title, description: result.description, hostname: result.hostname };
}

/** Like fetchUrlMetadata but also returns raw HTML when fetch succeeds (for read-time calculation). */
export async function fetchUrlMetadataWithHtml(url: string): Promise<UrlMetadataWithHtml> {
  const hostname = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "unknown";
    }
  })();

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; link-to-doc/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const ogTitle = getMetaContent(html, "property", "og:title");
    const pageTitle = getTitle(html);
    const title =
      (ogTitle && ogTitle.length > 0) || (pageTitle && pageTitle.length > 0)
        ? (ogTitle || pageTitle || hostname)!
        : hostname;

    const ogDesc = getMetaContent(html, "property", "og:description");
    const metaDesc = getMetaContent(html, "name", "description");
    const description =
      (ogDesc && ogDesc.length > 0) || (metaDesc && metaDesc.length > 0)
        ? (ogDesc || metaDesc || "").trim()
        : "";

    return { title, description, hostname, html };
  } catch {
    return {
      title: hostname,
      description: "",
      hostname,
    };
  }
}
