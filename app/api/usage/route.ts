import { auth } from "@/lib/auth";
import { getQuotaStatus } from "@/lib/quota";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const status = await getQuotaStatus(session.user.id);
  return Response.json(status);
}
