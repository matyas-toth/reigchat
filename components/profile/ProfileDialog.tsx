"use client";

import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Tier } from "@/generated/prisma";
import { useSession, signOut } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatSpinner from "@/components/chat/ChatSpinner";
import { format } from "date-fns";
import { SettingsIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSearchParams } from "next/navigation";

// Used for fetching quota
interface QuotaStatus {
  tier: Tier;
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

const PLANS = [
  {
    tier: "FREE" as Tier,
    name: "Ingyenes",
    price: "0 Ft",
    cycle: "örökké",
    tagline: "Kipróbáláshoz tökéletes.",
    features: [
      { text: "1 életre szóló kvótaablak", included: true },
      { text: "Összes projekt és feladat", included: true },
      { text: "AI memória trezor", included: true },
      { text: "Soha nem frissül fel", included: false },
      { text: "Stripe számlázási fiók", included: false },
    ],
    cta: "Váltás korlátlan élményre",
    planName: null,
    highlighted: false,
  },
  {
    tier: "PRO" as Tier,
    name: "Pro",
    price: "$12",
    cycle: "/hó",
    tagline: "Azoknak, akik gyorsabban gondolkodnak, mint írnak.",
    badge: "Legnépszerűbb",
    features: [
      { text: "Nagy, 8 óránként újratöltődő kvóta", included: true },
      { text: "Nagy modell választék", included: true },
      { text: "Reig Code hozzáférés", included: true },
      { text: "Bármikor lemondható", included: true },
    ],
    cta: "Próbáld ki a Pro-t",
    subCta: "Többet fogod használni, mint hinnéd.",
    planName: "pro",
    highlighted: true,
  },
  {
    tier: "ULTRA" as Tier,
    name: "Ultra",
    price: "$100",
    cycle: "/hó",
    tagline: "Amikor a második agyad keményebben dolgozik, mint az első.",
    badge: "Erőfelhasználóknak",
    features: [
      { text: "Több, mint 10x nagyobb kvóta, mint a Pro-ban", included: true },
      { text: "Az összes AI modell", included: true },
      { text: "Minden a Pro csomagból", included: true },
      { text: "Korai hozzáférés a funkciókhoz", included: true },
    ],
    cta: "Próbáld ki az Ultra-t",
    subCta: "Azoknak építve, akik szállítani akarnak.",
    planName: "ultra",
    highlighted: false,
  },
];

function formatTimeUntil(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "hamarosan";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}ó ${m}p`;
  return `${m}p`;
}

function UsageMeter({ quota }: { quota: QuotaStatus }) {
  const pct = quota.percentUsed;
  const label = quota.isLifetime
    ? `${pct}% egyszeri kvóta felhasználva`
    : `${pct}% felhasználva ebben a ciklusban`;

  const sublabel = quota.isLifetime
    ? quota.exhausted
      ? "Életre szóló kvóta kimerítve. Válassz előfizetést a korlátlan élményért."
      : `${100 - pct}% maradt az ingyenes hozzáférésből.`
    : quota.windowResetsAt
      ? `Frissül: ${formatTimeUntil(quota.windowResetsAt)}`
      : "";

  return (
    <Card className="rounded-xl border border-border/50 bg-muted/30">
      <CardContent className="p-4 sm:p-5 py-0!">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Kvóta</span>
          <span className={cn("text-xs", "text-muted-foreground")}>{pct}%</span>
        </div>
        <Progress value={Math.min(100, pct)} className={cn("h-2 w-full")} />
        <p className="mt-4 text-xs text-muted-foreground font-medium">{label}</p>
        {sublabel && (
          <p className={cn("mt-1 text-[11px]", pct >= 80 && !quota.exhausted ? "text-destructive" : "text-muted-foreground/60")}>
            {sublabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------
// Component logic
// -------------------------------------------------------------
export function ProfileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("account");
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const { theme, setTheme } = useTheme();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  // Fetch quota
  useEffect(() => {
    if (open && session) {
      fetch("/api/usage")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => setQuota(d))
        .catch(console.error);
    }
  }, [open, session]);

  // Fetch invoices when billing tab is selected
  useEffect(() => {
    if (activeTab === "billing" && open && session) {
      setInvoicesLoading(true);
      fetch("/api/billing/history")
        .then((r) => r.ok ? r.json() : { invoices: [] })
        .then((d) => {
          setInvoices(d.invoices || []);
          setInvoicesLoading(false);
        })
        .catch((e) => {
          console.error(e);
          setInvoicesLoading(false);
        });
    }
  }, [activeTab, open, session]);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get("packages") === "1") {
      setActiveTab("pro");
    }
  }, [searchParams]);

  if (!session) return null;

  const currentTier: Tier = quota?.tier ?? "FREE";
  const isPaid = currentTier !== "FREE";
  const user = session.user;
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  const handleUpgrade = async (planName: string | null) => {
    if (!planName) return;
    if (isPaid) {
      // Paid user — open portal
      openPortal();
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

  const menuItems = [
    { id: "account", label: "Fiók" },
    { id: "billing", label: "Előfizetés és Számlázás" },
    { id: "pro", label: "Prémium Csomagok" },
    { id: "appearance", label: "Megjelenés" },

  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 py-0! gap-0 overflow-hidden bg-background h-[85vh] sm:h-[75vh] flex flex-col sm:flex-row border-border/50">

        {/* Left Sidebar */}
        <div className="w-full sm:w-64  border-b sm:border-b-0 sm:border-r border-border/50 bg-muted/20 flex flex-col">
          <div className="p-4 py-4 flex items-center gap-2">
            <HugeiconsIcon icon={SettingsIcon} size={24} strokeWidth={2} />
            <h2 className="text-xl font-medium tracking-tight text-foreground">Beállítások</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-1 p-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                    activeTab === item.id
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3">
            <button
              onClick={async () => {
                await signOut();
                window.location.href = "/";
              }}
              className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left text-destructive/90 hover:bg-destructive/10 hover:text-destructive"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              Kijelentkezés
            </button>
          </div>
        </div>

        {/* Right Content */}
        <ScrollArea className="flex-1 bg-background">
          <div className="p-6 md:p-8 max-w-2xl">

            {/* -------------------- ACCOUNT TAB -------------------- */}
            {activeTab === "account" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h1 className="text-xl font-medium mb-6 tracking-tight">Fiók</h1>
                <div className="space-y-8">
                  {/* Info Card */}
                  <Card className="rounded-xl border border-border/50 bg-muted/30">
                    <CardContent className="px-4 flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-xl font-semibold text-foreground shrink-0 border border-border">
                        {initials}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-lg text-foreground truncate">{user.name}</p>
                          <span className="inline-flex items-center rounded-md border border-primary/20 px-2 py-0.5 text-[12px] font-medium tracking-wider  text-primary">
                            {TIER_LABELS[currentTier]}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quota */}
                  <div>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Felhasználás</h2>
                    {quota ? (
                      <UsageMeter quota={quota} />
                    ) : (
                      <div className="h-28 w-full animate-pulse bg-muted/40 rounded-xl" />
                    )}
                  </div>

                  {/* Quick Upgrade Callout for Free Users */}
                  {!isPaid && (
                    <div className="rounded-xl border-2 border-border/50 bg-muted/30 p-5 mt-6">
                      <h3 className="text-xl font-medium mb-2">Turbózd fel a Reig Chat élményt!</h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        A Pro csomaggal hatalmas keretet kapsz minden 8 órában. Elég ahhoz, hogy gondtalanul alkoss komplett projekteket anélkül, hogy aggódnod kéne a korlátok miatt.
                      </p>
                      <Button size="sm" onClick={() => setActiveTab("pro")} className="w-full sm:w-auto">
                        Csomagok megtekintése
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* -------------------- BILLING TAB -------------------- */}
            {activeTab === "billing" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h1 className="text-xl font-medium mb-6 tracking-tight">Előfizetés és Számlázás</h1>
                <div className="space-y-8">
                  {/* Current Subs */}
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Jelenlegi Előfizetés</CardTitle>
                      <CardDescription>Ellenőrizd és kezeld az előfizetésed állapotát.</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-0">
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted border border-border/50">
                        <div className="flex-1">
                          <p className="text-sm font-medium">Aktív csomag: <span className="font-medium text-muted-foreground ml-0">{TIER_LABELS[currentTier]}</span></p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {isPaid ? "Az előfizetéseket és bankkártyákat a Stripe portálon tudod módosítani, lemondani." : "Jelenleg az ingyenes csomagot használod."}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    {isPaid && (
                      <CardFooter className="">
                        <Button onClick={openPortal} disabled={loading} className="w-full sm:w-auto">
                          {loading ? "Betöltés..." : "Számlázási Portál Megnyitása"}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>

                  {/* History */}
                  <div>
                    <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Számlázási Előzmények</h2>
                    {invoicesLoading ? (
                      <div className="flex justify-center py-6">
                        <ChatSpinner name="pulse" />
                      </div>
                    ) : invoices.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 border border-border/50 rounded-xl">
                        Nincsenek elérhető számlák.
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border/50 overflow-hidden">
                        {invoices.map((inv, idx) => (
                          <div key={inv.id} className={cn("flex items-center justify-between p-4", idx !== invoices.length - 1 && "border-b border-border/50")}>
                            <div>
                              <p className="text-sm font-medium">{format(new Date(inv.date), "yyyy. MMMM d.")}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-muted-foreground">{inv.currency.toUpperCase()} {(inv.amount / 100).toFixed(2)}</p>
                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full uppercase font-semibold", inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground')}>
                                  {inv.status}
                                </span>
                              </div>
                            </div>
                            {inv.pdfUrl && (
                              <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline font-medium px-2 py-1">
                                Letöltés
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* -------------------- PRO PLANS TAB -------------------- */}
            {activeTab === "pro" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h1 className="text-xl font-medium mb-6 tracking-tight">Prémium Csomagok</h1>
                <p className="text-sm text-muted-foreground mb-8">
                  Nincs hűségidő. Bármikor lemondható a portálon, és az adataid megmaradnak, még ha visszaváltasz az ingyenes csomagra is.
                </p>

                <div className="flex flex-row items-stretch gap-4">
                  {PLANS.filter(p => p.tier !== "FREE").map((plan) => {
                    const isCurrentTier = currentTier === plan.tier;
                    return (
                      <Card
                        key={plan.tier}
                        className={cn(
                          "relative flex flex-col transition-all overflow-hidden py-0 w-full",
                          plan.highlighted ? "border-primary/50 shadow-md ring-1 ring-primary/20" : "border-border shadow-sm"
                        )}
                      >

                        <div className="px-6 py-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-4xl font-medium">{plan.name}</h3>
                            </div>
                            <div className="text-right">
                              <span className="text-3xl font-medium text-foreground">{plan.price}</span>
                              <span className="text-sm text-muted-foreground ml-1">{plan.cycle}</span>
                            </div>
                          </div>

                          <div className="my-6 h-px w-full bg-border/60" />

                          <ul className="space-y-3 mb-6">
                            {plan.features.map((f, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm">
                                <span className={f.included ? "text-primary mt-0.5" : "text-muted-foreground/40"}>
                                  {f.included ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                  ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                  )}
                                </span>
                                <span className={f.included ? "text-foreground/90 font-medium" : "text-muted-foreground/50 leading-snug"}>{f.text}</span>
                              </li>
                            ))}
                          </ul>

                          {isCurrentTier ? (
                            <div className="w-full rounded-lg border border-border bg-muted/40 py-3 text-center text-sm font-medium text-muted-foreground">
                              Jelenlegi Csomagod
                            </div>
                          ) : plan.planName ? (
                            <Button
                              variant={plan.highlighted ? "default" : "outline"}
                              className="w-full py-6 text-sm font-medium"
                              disabled={loading}
                              onClick={() => handleUpgrade(plan.planName)}
                            >
                              {loading ? "Kérlek várj..." : plan.cta}
                            </Button>
                          ) : null}


                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* -------------------- APPEARANCE TAB -------------------- */}
            {activeTab === "appearance" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h1 className="text-xl font-medium mb-6 tracking-tight">Megjelenés</h1>
                <div className="space-y-6">
                  <div>
                    <h2 className="mb-4 text-sm font-medium text-foreground">Téma</h2>
                    <div className="grid grid-cols-3 gap-4">
                      {["light", "dark", "system"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={cn(
                            "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                            theme === t ? "border-primary bg-primary/5" : "border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40"
                          )}
                        >
                          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center border", theme === t ? "bg-primary text-primary-foreground border-transparent" : "bg-background border-border text-muted-foreground")}>
                            {t === 'light' ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
                            ) : t === 'dark' ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>
                            )}
                          </div>
                          <span className="text-xs font-medium ">
                            {t === 'light' ? 'Világos' : t === 'dark' ? 'Sötét' : 'Rendszer'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------- PRIVACY TAB -------------------- */}
            {activeTab === "privacy" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h1 className="text-xl font-bold mb-6 tracking-tight">Adatvédelem és Biztonság</h1>
                <div className="space-y-6">

                  <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                      <CardTitle className="text-base">Adatok exportálása</CardTitle>
                      <CardDescription>Töltsd le az összes beszélgetésed és adataid egy ZIP fájlban.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => alert("Ez a funkció hamarosan elérhető lesz.")}>
                        Exportálás kérése
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-destructive/20 shadow-sm overflow-hidden bg-destructive/5">
                    <CardHeader className="border-b border-destructive/10 pb-4">
                      <CardTitle className="text-base text-destructive">Fiók törlése</CardTitle>
                      <CardDescription className="text-destructive/80">
                        Véglegesen törli a fiókodat, az összes projektedet, emlékedet és beszélgetésedet. Ez a művelet nem vonható vissza.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 flex justify-end">
                      <Button variant="destructive" size="sm" onClick={() => alert("A fiókod törléséhez kérlek írj az ügyfélszolgálatnak.")}>
                        Fiók végleges törlése
                      </Button>
                    </CardContent>
                  </Card>

                </div>
              </div>
            )}

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
