import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const user = session.user;
  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ invoices: [] });
  }

  try {
    const invoices = await stripe.invoices.list({
      customer: sub.stripeCustomerId,
      limit: 20,
    });

    const parsed = invoices.data.map((inv) => ({
      id: inv.id,
      amount: inv.amount_paid > 0 ? inv.amount_paid : inv.total,
      currency: inv.currency,
      status: inv.status,
      date: new Date(inv.created * 1000).toISOString(),
      pdfUrl: inv.invoice_pdf,
    }));

    return NextResponse.json({ invoices: parsed });
  } catch (error) {
    console.error("Stripe invoice list error:", error);
    return NextResponse.json({ invoices: [] }, { status: 500 });
  }
}
