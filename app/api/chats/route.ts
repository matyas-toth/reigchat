import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const chats = await prisma.chat.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      projectId: true,
      pinnedBy: {
        where: { userId: session.user.id },
        select: { id: true },
      },
    },
  });

  return NextResponse.json(
    chats.map((c) => ({ ...c, pinned: c.pinnedBy.length > 0, pinnedBy: undefined }))
  );
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const projectId = body?.projectId ?? null;

  // Validate project ownership if provided
  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId, userId: session.user.id } });
    if (!project) return new NextResponse("Project not found", { status: 404 });
  }

  const chat = await prisma.chat.create({
    data: {
      title: "New Chat",
      userId: session.user.id,
      ...(projectId && { projectId }),
    },
  });

  return NextResponse.json({ ...chat, pinned: false });
}
