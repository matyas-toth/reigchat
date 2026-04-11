import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const user = session.user;

  let sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  let customerId = sub?.stripeCustomerId;

  // Create customer if they don't have one yet (e.g. they want to manage but upgraded via admin)
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, stripeCustomerId: customerId },
      update: { stripeCustomerId: customerId },
    });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.BETTER_AUTH_URL}/profile`,
  });

  return NextResponse.json({ url: portalSession.url });
}
