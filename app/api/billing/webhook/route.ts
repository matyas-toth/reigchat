import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { TIER_CREDIT_LIMITS } from "@/lib/credits";


const PRICE_TO_TIER: Record<string, "PRO" | "ULTRA"> = {
  [process.env.STRIPE_PRO_PRICE_ID ?? ""]: "PRO",
  [process.env.STRIPE_ULTRA_PRICE_ID ?? ""]: "ULTRA",
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        if (checkoutSession.mode !== "subscription") break;

        const userId = checkoutSession.metadata?.userId;
        const subscriptionId = checkoutSession.subscription as string;
        const customerId = checkoutSession.customer as string;

        if (!userId || !subscriptionId) break;

        // Fetch the full subscription to get the price ID
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = stripeSub.items.data[0]?.price.id ?? "";
        const tier = PRICE_TO_TIER[priceId] ?? "PRO";

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            tier,
            status: "active",
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
          },
          update: {
            tier,
            status: "active",
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            // Reset window on upgrade
            windowCreditsUsed: 0,
            windowCreditsLimit: tier === "PRO" ? TIER_CREDIT_LIMITS.PRO.perWindow : TIER_CREDIT_LIMITS.ULTRA.perWindow,
            windowResetsAt: null,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const stripeSub = event.data.object as Stripe.Subscription;
        const userId = stripeSub.metadata?.userId;
        if (!userId) break;

        const priceId = stripeSub.items.data[0]?.price.id ?? "";
        const tier = PRICE_TO_TIER[priceId] ?? "PRO";
        const status =
          stripeSub.status === "active"
            ? "active"
            : stripeSub.status === "canceled"
            ? "canceled"
            : "past_due";

        await prisma.subscription.update({
          where: { userId },
          data: {
            tier,
            status,
            stripePriceId: priceId,
            stripeSubscriptionId: stripeSub.id,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSub = event.data.object as Stripe.Subscription;
        const userId = stripeSub.metadata?.userId;
        if (!userId) break;

        // Downgrade to FREE, preserve lifetime usage count
        await prisma.subscription.update({
          where: { userId },
          data: {
            tier: "FREE",
            status: "free",
            stripeSubscriptionId: null,
            stripePriceId: null,
            windowCreditsUsed: 0,
            windowCreditsLimit: TIER_CREDIT_LIMITS.FREE.lifetime,
            windowResetsAt: null,
          },
        });
        break;
      }

      default:
        // Unhandled event type — fine, just ignore
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new NextResponse("Internal handler error", { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}
