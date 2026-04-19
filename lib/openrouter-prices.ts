/**
 * Server-side cache for OpenRouter model pricing.
 * Maps modelId → { inputPerM, outputPerM } in $/1M tokens.
 * TTL: 10 minutes.
 */

interface ModelPricing {
  inputPerM: number;
  outputPerM: number;
}

// Baseline pricing (Automatikus / openrouter/auto)
export const BASELINE_PRICES: ModelPricing = {
  inputPerM: 0.5,
  outputPerM: 1.0,
};

let cache: {
  prices: Map<string, ModelPricing>;
  ts: number;
} | null = null;

const TTL_MS = 10 * 60 * 1000; // 10 minutes

async function loadPrices(): Promise<Map<string, ModelPricing>> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
      next: { revalidate: 600 },
    });
    if (!res.ok) return cache?.prices ?? new Map();

    const json = await res.json();
    const map = new Map<string, ModelPricing>();

    for (const m of json.data ?? []) {
      if (!m.id || !m.pricing) continue;
      map.set(m.id, {
        inputPerM: parseFloat(m.pricing.prompt ?? "0") * 1_000_000,
        outputPerM: parseFloat(m.pricing.completion ?? "0") * 1_000_000,
      });
    }
    return map;
  } catch {
    return cache?.prices ?? new Map();
  }
}

/**
 * Get pricing for a specific model.
 * Falls back to BASELINE_PRICES if the model is not found.
 */
export async function getModelPrice(modelId: string): Promise<ModelPricing> {
  const now = Date.now();
  if (!cache || now - cache.ts > TTL_MS) {
    const prices = await loadPrices();
    cache = { prices, ts: now };
  }

  // openrouter/auto → baseline (we can't know what sub-model will be chosen)
  if (modelId === "openrouter/auto") return BASELINE_PRICES;

  return cache.prices.get(modelId) ?? BASELINE_PRICES;
}

/**
 * Get pricing for ALL models (for bulk multiplier calculation in /api/models).
 */
export async function getAllModelPrices(): Promise<Map<string, ModelPricing>> {
  const now = Date.now();
  if (!cache || now - cache.ts > TTL_MS) {
    const prices = await loadPrices();
    cache = { prices, ts: now };
  }
  return cache.prices;
}
