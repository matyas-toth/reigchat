import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getQuotaStatus } from "@/lib/quota";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const status = await getQuotaStatus(session.user.id);
  return NextResponse.json(status);
}
