import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  if ((session.user as any).role !== "ADMIN") return null;
  return session;
}

// GET /api/admin/blocklist
export async function GET() {
  const session = await requireAdmin();
  if (!session) return new Response("Forbidden", { status: 403 });

  const rows = await prisma.modelBlocklist.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(rows);
}

// POST /api/admin/blocklist  — { modelId, reason? }
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return new Response("Forbidden", { status: 403 });

  const { modelId, reason } = await req.json();
  if (!modelId) return new Response("Bad Request", { status: 400 });

  // openrouter/auto cannot be blocklisted
  if (modelId === "openrouter/auto") {
    return new Response("Cannot blocklist Automatikus", { status: 400 });
  }

  const row = await prisma.modelBlocklist.upsert({
    where: { modelId },
    create: { modelId, reason },
    update: { reason },
  });

  return Response.json(row);
}

// DELETE /api/admin/blocklist  — { modelId }
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return new Response("Forbidden", { status: 403 });

  const { modelId } = await req.json();
  if (!modelId) return new Response("Bad Request", { status: 400 });

  await prisma.modelBlocklist.deleteMany({ where: { modelId } });
  return new Response(null, { status: 204 });
}
