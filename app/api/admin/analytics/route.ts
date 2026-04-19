import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return new Response("Forbidden", { status: 403 });

  const [
    totalUsers,
    totalChats,
    totalMessages,
    totalMemories,
    subscriptions,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.chat.count(),
    prisma.message.count(),
    prisma.memory.count(),
    prisma.subscription.groupBy({ by: ["tier"], _count: { tier: true } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 7,
      select: { id: true, name: true, email: true, createdAt: true, role: true, subscription: { select: { tier: true, lifetimeCreditsUsed: true, windowCreditsUsed: true } } }
    }),
  ]);

  const tierMap: Record<string, number> = { FREE: 0, PRO: 0, ULTRA: 0 };
  for (const s of subscriptions) tierMap[s.tier] = s._count.tier;

  // Users without subscriptions are effectively FREE
  const usersWithSub = subscriptions.reduce((a, b) => a + b._count.tier, 0);
  tierMap.FREE = (tierMap.FREE || 0) + (totalUsers - usersWithSub);

  return Response.json({
    totalUsers,
    totalChats,
    totalMessages,
    totalMemories,
    tiers: tierMap,
    recentUsers,
  });
}
