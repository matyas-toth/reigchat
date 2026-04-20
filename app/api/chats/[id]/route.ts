import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getOwnedChat(id: string, userId: string) {
  return prisma.chat.findUnique({ where: { id, userId } });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const chat = await getOwnedChat(id, session.user.id);
  if (!chat) return new NextResponse("Not Found", { status: 404 });

  const messages = await prisma.message.findMany({
    where: { chatId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const chat = await getOwnedChat(id, session.user.id);
  if (!chat) return new NextResponse("Not Found", { status: 404 });

  const body = await req.json();
  const { title, projectId } = body;

  // Validate project ownership if assigning
  if (projectId !== undefined && projectId !== null) {
    const project = await prisma.project.findUnique({ where: { id: projectId, userId: session.user.id } });
    if (!project) return new NextResponse("Project not found", { status: 404 });
  }

  const updated = await prisma.chat.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      // null explicitly removes project, undefined means "don't change"
      ...("projectId" in body && { projectId: projectId ?? null }),
    },
    select: { id: true, title: true, projectId: true, updatedAt: true },
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
  const chat = await getOwnedChat(id, session.user.id);
  if (!chat) return new NextResponse("Not Found", { status: 404 });

  await prisma.chat.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
