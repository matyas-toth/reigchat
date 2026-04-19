import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { Tier } from "@/generated/prisma";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  if ((session.user as any).role !== "ADMIN") return null;
  return session;
}

// GET /api/admin/models — all TierModel rows grouped by tier
export async function GET() {
  const session = await requireAdmin();
  if (!session) return new Response("Forbidden", { status: 403 });

  const rows = await prisma.tierModel.findMany({ orderBy: { createdAt: "asc" } });
  const grouped: Record<string, typeof rows> = { FREE: [], PRO: [], ULTRA: [] };
  for (const row of rows) grouped[row.tier].push(row);

  return Response.json(grouped);
}

// POST /api/admin/models — add model to a tier
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return new Response("Forbidden", { status: 403 });

  const { modelId, tier, label } = await req.json();
  if (!modelId || !tier || !label) return new Response("Bad Request", { status: 400 });
  if (!["FREE", "PRO", "ULTRA"].includes(tier)) return new Response("Invalid tier", { status: 400 });

  const row = await prisma.tierModel.upsert({
    where: { modelId_tier: { modelId, tier: tier as Tier } },
    create: { modelId, tier: tier as Tier, label },
    update: { label },
  });

  return Response.json(row);
}

// DELETE /api/admin/models — remove model from a tier
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return new Response("Forbidden", { status: 403 });

  const { modelId, tier } = await req.json();
  if (!modelId || !tier) return new Response("Bad Request", { status: 400 });

  // Protect "openrouter/auto" from being removed from FREE
  if (modelId === "openrouter/auto" && tier === "FREE") {
    return new Response("Cannot remove Automatikus from FREE tier", { status: 400 });
  }

  await prisma.tierModel.deleteMany({ where: { modelId, tier: tier as Tier } });

  return new Response(null, { status: 204 });
}
