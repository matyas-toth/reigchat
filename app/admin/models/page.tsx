"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OpenRouterModel {
  id: string;
  name: string;
  pricing: { prompt: string; completion: string };
  description?: string;
}

interface TierModel {
  id: string;
  modelId: string;
  tier: "FREE" | "PRO" | "ULTRA";
  label: string;
}

interface BlocklistEntry {
  id: string;
  modelId: string;
  reason?: string;
}

type TierGroup = { FREE: TierModel[]; PRO: TierModel[]; ULTRA: TierModel[] };

const TIERS: Array<"FREE" | "PRO" | "ULTRA"> = ["FREE", "PRO", "ULTRA"];

const TIER_COLORS: Record<string, string> = {
  FREE: "text-muted-foreground border-border/50",
  PRO: "text-blue-400 border-blue-400/30",
  ULTRA: "text-purple-400 border-purple-400/30",
};

function pricePerM(raw: string): string {
  const n = parseFloat(raw);
  if (isNaN(n)) return "?";
  if (n === 0) return "Free";
  return `$${(n * 1_000_000).toFixed(2)}/M`;
}

export default function AdminModelsPage() {
  const [catalog, setCatalog] = useState<OpenRouterModel[]>([]);
  const [tierGroups, setTierGroups] = useState<TierGroup>({ FREE: [], PRO: [], ULTRA: [] });
  const [blocklist, setBlocklist] = useState<BlocklistEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTier, setActiveTier] = useState<"FREE" | "PRO" | "ULTRA">("FREE");
  const [addingTo, setAddingTo] = useState<Record<string, boolean>>({});
  const [blockingId, setBlockingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [catalogRes, modelsRes, blocklistRes] = await Promise.all([
      fetch("/api/admin/openrouter-models"),
      fetch("/api/admin/models"),
      fetch("/api/admin/blocklist"),
    ]);
    if (catalogRes.ok) setCatalog(await catalogRes.json());
    if (modelsRes.ok) setTierGroups(await modelsRes.json());
    if (blocklistRes.ok) setBlocklist(await blocklistRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const blockedIds = new Set(blocklist.map((b) => b.modelId));

  const filtered = catalog.filter((m) =>
    search
      ? m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.id.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const addToTier = async (model: OpenRouterModel, tier: "FREE" | "PRO" | "ULTRA") => {
    const key = `${model.id}_${tier}`;
    setAddingTo((p) => ({ ...p, [key]: true }));
    await fetch("/api/admin/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: model.id, tier, label: model.name }),
    });
    await fetchAll();
    setAddingTo((p) => ({ ...p, [key]: false }));
  };

  const removeFromTier = async (modelId: string, tier: "FREE" | "PRO" | "ULTRA") => {
    await fetch("/api/admin/models", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId, tier }),
    });
    await fetchAll();
  };

  const addToBlocklist = async (model: OpenRouterModel) => {
    setBlockingId(model.id);
    await fetch("/api/admin/blocklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: model.id }),
    });
    await fetchAll();
    setBlockingId(null);
  };

  const removeFromBlocklist = async (modelId: string) => {
    await fetch("/api/admin/blocklist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId }),
    });
    await fetchAll();
  };

  const isInTier = (modelId: string, tier: "FREE" | "PRO" | "ULTRA") =>
    tierGroups[tier].some((m) => m.modelId === modelId);

  return (
    <div className="flex h-[calc(100vh-49px)] overflow-hidden">
      {/* LEFT: OpenRouter Catalog */}
      <div className="w-[440px] shrink-0 border-r border-border/50 flex flex-col">
        <div className="px-4 py-3 border-b border-border/50">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            OpenRouter Catalog · {catalog.length} models
          </p>
          <Input
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Loading catalog...
            </div>
          ) : (
            filtered.map((model) => {
              const isFreeModel = model.pricing.prompt === "0" && model.pricing.completion === "0";
              const isBlocked = blockedIds.has(model.id);
              return (
                <div
                  key={model.id}
                  className={cn(
                    "px-4 py-2.5 group hover:bg-accent/30 transition-colors",
                    isBlocked && "opacity-40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium truncate">{model.name}</span>
                        {isFreeModel && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-green-500 border-green-500/30">
                            Free
                          </Badge>
                        )}
                        {isBlocked && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-destructive border-destructive/30">
                            Blocked
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground font-mono">{model.id}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        <span>In: {pricePerM(model.pricing.prompt)}</span>
                        <span>Out: {pricePerM(model.pricing.completion)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {TIERS.map((tier) => (
                          <button
                            key={tier}
                            disabled={isBlocked || isInTier(model.id, tier) || addingTo[`${model.id}_${tier}`]}
                            onClick={() => addToTier(model, tier)}
                            title={`Add to ${tier}`}
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded border font-medium transition-colors",
                              isInTier(model.id, tier)
                                ? "border-border/30 text-muted-foreground/40 cursor-default"
                                : "border-border/50 hover:bg-accent/60 text-muted-foreground hover:text-foreground cursor-pointer",
                              isBlocked && "pointer-events-none"
                            )}
                          >
                            {isInTier(model.id, tier) ? "✓" : "+"}{tier}
                          </button>
                        ))}
                        <button
                          onClick={() => isBlocked ? removeFromBlocklist(model.id) : addToBlocklist(model)}
                          disabled={blockingId === model.id}
                          title={isBlocked ? "Remove from blocklist" : "Block model"}
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded border font-medium transition-colors cursor-pointer",
                            isBlocked
                              ? "border-green-500/30 text-green-500 hover:bg-green-500/10"
                              : "border-destructive/30 text-destructive hover:bg-destructive/10"
                          )}
                        >
                          {isBlocked ? "Unblock" : "Block"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Tier Columns */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tier tabs */}
        <div className="flex border-b border-border/50">
          {TIERS.map((tier) => (
            <button
              key={tier}
              onClick={() => setActiveTier(tier)}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium transition-colors border-b-2",
                activeTier === tier
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tier}
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({tierGroups[tier].length})
              </span>
            </button>
          ))}
        </div>

        {/* Active tier models */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-2 max-w-lg">
            {/* Pinned openrouter/auto */}
            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-3">
              <div>
                <div className="text-sm font-medium">Automatikus</div>
                <div className="text-[11px] text-muted-foreground font-mono">openrouter/auto</div>
              </div>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">Pinned</Badge>
            </div>

            {tierGroups[activeTier].map((m) => (
              m.modelId === "openrouter/auto" ? null : (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-3 group"
                >
                  <div>
                    <div className="text-sm font-medium">{m.label}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{m.modelId}</div>
                  </div>
                  <button
                    onClick={() => removeFromTier(m.modelId, m.tier)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded"
                    title="Remove"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
                    </svg>
                  </button>
                </div>
              )
            ))}

            {tierGroups[activeTier].filter((m) => m.modelId !== "openrouter/auto").length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No models assigned to {activeTier}.<br />
                Add from the catalog on the left.
              </div>
            )}
          </div>

          {/* Blocklist section */}
          {activeTier === "FREE" && blocklist.length > 0 && (
            <div className="mt-8 max-w-lg">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Global Blocklist ({blocklist.length})
              </p>
              <div className="flex flex-col gap-2">
                {blocklist.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2.5 group"
                  >
                    <div>
                      <div className="text-[11px] font-mono text-muted-foreground">{b.modelId}</div>
                      {b.reason && <div className="text-[11px] text-muted-foreground/60">{b.reason}</div>}
                    </div>
                    <button
                      onClick={() => removeFromBlocklist(b.modelId)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-green-500 transition-all p-1 rounded text-xs"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
