import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

// GET /api/admin/users — paginated user list
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return new Response("Forbidden", { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? "";
  const limit = 20;

  const where = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true,
        image: true,
        subscription: {
          select: {
            tier: true,
            status: true,
            totalInputTokensUsed: true,
            totalOutputTokensUsed: true,
          },
        },
        _count: { select: { chats: true, memories: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return Response.json({ users, total, page, pages: Math.ceil(total / limit) });
}

// PATCH /api/admin/users — update a user's role or subscription tier
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return new Response("Forbidden", { status: 403 });

  const { userId, role, tier } = await req.json();
  if (!userId) return new Response("Bad Request", { status: 400 });

  if (role) {
    await prisma.user.update({ where: { id: userId }, data: { role } });
  }

  if (tier) {
    await prisma.subscription.upsert({
      where: { userId },
      create: { userId, tier, status: tier === "FREE" ? "free" : "active" },
      update: { tier, status: tier === "FREE" ? "free" : "active" },
    });
  }

  return new Response(null, { status: 204 });
}

// DELETE /api/admin/users — delete a user
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return new Response("Forbidden", { status: 403 });

  const { userId } = await req.json();
  if (!userId) return new Response("Bad Request", { status: 400 });

  // Prevent self-deletion
  if (userId === session.user.id) {
    return new Response("Cannot delete yourself", { status: 400 });
  }

  await prisma.user.delete({ where: { id: userId } });
  return new Response(null, { status: 204 });
}
