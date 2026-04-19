"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Analytics {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  totalMemories: number;
  tiers: { FREE: number; PRO: number; ULTRA: number };
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
    role: string;
    subscription: { tier: string; totalInputTokensUsed: number; totalOutputTokensUsed: number } | null;
  }>;
}

function StatStrip({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between py-3.5 border-b border-white/[0.05] last:border-0 group">
      <span className="text-[13px] text-white/40 group-hover:text-white/60 transition-colors">{label}</span>
      <div className="flex items-baseline gap-2">
        {sub && <span className="text-[11px] text-white/20 font-mono">{sub}</span>}
        <span className="text-[22px] font-light tracking-tight tabular-nums text-white/90">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
      </div>
    </div>
  );
}

function TierBar({ tiers }: { tiers: { FREE: number; PRO: number; ULTRA: number } }) {
  const total = (tiers.FREE || 0) + (tiers.PRO || 0) + (tiers.ULTRA || 0);
  if (total === 0) return null;
  const freeW = ((tiers.FREE || 0) / total) * 100;
  const proW = ((tiers.PRO || 0) / total) * 100;
  const ultraW = ((tiers.ULTRA || 0) / total) * 100;
  return (
    <div className="space-y-3">
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        <div className="bg-white/20 rounded-full" style={{ width: `${freeW}%` }} />
        <div className="bg-blue-400/60 rounded-full" style={{ width: `${proW}%` }} />
        <div className="bg-purple-400/70 rounded-full" style={{ width: `${ultraW}%` }} />
      </div>
      <div className="flex items-center gap-4">
        {[
          { label: "Free", count: tiers.FREE, color: "bg-white/20" },
          { label: "Pro", count: tiers.PRO, color: "bg-blue-400/60" },
          { label: "Ultra", count: tiers.ULTRA, color: "bg-purple-400/70" },
        ].map(({ label, count, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn("h-1.5 w-1.5 rounded-full", color)} />
            <span className="text-[11px] text-white/40">{label}</span>
            <span className="text-[11px] text-white/70 tabular-nums font-mono">{(count || 0).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Page header */}
      <div className="mb-10">
        <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/25 mb-1">Platform</p>
        <h1 className="text-[28px] font-light tracking-tight text-white/90">Overview</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : data && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Users */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/30 mb-4">Users</p>
              <StatStrip label="Total registered" value={data.totalUsers} />
              <StatStrip label="Chats created" value={data.totalChats} />
              <StatStrip label="Total messages" value={data.totalMessages} />
            </div>

            {/* Tiers */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/30 mb-4">Subscriptions</p>
              <StatStrip label="Free users" value={data.tiers.FREE || 0} />
              <StatStrip label="Pro users" value={data.tiers.PRO || 0} sub="paid" />
              <StatStrip label="Ultra users" value={data.tiers.ULTRA || 0} sub="paid" />
            </div>

            {/* Activity */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/30 mb-4">Activity</p>
              <StatStrip label="Memory entries" value={data.totalMemories} />
              <StatStrip
                label="Msgs/user avg"
                value={data.totalUsers > 0 ? (data.totalMessages / data.totalUsers).toFixed(1) : "—"}
              />
              <StatStrip
                label="Chats/user avg"
                value={data.totalUsers > 0 ? (data.totalChats / data.totalUsers).toFixed(1) : "—"}
              />
            </div>
          </div>

          {/* Tier distribution */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mb-6">
            <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/30 mb-4">Tier Distribution</p>
            <TierBar tiers={data.tiers} />
          </div>

          {/* Recent users */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
              <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/30">Recent Signups</p>
              <Link href="/admin/users" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {data.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  {/* Avatar */}
                  <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-medium text-white/60 shrink-0">
                    {user.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white/80 truncate">{user.name}</p>
                    <p className="text-[11px] text-white/30 truncate font-mono">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {user.role === "ADMIN" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400/80 font-medium">ADMIN</span>
                    )}
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-medium",
                      user.subscription?.tier === "ULTRA" ? "bg-purple-500/15 text-purple-400/80" :
                        user.subscription?.tier === "PRO" ? "bg-blue-500/15 text-blue-400/80" :
                          "bg-white/[0.06] text-white/30"
                    )}>
                      {user.subscription?.tier ?? "FREE"}
                    </span>
                    <span className="text-[11px] text-white/20 font-mono tabular-nums">
                      {new Date(user.createdAt).toLocaleDateString("hu-HU")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
