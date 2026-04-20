import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getProject(id: string, userId: string) {
  return prisma.project.findUnique({ where: { id, userId } });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const project = await getProject(id, session.user.id);
  if (!project) return new NextResponse("Not Found", { status: 404 });

  const { name, emoji } = await req.json();

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(emoji !== undefined && { emoji }),
    },
    include: { chats: { select: { id: true, title: true, updatedAt: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const project = await getProject(id, session.user.id);
  if (!project) return new NextResponse("Not Found", { status: 404 });

  // Detach chats before deleting (SetNull handled by DB via schema, but be explicit)
  await prisma.chat.updateMany({
    where: { projectId: id },
    data: { projectId: null },
  });

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
