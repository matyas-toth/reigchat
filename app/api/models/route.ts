import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export interface ModelOption {
  id: string;
  label: string;
  provider: string;
  requiredTier: "FREE" | "PRO" | "ULTRA";
  accessible: boolean;
}

const TIER_RANK: Record<string, number> = { FREE: 0, PRO: 1, ULTRA: 2 };

// GET /api/models — returns ALL tier-assigned models with accessibility flag for the current user's tier
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;

  // Get user's tier
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const userTier = (sub?.tier ?? "FREE") as "FREE" | "PRO" | "ULTRA";
  const userRank = TIER_RANK[userTier];

  // Get blocklist
  const blocklist = await prisma.modelBlocklist.findMany({ select: { modelId: true } });
  const blocked = new Set(blocklist.map((b) => b.modelId));

  // Get ALL tier models across all tiers (not just user's tier)
  const allTierModels = await prisma.tierModel.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Deduplicate: if a model appears in multiple tiers, keep the lowest (most accessible) tier
  const dedupMap = new Map<string, { label: string; tier: "FREE" | "PRO" | "ULTRA" }>();
  for (const m of allTierModels) {
    if (blocked.has(m.modelId)) continue;
    const existing = dedupMap.get(m.modelId);
    if (!existing || TIER_RANK[m.tier] < TIER_RANK[existing.tier]) {
      dedupMap.set(m.modelId, { label: m.label, tier: m.tier as "FREE" | "PRO" | "ULTRA" });
    }
  }

  // Build model options
  const models: ModelOption[] = [];

  // Always first: Automatikus
  models.push({
    id: "openrouter/auto",
    label: "Automatikus",
    provider: "Reig Chat",
    requiredTier: "FREE",
    accessible: true,
  });

  // All tier models, sorted alphabetically by label
  const tierEntries = Array.from(dedupMap.entries())
    .filter(([id]) => id !== "openrouter/auto")
    .sort(([, a], [, b]) => {
      const la = (a.label.includes(":") ? a.label.split(":")[1] : a.label)?.trim() ?? "";
      const lb = (b.label.includes(":") ? b.label.split(":")[1] : b.label)?.trim() ?? "";
      return la.localeCompare(lb);
    });

  for (const [modelId, { label, tier }] of tierEntries) {
    const cleanLabel = (label.includes(":") ? label.split(":")[1] : label)?.replace(" (free)", "").trim() ?? modelId;
    const parts = modelId.split("/");
    models.push({
      id: modelId,
      label: cleanLabel,
      provider: parts[0]?.replace("openrouter", "Reig Chat") ?? "Unknown",
      requiredTier: tier,
      accessible: userRank >= TIER_RANK[tier],
    });
  }

  return Response.json({ tier: userTier, models });
}
