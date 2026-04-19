import { prisma } from "@/lib/prisma";
import { getModelPrice } from "@/lib/openrouter-prices";
import { calculateCredits, TIER_CREDIT_LIMITS } from "@/lib/credits";
import type { Tier } from "@/generated/prisma";

export type QuotaStatus = {
  tier: Tier;
  percentUsed: number;      // 0–100
  windowResetsAt: Date | null;
  isLifetime: boolean;      // true for FREE
  exhausted: boolean;
};

/** Upsert a Subscription row for a user if it doesn't exist yet. */
async function ensureSubscription(userId: string) {
  return prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      windowCreditsLimit: TIER_CREDIT_LIMITS.FREE.lifetime,
    },
    update: {},
  });
}

/**
 * Check if the user has credit quota remaining.
 * Throws QuotaError if exhausted. Also rolls expired windows.
 */
export async function checkAndReserveQuota(userId: string): Promise<void> {
  const sub = await ensureSubscription(userId);
  const now = new Date();

  if (sub.tier === "FREE") {
    if (sub.lifetimeCreditsUsed >= TIER_CREDIT_LIMITS.FREE.lifetime) {
      throw new QuotaError("lifetime_exhausted", null, sub.tier);
    }
    return;
  }

  // Paid tier — rolling window
  const windowMs =
    sub.tier === "PRO"
      ? TIER_CREDIT_LIMITS.PRO.windowMs
      : TIER_CREDIT_LIMITS.ULTRA.windowMs;

  const windowExpired = !sub.windowResetsAt || sub.windowResetsAt <= now;

  if (windowExpired) {
    // Roll the window — fresh start
    const limit =
      sub.tier === "PRO"
        ? TIER_CREDIT_LIMITS.PRO.perWindow
        : TIER_CREDIT_LIMITS.ULTRA.perWindow;

    await prisma.subscription.update({
      where: { userId },
      data: {
        windowCreditsUsed: 0,
        windowCreditsLimit: limit,
        windowResetsAt: new Date(now.getTime() + windowMs),
      },
    });
    return; // fresh window always passes
  }

  if (sub.windowCreditsUsed >= sub.windowCreditsLimit) {
    throw new QuotaError("window_exhausted", sub.windowResetsAt, sub.tier);
  }
}

/**
 * Record credit usage after a successful LLM response.
 * Fetches real-time pricing from the OpenRouter price cache.
 */
export async function recordUsage(
  userId: string,
  modelId: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return;

  const pricing = await getModelPrice(modelId);
  const credits = calculateCredits(
    inputTokens,
    outputTokens,
    pricing.inputPerM,
    pricing.outputPerM
  );

  if (sub.tier === "FREE") {
    await prisma.subscription.update({
      where: { userId },
      data: { lifetimeCreditsUsed: { increment: credits } },
    });
  } else {
    await prisma.subscription.update({
      where: { userId },
      data: {
        windowCreditsUsed: { increment: credits },
        lifetimeCreditsUsed: { increment: credits },
      },
    });
  }
}

/** Get a user-facing quota status for the sidebar/profile. */
export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const sub = await ensureSubscription(userId);
  const now = new Date();

  if (sub.tier === "FREE") {
    const used = sub.lifetimeCreditsUsed;
    const limit = TIER_CREDIT_LIMITS.FREE.lifetime;
    return {
      tier: sub.tier,
      percentUsed: Math.min(100, Math.round((used / limit) * 100)),
      windowResetsAt: null,
      isLifetime: true,
      exhausted: used >= limit,
    };
  }

  // Paid: if window expired, treat as 0% used
  const windowExpired = !sub.windowResetsAt || sub.windowResetsAt <= now;
  const used = windowExpired ? 0 : sub.windowCreditsUsed;
  const limit = sub.windowCreditsLimit;
  const resetsAt = windowExpired
    ? new Date(now.getTime() + (sub.tier === "PRO" ? TIER_CREDIT_LIMITS.PRO.windowMs : TIER_CREDIT_LIMITS.ULTRA.windowMs))
    : sub.windowResetsAt!;

  return {
    tier: sub.tier,
    percentUsed: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0,
    windowResetsAt: resetsAt,
    isLifetime: false,
    exhausted: !windowExpired && used >= limit,
  };
}

export class QuotaError extends Error {
  constructor(
    public readonly reason: "lifetime_exhausted" | "window_exhausted",
    public readonly resetsAt: Date | null,
    public readonly tier: Tier
  ) {
    super(`Kvóta túllépve: ${reason}`);
    this.name = "QuotaError";
  }
}
