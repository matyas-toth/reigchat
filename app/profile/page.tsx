"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Tier } from "@/generated/prisma";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface QuotaStatus {
  tier: Tier;
  used: number;
  limit: number;
  percentUsed: number;
  windowResetsAt: string | null;
  isLifetime: boolean;
  exhausted: boolean;
}

const TIER_LABELS: Record<Tier, string> = {
  FREE: "Free",
  PRO: "Pro",
  ULTRA: "Ultra",
};

function formatTimeUntil(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "shortly";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function UsageMeter({ quota }: { quota: QuotaStatus }) {
  const pct = quota.percentUsed;
  const label = quota.isLifetime
    ? `${quota.used.toLocaleString()} / ${quota.limit.toLocaleString()} lifetime tokens used`
    : `${quota.used.toLocaleString()} / ${quota.limit.toLocaleString()} tokens this window`;

  const sublabel = quota.isLifetime
    ? quota.exhausted
      ? "Lifetime allowance exhausted — upgrade to keep going."
      : `${100 - pct}% remaining of your one-time free access.`
    : quota.windowResetsAt
      ? `Resets in ${formatTimeUntil(quota.windowResetsAt)}`
      : "";

  return (
    <Card>
      <CardContent className="px-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Your Brain Usage</span>
          <span className={cn("text-xs", pct >= 100 ? "text-destructive font-bold" : "text-muted-foreground")}>{pct}%</span>
        </div>
        <Progress value={Math.min(100, pct)} className={cn("h-2 w-full", pct >= 100 && "[&>div]:bg-destructive")} />
        <p className="mt-4 text-xs text-muted-foreground">{label}</p>
        {sublabel && (
          <p className={cn("mt-1 text-xs", pct >= 80 && !quota.exhausted ? "text-destructive" : "text-muted-foreground/60")}>
            {sublabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const PLANS = [
  {
    tier: "FREE" as Tier,
    name: "Free",
    price: "$0",
    cycle: "forever",
    tagline: "Good for getting a feel for it.",

    features: [
      { text: "1 lifetime access window (50K tokens)", included: true },
      { text: "All projects & task tracking", included: true },
      { text: "AI memory vault", included: true },
      { text: "No refresh — ever", included: false },
      { text: "Stripe billing portal", included: false },
    ],
    cta: "Upgrade to get unlimited access",
    priceEnvKey: null,
    planName: null,
    highlighted: false,
  },
  {
    tier: "PRO" as Tier,
    name: "Pro",
    price: "$12",
    cycle: "/month",
    tagline: "For people who think faster than they can type.",
    badge: "Most Popular",
    features: [
      { text: "250,000 output tokens every 8 hours", included: true },
      { text: "Resets 3× per day automatically", included: true },
      { text: "~400 AI turns per window", included: true },
      { text: "Unlimited projects, tasks & ideas", included: true },
      { text: "Cancel anytime from billing portal", included: true },
    ],
    cta: "Start Pro for $12/mo",
    subCta: "You'll use it more than you think.",
    priceEnvKey: "STRIPE_PRO_PRICE_ID",
    planName: "pro",
    highlighted: true,
  },
  {
    tier: "ULTRA" as Tier,
    name: "Ultra",
    price: "$100",
    cycle: "/month",
    tagline: "When your second brain works harder than your first.",
    badge: "For power users",
    features: [
      { text: "2,500,000 output tokens every 8 hours", included: true },
      { text: "~4,000 AI turns per window", included: true },
      { text: "Effectively no limits for any human", included: true },
      { text: "Everything in Pro", included: true },
      { text: "Early access to new features", included: true },
    ],
    cta: "Go Ultra for $100/mo",
    subCta: "Built for people who actually ship things.",
    priceEnvKey: "STRIPE_ULTRA_PRICE_ID",
    planName: "ultra",
    highlighted: false,
  },
];

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.push("/login");
  }, [session, isPending, router]);

  const fetchQuota = useCallback(async () => {
    const res = await fetch("/api/billing/quota");
    if (res.ok) setQuota(await res.json());
  }, []);

  useEffect(() => {
    if (session) fetchQuota();
  }, [session, fetchQuota]);

  const handleUpgrade = async (planName: string | null, currentTier: Tier) => {
    if (!planName) return;
    if (currentTier !== "FREE") {
      // Paid user — open portal
      setLoading(true);
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const { url } = await res.json();
      setLoading(false);
      window.location.href = url;
      return;
    }
    setLoading(true);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planName }),
    });
    const { url } = await res.json();
    setLoading(false);
    window.location.href = url;
  };

  const openPortal = async () => {
    setLoading(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const { url } = await res.json();
    setLoading(false);
    window.location.href = url;
  };

  if (isPending || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const currentTier: Tier = quota?.tier ?? "FREE";
  const isPaid = currentTier !== "FREE";
  const user = session.user;
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border/50 px-6 py-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-10">

        {/* Header — hero copy for free users */}
        {!isPaid && (
          <Card className="bg-muted/50 border-border">
            <CardContent className="pt-0">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                You&apos;ve started building your second brain.
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-lg leading-relaxed">
                Now give it room to grow. Pro gives you 750 AI turns every 8 hours — enough to map out entire projects, process complex decisions, and never lose a thought again.
              </p>
              <Button
                variant="default"
                onClick={() => handleUpgrade("pro", currentTier)}
                disabled={loading}
                className="mt-6 font-medium"
              >
                {loading ? "Loading..." : "Upgrade to Pro — $12/mo"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Account info */}
        <section>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Account</h2>
          <Card>
            <CardContent className="px-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-semibold text-foreground shrink-0 border border-border">
                {initials}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-foreground truncate">{user.name}</p>
                  <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium bg-muted/50 text-muted-foreground">
                    {TIER_LABELS[currentTier]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
              {isPaid && (
                <Button
                  variant="outline"
                  onClick={openPortal}
                  disabled={loading}
                  className="shrink-0"
                >
                  {loading ? "..." : "Manage Billing"}
                </Button>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Usage */}
        {quota && (
          <section>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Usage</h2>
            <UsageMeter quota={quota} />
          </section>
        )}

        {/* Pricing */}
        <section>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Plans</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrentTier = currentTier === plan.tier;
              return (
                <Card
                  key={plan.tier}
                  className={cn(
                    "relative flex flex-col transition-all overflow-visible",
                    plan.highlighted ? "border-primary shadow-md" : "border-border shadow-sm"
                  )}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary px-3 py-1 text-sm font-medium tracking-wide text-primary-foreground">
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    {(!plan.highlighted && plan.badge) && (
                      <p className="text-xs text-muted-foreground mb-1 font-medium">{plan.badge}</p>
                    )}
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.cycle}</span>
                    </div>
                    <CardDescription className="mt-2 text-xs leading-relaxed">{plan.tagline}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className={f.included ? "text-foreground" : "text-muted-foreground/40"}>
                            {f.included ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            )}
                          </span>
                          <span className={f.included ? "text-muted-foreground" : "text-muted-foreground/40 leading-snug"}>{f.text}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="flex-col gap-2 border-none">
                    {isCurrentTier ? (
                      <div className="w-full rounded-md border border-border/80 bg-muted/30 py-2.5 text-center text-[13px] font-medium text-muted-foreground">
                        Current plan
                      </div>
                    ) : plan.planName ? (
                      <div className="w-full">
                        <Button
                          variant={plan.highlighted ? "default" : "outline"}
                          className="w-full"
                          disabled={loading}
                          onClick={() => handleUpgrade(plan.planName, currentTier)}
                        >
                          {loading ? "Loading..." : plan.cta}
                        </Button>
                        {"subCta" in plan && plan.subCta && (
                          <p className="mt-2.5 text-center text-[11px] text-muted-foreground/70">{plan.subCta}</p>
                        )}
                      </div>
                    ) : null}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          <p className="mt-6 text-center text-[13px] text-muted-foreground/60">
            No commitment. Cancel anytime from your billing portal. Your data stays.
          </p>
        </section>
      </div>
    </div>
  );
}
