"use client";

import { cn } from "@/lib/utils";

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

interface FlightTrackerRowProps {
  project: Project;
}

export function FlightTrackerRow({ project }: FlightTrackerRowProps) {
  const tasks = project.items.filter((i) => i.type === "TASK");
  const notes = project.items.filter((i) => i.type === "NOTE");
  const ideas = project.items.filter((i) => i.type === "IDEA");

  const getTasks = (status: "TODO" | "IN_PROGRESS" | "WAITING" | "DONE") =>
    tasks.filter((t) => t.status === status);

  const accentColor = project.color || "#ffffff";
  const hasActiveTasks = getTasks("IN_PROGRESS").length > 0;

  return (
    <div className="relative grid grid-cols-[280px_minmax(240px,1fr)_minmax(240px,1fr)_minmax(240px,1fr)_minmax(240px,1fr)] gap-4 border-b border-border/50 pb-6 pr-6">
      {/* Fixed Sticky Left Column: Project Details */}
      <div className="sticky left-0 top-0 z-10 flex flex-col gap-3 bg-background pr-4 pl-6">
        <div className="flex items-start gap-2">
          {/* Status/Accent Bar */}
          <div
            className="mt-1 h-3 w-3 shrink-0 rounded-sm"
            style={{ backgroundColor: accentColor }}
          />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-foreground">
              {project.emoji} {project.name}
            </h3>
            {project.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Notes & Ideas Drawer (Compact) */}
        {(notes.length > 0 || ideas.length > 0) && (
          <div className="mt-2 flex flex-col gap-2 rounded-md border border-border/50 bg-muted/30 p-2">
            {notes.length > 0 && (
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Notes
                </span>
                <ul className="mt-1 flex flex-col gap-1">
                  {notes.map((note) => (
                    <li
                      key={note.id}
                      className="truncate text-xs text-secondary-foreground"
                    >
                      <span className="mr-1 text-muted-foreground">
                        -
                      </span>
                      {note.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ideas.length > 0 && (
              <div className={notes.length > 0 ? "mt-2" : ""}>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Ideas
                </span>
                <ul className="mt-1 flex flex-col gap-1">
                  {ideas.map((idea) => (
                    <li
                      key={idea.id}
                      className="truncate text-xs text-secondary-foreground"
                    >
                      <span className="mr-1 text-muted-foreground">
                        -
                      </span>
                      {idea.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Columns */}
      <KanbanColumn items={getTasks("TODO")} />
      <KanbanColumn items={getTasks("IN_PROGRESS")} isActive={project.isActive && hasActiveTasks} accentColor={accentColor} />
      <KanbanColumn items={getTasks("WAITING")} />
      <KanbanColumn items={getTasks("DONE")} isDone />
    </div>
  );
}

function KanbanColumn({
  items,
  isActive = false,
  accentColor,
  isDone = false,
}: {
  items: Item[];
  isActive?: boolean;
  accentColor?: string;
  isDone?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 ? (
        <div className="flex h-12 w-full items-center justify-center rounded-md border border-dashed border-border/30 bg-transparent text-[10px] font-mono text-muted-foreground/30">
          EMPTY
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "group relative flex flex-col gap-2 rounded-md border border-border bg-card p-3",
              isDone && "opacity-50"
            )}
          >
            {/* Active Task Pulse */}
            {isActive && (
              <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ backgroundColor: accentColor }}
                />
                <span
                  className="relative inline-flex h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
              </span>
            )}
            
            <span
              className={cn(
                "text-sm leading-tight text-card-foreground",
                isDone && "line-through text-muted-foreground"
              )}
            >
              {item.title}
            </span>
            
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-mono text-muted-foreground">
                 {item.id.substring(0, 8)}
               </span>
              {item.dueDate && (
                <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  {new Date(item.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
