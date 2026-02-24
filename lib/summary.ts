const MAX_DESCRIPTION_LENGTH = 200;
const SUMMARY_MAX_CHARS = 140;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/**
 * Heuristic: description is "useless" if it's too short, too long, or looks like a generic tagline.
 */
export function isDescriptionUseless(description: string): boolean {
  if (!description || description.length < 10) return true;
  if (description.length > MAX_DESCRIPTION_LENGTH) return true;
  const lower = description.toLowerCase();
  if (lower.includes("cookie") && lower.includes("policy")) return true;
  if (lower.includes("privacy") && lower.includes("policy")) return true;
  if (lower.includes("terms of service")) return true;
  if (/^[\w\s]+\.(com|org|io)$/i.test(description.trim())) return true;
  return false;
}

/**
 * Generate a one-line summary via OpenAI. Returns "(No summary available)" if no API key or request fails.
 */
export async function generateOneLineSummary(
  url: string,
  title: string,
  existingDescription: string
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.trim() === "") {
    return "(No summary available)";
  }

  const prompt = `Write ONE concise sentence (<= 140 chars) summarizing what this webpage is about. No quotes. No emojis.

URL: ${url}
Title: ${title}
${existingDescription ? `Meta description: ${existingDescription}` : ""}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 80,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI API error:", res.status, err);
      return "(No summary available)";
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return "(No summary available)";

    const oneLine = content.replace(/\n/g, " ").trim();
    return oneLine.length > SUMMARY_MAX_CHARS
      ? oneLine.slice(0, SUMMARY_MAX_CHARS - 3) + "..."
      : oneLine;
  } catch (e) {
    console.error("OpenAI summary error:", e);
    return "(No summary available)";
  }
}
