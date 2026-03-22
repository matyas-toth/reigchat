"use client";

import { useEffect, useState } from "react";
import { FlightTrackerRow } from "./FlightTrackerRow";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Item {
  id: string;
  type: "TASK" | "NOTE" | "IDEA";
  title: string;
  content: string | null;
  status: "TODO" | "IN_PROGRESS" | "WAITING" | "DONE";
  dueDate: string | null;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  color: string | null;
  emoji: string | null;
  items: Item[];
  updatedAt: string;
}

interface TaskViewProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function TaskView({ sidebarOpen, onToggleSidebar }: TaskViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"active" | "archived" | "all">(
    "active"
  );

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) => {
    if (filter === "active") return p.isActive;
    if (filter === "archived") return !p.isActive;
    return true;
  });

  const totalTasks = filtered.reduce(
    (acc, p) =>
      acc + p.items.filter((i) => i.type === "TASK").length,
    0
  );
  const doneTasks = filtered.reduce(
    (acc, p) =>
      acc +
      p.items.filter(
        (i) => i.type === "TASK" && i.status === "DONE"
      ).length,
    0
  );

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-3">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={onToggleSidebar}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M2 4h12M2 8h12M2 12h12" />
              </svg>
            </Button>
          )}
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              Mission Control
            </h1>
            <p className="text-[11px] font-mono text-muted-foreground uppercase opacity-80">
              {filtered.length} SYS · {doneTasks}/{totalTasks} OPT
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-1 rounded-md border border-border bg-card p-0.5">
          {(["active", "archived", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                filter === f
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Flight Tracker Area */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Loading telemetry...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <div className="text-4xl">📭</div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            No active systems
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="min-w-[1240px] px-6 py-6">
            
            {/* Kanban Header */}
            <div className="grid grid-cols-[280px_minmax(240px,1fr)_minmax(240px,1fr)_minmax(240px,1fr)_minmax(240px,1fr)] gap-4 border-b border-border/50 pb-3 mb-6 pr-6">
              <div className="sticky left-0 z-10 bg-background text-[10px] font-mono font-bold tracking-[0.2em] text-muted-foreground uppercase pl-6">
                System
              </div>
              <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-muted-foreground uppercase">
                Todo
              </div>
              <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-muted-foreground uppercase">
                In Progress
              </div>
              <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-muted-foreground uppercase">
                Waiting
              </div>
              <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-muted-foreground uppercase">
                Done
              </div>
            </div>

            {/* Kanban Rows */}
            <div className="flex flex-col gap-6">
              {filtered.map((project) => (
                <FlightTrackerRow key={project.id} project={project} />
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
