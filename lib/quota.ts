import { prisma } from "@/lib/prisma";
import type { Tier } from "@/generated/prisma";

export const TIER_LIMITS = {
  FREE: {
    lifetime: 50_000, // one-time, no refresh
  },
  PRO: {
    perWindow: 250_000, // per 8h rolling window
  },
  ULTRA: {
    perWindow: 2_500_000, // per 8h rolling window
  },
} as const;

const WINDOW_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

export type QuotaStatus = {
  tier: Tier;
  used: number;
  limit: number;
  percentUsed: number;
  windowResetsAt: Date | null;
  isLifetime: boolean; // true for FREE (no refresh)
  exhausted: boolean;
};

/** Upsert a Subscription row for a user if it doesn't exist yet. */
async function ensureSubscription(userId: string) {
  return prisma.subscription.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

/**
 * Check if the user has quota remaining. Returns the subscription if OK,
 * throws a QuotaError with details if the user is over limit.
 */
export async function checkAndReserveQuota(userId: string): Promise<void> {
  const sub = await ensureSubscription(userId);

  if (sub.tier === "FREE") {
    if (sub.totalOutputTokensUsed >= TIER_LIMITS.FREE.lifetime) {
      throw new QuotaError("lifetime_exhausted", null, sub.tier);
    }
    return;
  }

  // Paid tier — rolling 8h window
  const limit =
    sub.tier === "PRO" ? TIER_LIMITS.PRO.perWindow : TIER_LIMITS.ULTRA.perWindow;

  const now = new Date();
  const windowExpired = !sub.windowResetsAt || sub.windowResetsAt <= now;

  if (windowExpired) {
    // Roll the window
    await prisma.subscription.update({
      where: { userId },
      data: {
        windowOutputTokensUsed: 0,
        windowInputTokensUsed: 0,
        windowResetsAt: new Date(now.getTime() + WINDOW_DURATION_MS),
      },
    });
    return; // fresh window, always passes
  }

  if (sub.windowOutputTokensUsed >= limit) {
    throw new QuotaError("window_exhausted", sub.windowResetsAt, sub.tier);
  }
}

/**
 * Record token usage after a successful stream. Always increments the
 * lifetime counter; for paid tiers, also increments the window counter.
 */
export async function recordUsage(
  userId: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return;

  const isPaid = sub.tier !== "FREE";

  await prisma.subscription.update({
    where: { userId },
    data: {
      totalOutputTokensUsed: { increment: outputTokens },
      totalInputTokensUsed: { increment: inputTokens },
      ...(isPaid && {
        windowOutputTokensUsed: { increment: outputTokens },
        windowInputTokensUsed: { increment: inputTokens },
      }),
    },
  });
}

/** Get a user-facing quota status object for the profile/billing page. */
export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const sub = await ensureSubscription(userId);
  const now = new Date();

  if (sub.tier === "FREE") {
    const used = sub.totalOutputTokensUsed;
    const limit = TIER_LIMITS.FREE.lifetime;
    return {
      tier: sub.tier,
      used,
      limit,
      percentUsed: Math.min(100, Math.round((used / limit) * 100)),
      windowResetsAt: null,
      isLifetime: true,
      exhausted: used >= limit,
    };
  }

  const limit =
    sub.tier === "PRO" ? TIER_LIMITS.PRO.perWindow : TIER_LIMITS.ULTRA.perWindow;

  // If window is expired, effective usage is 0
  const windowExpired = !sub.windowResetsAt || sub.windowResetsAt <= now;
  const used = windowExpired ? 0 : sub.windowOutputTokensUsed;
  const resetsAt = windowExpired
    ? new Date(now.getTime() + WINDOW_DURATION_MS)
    : sub.windowResetsAt;

  return {
    tier: sub.tier,
    used,
    limit,
    percentUsed: Math.min(100, Math.round((used / limit) * 100)),
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
    super(`Quota exceeded: ${reason}`);
    this.name = "QuotaError";
  }
}
