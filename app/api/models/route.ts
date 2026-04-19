import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export interface ModelOption {
  id: string;
  label: string;
  provider: string;
  isFree: boolean;
  inputPricePerM: number;  // $/M tokens
  outputPricePerM: number;
}

// Shared cache for free models (10 min TTL)
let freeCache: { data: ModelOption[]; ts: number } | null = null;
const TTL = 10 * 60 * 1000;

async function getFreeModelsFromOpenRouter(): Promise<ModelOption[]> {
  const now = Date.now();
  if (freeCache && now - freeCache.ts < TTL) return freeCache.data;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const free: ModelOption[] = (json.data ?? [])
      .filter((m: any) => m.pricing?.prompt === "0" && m.pricing?.completion === "0")
      .map((m: any) => {
        const parts = m.id.split("/");
        return {
          id: m.id,
          label: (m.name.includes(":") ? m.name.split(":")[1] : m.name)?.replace(" (free)", "").trim() ?? m.id,
          provider: parts[0].replace("openrouter", "Reig Chat") ?? "Ismeretlen Szolgáltató",
          isFree: true,
          inputPricePerM: 0,
          outputPricePerM: 0,
        };
      });
    freeCache = { data: free, ts: now };
    return free;
  } catch {
    return [];
  }
}

// GET /api/models — returns models available to the current user based on tier + free auto-include
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;

  // Get user's tier
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const tier = sub?.tier ?? "FREE";

  // Get blocklist
  const blocklist = await prisma.modelBlocklist.findMany({ select: { modelId: true } });
  const blocked = new Set(blocklist.map((b) => b.modelId));

  // Always-first: openrouter/auto (cannot be blocked)
  const always: ModelOption = {
    id: "openrouter/auto",
    label: "Automatikus",
    provider: "Reig Chat",
    isFree: true,
    inputPricePerM: 0,
    outputPricePerM: 0,
  };

  // Tier-assigned models
  const tierModels = await prisma.tierModel.findMany({
    where: { tier: tier as any },
    orderBy: { createdAt: "asc" },
  });

  const tierOptions: ModelOption[] = tierModels
    .filter((m) => !blocked.has(m.modelId) && m.modelId !== "openrouter/auto")
    .map((m) => {
      const parts = m.modelId.split("/");
      return {
        id: m.modelId,
        label: (m.label.includes(":") ? m.label.split(":")[1] : m.label)?.trim() ?? m.modelId,
        provider: parts[0] ?? "Unknown",
        isFree: false,
        inputPricePerM: 0,
        outputPricePerM: 0,
      };
    });

  // Auto-include zero-cost models (not blocked)
  const freeModels = await getFreeModelsFromOpenRouter();
  const freeOptions = freeModels.filter(
    (m) => !blocked.has(m.id) && m.id !== "openrouter/auto" && !tierOptions.find((t) => t.id === m.id)
  );

  const combined: ModelOption[] = [always, ...tierOptions, ...freeOptions];
  return Response.json({ tier, models: combined });
}
