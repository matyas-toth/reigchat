import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  architecture?: { tokenizer?: string };
  pricing: {
    prompt: string;   // cost per token as decimal string
    completion: string;
  };
  top_provider?: { context_length?: number };
  created?: number;
}

// Server-side in-memory cache (10 min TTL)
let cache: { data: OpenRouterModel[]; ts: number } | null = null;
const TTL = 10 * 60 * 1000;

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  if ((session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return new Response("Forbidden", { status: 403 });

  const now = Date.now();
  if (cache && now - cache.ts < TTL) {
    return Response.json(cache.data);
  }

  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    return new Response("Failed to fetch OpenRouter models", { status: 502 });
  }

  const json = await res.json();
  const models: OpenRouterModel[] = json.data ?? [];
  cache = { data: models, ts: now };

  return Response.json(models);
}
