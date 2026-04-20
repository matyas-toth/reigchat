"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Tick01Icon } from "@hugeicons/core-free-icons";

export interface Project {
  id: string;
  name: string;
  emoji: string;
}

interface MoveToProjectPickerProps {
  trigger: React.ReactNode;
  projects: Project[];
  currentProjectId: string | null;
  onMove: (projectId: string | null) => void;
  onCreateProject: (name: string) => Promise<Project>;
}

export function MoveToProjectPicker({
  trigger,
  projects,
  currentProjectId,
  onMove,
  onCreateProject,
}: MoveToProjectPickerProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSelect = (projectId: string | null) => {
    onMove(projectId);
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!newName.trim() || loading) return;
    setLoading(true);
    try {
      const project = await onCreateProject(newName.trim());
      onMove(project.id);
      setOpen(false);
      setNewName("");
      setCreating(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <span className="contents cursor-pointer">{trigger}</span>
        }
      />
      <PopoverContent
        className="w-56 p-1.5 rounded-xl shadow-lg"
        align="start"
        sideOffset={4}
      >
        {/* No project */}
        <button
          onClick={() => handleSelect(null)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
            currentProjectId === null
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
        >
          <span className="text-muted-foreground/60 text-base leading-none">–</span>
          <span className="flex-1 text-left">Nincs projekt</span>
          {currentProjectId === null && (
            <HugeiconsIcon icon={Tick01Icon} size={14} className="text-emerald-500" />
          )}
        </button>

        {projects.length > 0 && <div className="my-1 h-px bg-border/40" />}

        {/* Existing projects */}
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => handleSelect(project.id)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
              currentProjectId === project.id
                ? "bg-muted text-foreground"
                : "text-foreground/80 hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <span className="text-base leading-none">{project.emoji}</span>
            <span className="flex-1 truncate text-left">{project.name}</span>
            {currentProjectId === project.id && (
              <HugeiconsIcon icon={Tick01Icon} size={14} className="text-emerald-500" />
            )}
          </button>
        ))}

        {/* Create new project */}
        <div className="my-1 h-px bg-border/40" />
        {creating ? (
          <div className="px-2 py-1.5">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") { setCreating(false); setNewName(""); }
              }}
              placeholder="Projekt neve..."
              className="w-full rounded-md bg-muted px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              disabled={loading}
            />
            <div className="mt-1.5 flex gap-1.5 justify-end">
              <button
                onClick={() => { setCreating(false); setNewName(""); }}
                className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Mégse
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || loading}
                className="rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground font-medium transition-opacity disabled:opacity-40"
              >
                Létrehozás
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={2} />
            <span>Új projekt</span>
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
