import { deepseek } from "@ai-sdk/deepseek";
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  stepCountIs,
} from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt } from "@/lib/ai/prompt";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkAndReserveQuota, recordUsage, QuotaError } from "@/lib/quota";
import {
  saveMemoryInput,
} from "@/lib/ai/schema";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, chatId }: { messages: UIMessage[]; chatId: string } =
    await req.json();

  const userId = session.user.id;
  const systemPrompt = await buildSystemPrompt(userId);

  // Quota gate — must happen before streaming
  try {
    await checkAndReserveQuota(userId);
  } catch (err) {
    if (err instanceof QuotaError) {
      return new Response(
        JSON.stringify({
          error: "quota_exceeded",
          reason: err.reason,
          resetsAt: err.resetsAt?.toISOString() ?? null,
          tier: err.tier,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
    throw err;
  }

  // Verify chat ownership
  if (chatId) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId, userId },
    });
    if (!chat) {
      return new Response("Not Found", { status: 404 });
    }
  }

  // Get the last user message content
  const lastUserMessage = messages.filter((m) => m.role === "user").pop();
  let userText = "";
  if (lastUserMessage) {
    for (const part of lastUserMessage.parts) {
      if (part.type === "text") {
        userText += part.text;
      }
    }
  }

  // Save user message to DB
  if (chatId && userText) {
    await prisma.message.create({
      data: { chatId, role: "user", content: userText },
    });

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (chat && chat.title === "New Chat") {
      const title =
        userText.length > 50 ? userText.substring(0, 50) + "..." : userText;
      await prisma.chat.update({ where: { id: chatId }, data: { title } });
    }
  }

  // Single-pass: streamText with tools — AI calls tools inline, then writes a reply
  const result = streamText({
    model: deepseek("deepseek-chat"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: {
      saveMemory: {
        description: "Save an important snippet, note, or fact into the brain for later retrieval.",
        inputSchema: saveMemoryInput,
        execute: async ({ content }) => {
          const memoriesCount = await prisma.memory.count({ where: { userId } });
          if (memoriesCount >= 25) {
            const oldest = await prisma.memory.findFirst({
              where: { userId },
              orderBy: { createdAt: "asc" },
            });
            if (oldest) await prisma.memory.delete({ where: { id: oldest.id } });
          }
          await prisma.memory.create({ data: { content, userId } });
          return `Memory saved: "${content.substring(0, 30)}..."`;
        },
      },
    },
    stopWhen: stepCountIs(5),
    async onFinish({ text, usage }) {
      // Record token usage
      if (usage) {
        await recordUsage(
          userId,
          usage.inputTokens ?? 0,
          usage.outputTokens ?? 0
        );
      }
      if (chatId && text) {
        await prisma.message.create({
          data: { chatId, role: "assistant", content: text },
        });
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
