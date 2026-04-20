import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id: chatId } = await params;

  // Verify ownership
  const chat = await prisma.chat.findUnique({ where: { id: chatId, userId: session.user.id } });
  if (!chat) return new NextResponse("Not Found", { status: 404 });

  const pinned = await prisma.pinnedChat.upsert({
    where: { chatId_userId: { chatId, userId: session.user.id } },
    create: { chatId, userId: session.user.id },
    update: {},
  });

  return NextResponse.json(pinned);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id: chatId } = await params;

  await prisma.pinnedChat.deleteMany({
    where: { chatId, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
