"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  role: string;
  image: string | null;
  subscription: { tier: string; status: string; totalInputTokensUsed: number; totalOutputTokensUsed: number } | null;
  _count: { chats: number; memories: number };
}

const TIER_OPTIONS = ["FREE", "PRO", "ULTRA"];
const ROLE_OPTIONS = ["USER", "ADMIN"];

function TierBadge({ tier }: { tier: string }) {
  return (
    <span className={cn(
      "text-[10px] px-1.5 py-0.5 rounded font-medium",
      tier === "ULTRA" ? "bg-purple-500/15 text-purple-400/80" :
        tier === "PRO" ? "bg-blue-500/15 text-blue-400/80" :
          "bg-white/[0.06] text-white/30"
    )}>{tier}</span>
  );
}

function UserRow({ user, onUpdate, onDelete }: {
  user: User;
  onUpdate: (userId: string, field: "role" | "tier", value: string) => void;
  onDelete: (userId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const tier = user.subscription?.tier ?? "FREE";
  const totalTokens = (user.subscription?.totalInputTokensUsed ?? 0) + (user.subscription?.totalOutputTokensUsed ?? 0);

  return (
    <>
      <div
        className="grid items-center px-5 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer group"
        style={{ gridTemplateColumns: "28px 1fr 180px 80px 80px 80px 36px" }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-medium text-white/50 shrink-0">
          {user.name?.[0]?.toUpperCase() ?? "?"}
        </div>

        {/* Name + email */}
        <div className="min-w-0 pl-3">
          <p className="text-[13px] text-white/80 truncate leading-tight">{user.name}</p>
          <p className="text-[11px] text-white/25 truncate font-mono">{user.email}</p>
        </div>

        {/* Joined */}
        <span className="text-[11px] text-white/25 font-mono tabular-nums">
          {new Date(user.createdAt).toLocaleDateString("hu-HU")}
        </span>

        {/* Tier */}
        <div onClick={(e) => e.stopPropagation()}>
          <TierBadge tier={tier} />
        </div>

        {/* Role */}
        <div>
          {user.role === "ADMIN" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400/80 font-medium">ADMIN</span>
          )}
        </div>

        {/* Token count */}
        <span className="text-[11px] text-white/20 tabular-nums font-mono">
          {(totalTokens / 1000).toFixed(1)}k
        </span>

        {/* Expand chevron */}
        <svg
          width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
          className={cn("text-white/20 transition-transform duration-150", expanded && "rotate-90")}
        >
          <path d="M6 4l4 4-4 4" />
        </svg>
      </div>

      {/* Expanded row actions */}
      {expanded && (
        <div className="px-5 pb-4 pt-1 bg-white/[0.015] border-t border-white/[0.04] grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-white/25 font-medium">Activity</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Chats", val: user._count.chats },
                { label: "Memories", val: user._count.memories },
                { label: "Tokens", val: `${(totalTokens / 1000).toFixed(1)}k` },
              ].map(({ label, val }) => (
                <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <p className="text-[10px] text-white/30">{label}</p>
                  <p className="text-[16px] font-light text-white/80 tabular-nums">{val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-white/25 font-medium">Controls</p>
            <div className="flex flex-wrap gap-2 items-start">
              {/* Tier select */}
              <div className="flex gap-px rounded-lg overflow-hidden border border-white/[0.08]">
                {TIER_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdate(user.id, "tier", t)}
                    className={cn(
                      "px-3 py-1.5 text-[11px] font-medium transition-colors",
                      tier === t
                        ? t === "ULTRA" ? "bg-purple-500/25 text-purple-300" :
                          t === "PRO" ? "bg-blue-500/25 text-blue-300" :
                            "bg-white/15 text-white/70"
                        : "bg-transparent text-white/30 hover:text-white/60 hover:bg-white/[0.05]"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Role toggle */}
              <div className="flex gap-px rounded-lg overflow-hidden border border-white/[0.08]">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => onUpdate(user.id, "role", r)}
                    className={cn(
                      "px-3 py-1.5 text-[11px] font-medium transition-colors",
                      user.role === r
                        ? r === "ADMIN" ? "bg-amber-500/20 text-amber-300" : "bg-white/15 text-white/70"
                        : "bg-transparent text-white/30 hover:text-white/60 hover:bg-white/[0.05]"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Delete */}
              <button
                onClick={() => {
                  if (confirm(`Delete ${user.name}? This is permanent.`)) onDelete(user.id);
                }}
                className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Delete user
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), search });
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleUpdate = async (userId: string, field: "role" | "tier", value: string) => {
    const body = field === "role" ? { userId, role: value } : { userId, tier: value };
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    fetchUsers();
  };

  const handleDelete = async (userId: string) => {
    await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    fetchUsers();
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/25 mb-1">Admin</p>
          <h1 className="text-[28px] font-light tracking-tight text-white/90">Users</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-white/25 font-mono tabular-nums">{total.toLocaleString()} users</span>
          <input
            type="text"
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8 w-52 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
        {/* Header row */}
        <div
          className="grid px-5 py-2.5 border-b border-white/[0.05]"
          style={{ gridTemplateColumns: "28px 1fr 180px 80px 80px 80px 36px" }}
        >
          {["", "User", "Joined", "Tier", "Role", "Tokens", ""].map((h, i) => (
            <span key={i} className="text-[10px] font-medium uppercase tracking-widest text-white/20 pl-3 first:pl-0">
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 px-5 flex items-center gap-4">
                <div className="h-5 w-5 rounded-full bg-white/[0.04] animate-pulse" />
                <div className="flex-1 h-4 rounded bg-white/[0.03] animate-pulse" />
                <div className="w-24 h-4 rounded bg-white/[0.03] animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {users.map((user) => (
              <UserRow key={user.id} user={user} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-white/[0.05]">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="h-7 w-7 rounded-lg border border-white/[0.08] text-white/30 hover:text-white/60 hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M10 3L5 8l5 5" />
              </svg>
            </button>
            <span className="text-[12px] text-white/30 font-mono">{page} / {pages}</span>
            <button
              disabled={page >= pages}
              onClick={() => setPage(p => p + 1)}
              className="h-7 w-7 rounded-lg border border-white/[0.08] text-white/30 hover:text-white/60 hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6 3l5 5-5 5" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
