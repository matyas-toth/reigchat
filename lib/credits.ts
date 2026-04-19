import { BASELINE_PRICES } from "./openrouter-prices";

/**
 * 1 credit = $0.000001 (1 microdollar).
 * This equals the cost of 1 output token at the baseline rate ($1/M output).
 *
 * Credit formula for a request:
 *   credits = inputTokens × inputPricePerM + outputTokens × outputPricePerM
 *
 * Derivation:
 *   cost_$ = (inputTokens / 1_000_000) × inputPrice$ + (outputTokens / 1_000_000) × outputPrice$
 *   credits = cost_$ / 0.000001 = cost_$ × 1_000_000
 *           = inputTokens × inputPricePerM + outputTokens × outputPricePerM
 */

export const CREDITS_PER_DOLLAR = 1_000_000; // 1 credit = $0.000001

/**
 * Credit budgets per tier.
 * Calculated to ensure ≥10% profit margin even at 100% utilisation:
 *   PRO:   $12/mo ÷ 90 windows (8h) × 90% = $0.12/window → 120 000 credits
 *   ULTRA: $100/mo ÷ 720 windows (1h) × 90% = $0.125/window → 125 000 credits
 *   FREE:  Lifetime 50 000 credits (~$0.05 API cost)
 */
export const TIER_CREDIT_LIMITS = {
  FREE:  { lifetime: 50_000 },
  PRO:   { perWindow: 120_000, windowMs: 8 * 60 * 60 * 1000 },
  ULTRA: { perWindow: 125_000, windowMs: 1 * 60 * 60 * 1000 },
} as const;

/**
 * Calculate credits consumed by a single LLM request.
 *
 * @param inputTokens  - prompt + context tokens
 * @param outputTokens - generated tokens
 * @param inputPerM    - model input price in $/M tokens
 * @param outputPerM   - model output price in $/M tokens
 * @returns integer credit cost (always ≥ 1 if any tokens were used)
 */
export function calculateCredits(
  inputTokens: number,
  outputTokens: number,
  inputPerM: number,
  outputPerM: number
): number {
  const raw = inputTokens * inputPerM + outputTokens * outputPerM;
  return Math.max(1, Math.ceil(raw));
}

/**
 * The multiplier shown on a model card (relative to the baseline output price).
 * Always a positive integer; free models return 0.
 *
 * @param outputPerM - model output price in $/M tokens
 */
export function getDisplayMultiplier(outputPerM: number): number {
  if (outputPerM <= 0) return 0;
  return Math.ceil(outputPerM / BASELINE_PRICES.outputPerM);
}
