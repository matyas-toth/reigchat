// Shared server-side cache for zero-cost OpenRouter models
// Used by both /api/models and /api/chat to avoid duplicate fetches

let cache: { ids: Set<string>; ts: number } | null = null;
const TTL = 10 * 60 * 1000;

export async function getFreeModelIds(): Promise<Set<string>> {
  const now = Date.now();
  if (cache && now - cache.ts < TTL) return cache.ids;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
      next: { revalidate: 600 },
    });
    if (!res.ok) return cache?.ids ?? new Set();
    const json = await res.json();
    const ids = new Set<string>(
      (json.data ?? [])
        .filter((m: any) => m.pricing?.prompt === "0" && m.pricing?.completion === "0")
        .map((m: any) => m.id as string)
    );
    cache = { ids, ts: now };
    return ids;
  } catch {
    return cache?.ids ?? new Set();
  }
}
