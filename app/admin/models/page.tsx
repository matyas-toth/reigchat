"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ─── Types ──────────────────────────────────────────────────── */
interface OpenRouterModel {
  id: string;
  name: string;
  pricing: { prompt: string; completion: string };
}

interface TierModelRow {
  id: string;
  modelId: string;
  tier: "FREE" | "PRO" | "ULTRA";
  label: string;
}

interface BlocklistRow {
  id: string;
  modelId: string;
  reason?: string;
}

type TierGroup = { FREE: TierModelRow[]; PRO: TierModelRow[]; ULTRA: TierModelRow[] };

/* ─── Helpers ─────────────────────────────────────────────────── */
function pricePerM(raw: string): string {
  const n = parseFloat(raw);
  if (isNaN(n) || n === 0) return "Free";
  const v = n * 1_000_000;
  return v < 0.01 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`;
}

const TIER_COLORS: Record<string, string> = {
  FREE: "text-white/40 border-white/10",
  PRO: "text-blue-400/80 border-blue-400/20",
  ULTRA: "text-purple-400/80 border-purple-400/20",
};

const TIER_ACTIVE: Record<string, string> = {
  FREE: "bg-white/[0.06]",
  PRO: "bg-blue-500/10",
  ULTRA: "bg-purple-500/10",
};

/* ─── Sortable card ───────────────────────────────────────────── */
function SortableModelCard({ item, onRemove, isBlocked }: {
  item: TierModelRow;
  onRemove: () => void;
  isBlocked: boolean;
}) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.015] group",
        isBlocked && "opacity-30 pointer-events-none"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-white/15 hover:text-white/40 transition-colors cursor-grab active:cursor-grabbing shrink-0 touch-none"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="4" r="1.2" />
          <circle cx="11" cy="4" r="1.2" />
          <circle cx="5" cy="8" r="1.2" />
          <circle cx="11" cy="8" r="1.2" />
          <circle cx="5" cy="12" r="1.2" />
          <circle cx="11" cy="12" r="1.2" />
        </svg>
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-white/75 truncate leading-tight">{item.label}</p>
        <p className="text-[10px] text-white/20 font-mono truncate">{item.modelId}</p>
      </div>

      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400/70 transition-all p-0.5 shrink-0"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  );
}

/* ─── Droppable tier column ────────────────────────────────────── */
function TierColumn({
  tier, items, blockedIds, onRemove,
}: {
  tier: "FREE" | "PRO" | "ULTRA";
  items: TierModelRow[];
  blockedIds: Set<string>;
  onRemove: (modelId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `droppable-${tier}` });

  return (
    <div className="flex flex-col h-full">
      {/* Column header */}
      <div className={cn("flex items-center justify-between px-4 py-3 rounded-t-xl border-x border-t", TIER_COLORS[tier], "border-opacity-100")}>
        <div className="flex items-center gap-2">
          <span className={cn("text-[11px] font-semibold tracking-[0.08em] uppercase", TIER_COLORS[tier].split(" ")[0])}>
            {tier}
          </span>
          <span className="text-[11px] text-white/20 font-mono">({items.length})</span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 flex flex-col gap-1.5 p-3 rounded-b-xl border-x border-b min-h-[200px] transition-colors duration-150",
          TIER_COLORS[tier].split(" ")[1], // border color
          isOver ? TIER_ACTIVE[tier] : "bg-white/[0.012]"
        )}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[11px] text-white/15 text-center">
                Drag models here<br />from the catalog
              </p>
            </div>
          )}
          {items.map((item) => (
            <SortableModelCard
              key={item.id}
              item={item}
              onRemove={() => onRemove(item.modelId)}
              isBlocked={blockedIds.has(item.modelId)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

/* ─── Catalog row ─────────────────────────────────────────────── */
function CatalogRow({ model, inTiers, isBlocked, onAdd, onBlock, onUnblock }: {
  model: OpenRouterModel;
  inTiers: Set<string>;
  isBlocked: boolean;
  onAdd: (tier: "FREE" | "PRO" | "ULTRA") => void;
  onBlock: () => void;
  onUnblock: () => void;
}) {
  const isFree = model.pricing.prompt === "0" && model.pricing.completion === "0";
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn("px-4 py-2.5 hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] last:border-0", isBlocked && "opacity-35")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-white/75 truncate">{model.name}</span>
            {isFree && (
              <span className="text-[9px] px-1 py-px rounded bg-emerald-500/15 text-emerald-400/70 font-medium shrink-0">FREE</span>
            )}
            {isBlocked && (
              <span className="text-[9px] px-1 py-px rounded bg-red-500/15 text-red-400/70 font-medium shrink-0">BLOCKED</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-white/20 font-mono truncate">{model.id}</span>
            <span className="text-[10px] text-white/20 shrink-0">
              {pricePerM(model.pricing.prompt)} in · {pricePerM(model.pricing.completion)} out
            </span>
          </div>
        </div>

        {/* Actions (show on hover) */}
        <div className={cn("flex items-center gap-1 shrink-0 transition-opacity duration-100", hovered ? "opacity-100" : "opacity-0")}>
          {(["FREE", "PRO", "ULTRA"] as const).map((t) => (
            <button
              key={t}
              disabled={isBlocked || inTiers.has(t)}
              onClick={() => onAdd(t)}
              className={cn(
                "text-[9px] px-1.5 py-0.5 rounded border font-medium transition-colors",
                inTiers.has(t)
                  ? "border-white/[0.06] text-white/20 cursor-default"
                  : isBlocked
                    ? "border-white/[0.04] text-white/15 cursor-not-allowed"
                    : cn(
                      "cursor-pointer hover:bg-white/[0.05]",
                      t === "ULTRA" ? "border-purple-400/20 text-purple-400/60 hover:text-purple-400" :
                        t === "PRO" ? "border-blue-400/20 text-blue-400/60 hover:text-blue-400" :
                          "border-white/10 text-white/30 hover:text-white/60"
                    )
              )}
            >
              {inTiers.has(t) ? "✓" : "+"}{t}
            </button>
          ))}
          <button
            onClick={isBlocked ? onUnblock : onBlock}
            className={cn(
              "text-[9px] px-1.5 py-0.5 rounded border font-medium transition-colors cursor-pointer",
              isBlocked
                ? "border-emerald-400/20 text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10"
                : "border-red-400/20 text-red-400/50 hover:text-red-400 hover:bg-red-500/10"
            )}
          >
            {isBlocked ? "Unblock" : "Block"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */
export default function AdminModelsPage() {
  const [catalog, setCatalog] = useState<OpenRouterModel[]>([]);
  const [tierGroups, setTierGroups] = useState<TierGroup>({ FREE: [], PRO: [], ULTRA: [] });
  const [blocklist, setBlocklist] = useState<BlocklistRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<TierModelRow | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const fetchAll = useCallback(async () => {
    const [catRes, modRes, blRes] = await Promise.all([
      fetch("/api/admin/openrouter-models"),
      fetch("/api/admin/models"),
      fetch("/api/admin/blocklist"),
    ]);
    if (catRes.ok) setCatalog(await catRes.json());
    if (modRes.ok) setTierGroups(await modRes.json());
    if (blRes.ok) setBlocklist(await blRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const blockedIds = new Set(blocklist.map((b) => b.modelId));

  const filtered = catalog.filter((m) =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase())
  );

  const addToTier = async (model: OpenRouterModel, tier: "FREE" | "PRO" | "ULTRA") => {
    await fetch("/api/admin/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: model.id, tier, label: model.name }),
    });
    await fetchAll();
  };

  const removeFromTier = async (modelId: string, tier: "FREE" | "PRO" | "ULTRA") => {
    await fetch("/api/admin/models", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId, tier }),
    });
    await fetchAll();
  };

  const addToBlocklist = async (modelId: string) => {
    await fetch("/api/admin/blocklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId }),
    });
    await fetchAll();
  };

  const removeFromBlocklist = async (modelId: string) => {
    await fetch("/api/admin/blocklist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId }),
    });
    await fetchAll();
  };

  /* ─── DnD handlers ─────────────────────────────────── */
  const allTierItems = [...tierGroups.FREE, ...tierGroups.PRO, ...tierGroups.ULTRA];

  const findTierForItem = (id: string): "FREE" | "PRO" | "ULTRA" | null => {
    for (const tier of (["FREE", "PRO", "ULTRA"] as const)) {
      if (tierGroups[tier].some((i) => i.id === id)) return tier;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    const item = allTierItems.find((i) => i.id === event.active.id);
    setActiveDragItem(item ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDragItem(null);
    if (!over) return;

    const activeItemId = String(active.id);
    const overId = String(over.id);

    // Determine source tier
    const sourceTier = findTierForItem(activeItemId);
    if (!sourceTier) return;

    // Dropped on a droppable tier zone?
    if (overId.startsWith("droppable-")) {
      const destTier = overId.replace("droppable-", "") as "FREE" | "PRO" | "ULTRA";
      if (destTier === sourceTier) return;

      const activeItem = tierGroups[sourceTier].find((i) => i.id === activeItemId);
      if (!activeItem) return;

      // Move: remove from source, add to dest
      await removeFromTier(activeItem.modelId, sourceTier);
      await fetch("/api/admin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: activeItem.modelId, tier: destTier, label: activeItem.label }),
      });
      await fetchAll();
      return;
    }

    // Dropped on another item in same column — reorder (optimistic)
    const destTier = findTierForItem(overId);
    if (!destTier) return;

    if (sourceTier === destTier) {
      // Reorder within same column
      const items = tierGroups[sourceTier];
      const oldIndex = items.findIndex((i) => i.id === activeItemId);
      const newIndex = items.findIndex((i) => i.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setTierGroups((prev) => ({
          ...prev,
          [sourceTier]: arrayMove(prev[sourceTier], oldIndex, newIndex),
        }));
      }
    } else {
      // Move to different column by dropping on item there
      const activeItem = tierGroups[sourceTier].find((i) => i.id === activeItemId);
      if (!activeItem) return;
      await removeFromTier(activeItem.modelId, sourceTier);
      await fetch("/api/admin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: activeItem.modelId, tier: destTier, label: activeItem.label }),
      });
      await fetchAll();
    }
  };

  const getInTiersSet = (modelId: string) => {
    const s = new Set<string>();
    for (const tier of (["FREE", "PRO", "ULTRA"] as const)) {
      if (tierGroups[tier].some((m) => m.modelId === modelId)) s.add(tier);
    }
    return s;
  };

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden">
      {/* LEFT: catalog */}
      <div className="w-[380px] shrink-0 flex flex-col border-r border-white/[0.05]">
        {/* Search header */}
        <div className="px-4 py-3 border-b border-white/[0.05]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
              Catalog
            </span>
            <span className="text-[10px] text-white/20 font-mono">
              {catalog.length} models
            </span>
          </div>
          <input
            type="text"
            placeholder="Search catalog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-7 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] text-white/60 placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {/* Catalog list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(10)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-white/[0.03] animate-pulse" />)}
            </div>
          ) : (
            filtered.map((model) => (
              <CatalogRow
                key={model.id}
                model={model}
                inTiers={getInTiersSet(model.id)}
                isBlocked={blockedIds.has(model.id)}
                onAdd={(tier) => addToTier(model, tier)}
                onBlock={() => addToBlocklist(model.id)}
                onUnblock={() => removeFromBlocklist(model.id)}
              />
            ))
          )}
        </div>

        {/* Blocklist count footer */}
        {blocklist.length > 0 && (
          <div className="px-4 py-2.5 border-t border-white/[0.05] flex items-center justify-between">
            <span className="text-[10px] text-white/25">Blocklist</span>
            <span className="text-[10px] font-mono text-red-400/50">{blocklist.length} blocked</span>
          </div>
        )}
      </div>

      {/* RIGHT: drag-and-drop tier columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Column header strip */}
          <div className="px-6 py-3 border-b border-white/[0.05] flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
              Tier Management
            </p>
            <span className="text-[10px] text-white/15">· drag between columns to move</span>
          </div>

          {/* 3 columns */}
          <div className="flex-1 grid grid-cols-3 gap-4 p-4 overflow-y-auto">
            {(["FREE", "PRO", "ULTRA"] as const).map((tier) => (
              <TierColumn
                key={tier}
                tier={tier}
                items={tierGroups[tier]}
                blockedIds={blockedIds}
                onRemove={(modelId) => removeFromTier(modelId, tier)}
              />
            ))}
          </div>
        </div>

        {/* Drag overlay: ghost card */}
        <DragOverlay>
          {activeDragItem && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/20 bg-[#1a1a1a] shadow-xl cursor-grabbing">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-white/80 truncate">{activeDragItem.label}</p>
                <p className="text-[10px] text-white/25 font-mono truncate">{activeDragItem.modelId}</p>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
