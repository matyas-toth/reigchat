import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: {
      chats: {
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { name, emoji } = await req.json();
  if (!name?.trim()) return new NextResponse("Name required", { status: 400 });

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      emoji: emoji ?? "📁",
      userId: session.user.id,
    },
    include: { chats: true },
  });

  return NextResponse.json(project);
}
