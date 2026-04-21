"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  PlusSignIcon,
  Folder01Icon,
  ArrowDown01Icon,
  SidebarLeftIcon,
  BrainIcon,
  MoreHorizontalIcon,
  PencilEdit01Icon,
  Delete01Icon,
  FavouriteIcon,
  FavouriteSquareIcon,
  ArrowRight01Icon,
  CheckCheck,
  Checkbox,
  SparklesIcon,
  SettingsIcon,
} from "@hugeicons/core-free-icons";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { MoveToProjectPicker, Project } from "./MoveToProjectPicker";
import { ProfileDialog } from "@/components/profile/ProfileDialog";
import Link from "next/link";

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
  pinned: boolean;
}

interface ChatSidebarProps {
  chats: Chat[];
  projects: Project[];
  activeChat: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: (projectId?: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  onPinChat: (id: string, pinned: boolean) => void;
  onMoveChat: (id: string, projectId: string | null) => void;
  onCreateProject: (name: string, emoji: string) => Promise<Project>;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

// ── Inline editable text ──────────────────────────────────
function InlineEdit({
  value,
  onSave,
  onCancel,
  className,
}: {
  value: string;
  onSave: (v: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.select(), []);

  return (
    <input
      ref={ref}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSave(text.trim() || value);
        if (e.key === "Escape") onCancel();
      }}
      onBlur={() => onSave(text.trim() || value)}
      className={cn(
        "flex-1 truncate bg-transparent outline-none caret-emerald-500 text-[13px] font-medium",
        className
      )}
    />
  );
}

// ── Single chat row ───────────────────────────────────────
function ChatRow({
  chat,
  isActive,
  projects,
  onSelect,
  onDelete,
  onRename,
  onPin,
  onMove,
  onCreateProject,
}: {
  chat: Chat;
  isActive: boolean;
  projects: Project[];
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onPin: (pinned: boolean) => void;
  onMove: (projectId: string | null) => void;
  onCreateProject: (name: string) => Promise<Project>;
}) {
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (editing) {
    return (
      <div
        className={cn(
          "flex items-center rounded-lg px-2 h-9 text-[13px]",
          isActive
            ? "bg-zinc-200 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-50"
            : "bg-muted/50 text-foreground"
        )}
      >
        <InlineEdit
          value={chat.title}
          onSave={(v) => { onRename(v); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center rounded-lg h-9 px-2 text-[13px] transition-colors cursor-pointer",
        isActive
          ? "bg-zinc-200 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-50"
          : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
      )}
      onClick={onSelect}
    >
      <span className="flex-1 truncate font-medium">{chat.title}</span>

      {/* Hover actions */}
      <div className={cn(
        "ml-1 shrink-0 items-center gap-0.5",
        menuOpen ? "flex" : "hidden group-hover:flex"
      )}>
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          className="rounded p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
          title="Átnevezés"
        >
          <HugeiconsIcon icon={PencilEdit01Icon} size={13} strokeWidth={2} />
        </button>

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger
            render={
              <button
                onClick={(e) => e.stopPropagation()}
                className="rounded p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} size={14} strokeWidth={2} />
              </button>
            }
          />
          <DropdownMenuContent
            align="end"
            sideOffset={4}
            className="w-44 rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <HugeiconsIcon icon={PencilEdit01Icon} size={14} strokeWidth={2} className="mr-2" />
              Átnevezés
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPin(!chat.pinned)}>
              <HugeiconsIcon icon={chat.pinned ? FavouriteSquareIcon : FavouriteIcon} size={14} strokeWidth={2} className="mr-2" />
              {chat.pinned ? "Kitűzés törlése" : "Kitűzés"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Move to project sub-menu */}


            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive group"
            >
              <HugeiconsIcon icon={Delete01Icon} size={14} strokeWidth={2} className="mr-2" />
              Törlés
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="rounded p-1 text-muted-foreground/50 hover:text-destructive transition-colors"
          title="Törlés"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Project row ────────────────────────────────────────────
function ProjectRow({
  project,
  chats,
  activeChat,
  projects,
  isDefaultOpen,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onPinChat,
  onMoveChat,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: {
  project: Project;
  chats: Chat[];
  activeChat: string | null;
  projects: Project[];
  isDefaultOpen: boolean;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  onPinChat: (id: string, pinned: boolean) => void;
  onMoveChat: (id: string, projectId: string | null) => void;
  onCreateProject: (name: string) => Promise<Project>;
  onRenameProject: (name: string) => void;
  onDeleteProject: () => void;
}) {
  const [open, setOpen] = useState(isDefaultOpen);
  const [editingName, setEditingName] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const MAX_VISIBLE = 5;
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? chats : chats.slice(0, MAX_VISIBLE);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="group/proj flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-muted/40 transition-colors">
        <CollapsibleTrigger
          render={
            <button className="flex flex-1 items-center gap-2 min-w-0" />
          }
        >
          <span className="text-base leading-none">{project.emoji}</span>
          {editingName ? (
            <InlineEdit
              value={project.name}
              onSave={(v) => { onRenameProject(v); setEditingName(false); }}
              onCancel={() => setEditingName(false)}
              className="text-sm font-medium text-foreground"
            />
          ) : (
            <span className="flex-1 truncate text-sm font-medium text-foreground/80 text-left">
              {project.name}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/60 tabular-nums">{chats.length}</span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={14}
            className={cn("text-muted-foreground/50 shrink-0 transition-transform", open ? "" : "-rotate-90")}
          />
        </CollapsibleTrigger>

        {/* Project actions */}
        <div className={cn(
          "items-center gap-0.5 shrink-0",
          menuOpen ? "flex" : "hidden group-hover/proj:flex"
        )}>
          <button
            onClick={(e) => { e.stopPropagation(); onNewChat(); }}
            className="rounded p-1 text-muted-foreground/50 hover:text-emerald-500 transition-colors"
            title="Új chat ebben a projektben"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={13} strokeWidth={2.5} />
          </button>
          {!editingName && (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger
                render={
                  <button className="rounded p-1 text-muted-foreground/50 hover:text-foreground transition-colors" />
                }
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} size={14} strokeWidth={2} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4} className="w-40 rounded-xl">
                <DropdownMenuItem onClick={() => setEditingName(true)}>
                  <HugeiconsIcon icon={PencilEdit01Icon} size={14} strokeWidth={2} className="mr-2" />
                  Átnevezés
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {confirmDelete ? (
                  <>
                    <DropdownMenuItem
                      onClick={onDeleteProject}
                      className="text-destructive focus:text-destructive font-medium"
                    >
                      Igen, törlés
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setConfirmDelete(false)}>
                      Mégse
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onClick={() => setConfirmDelete(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <HugeiconsIcon icon={Delete01Icon} size={14} strokeWidth={2} className="mr-2" />
                    Törlés
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <CollapsibleContent>
        <div className="ml-4 pl-2 border-l border-border/30 flex flex-col gap-0.5 mt-0.5 mb-1">
          {chats.length === 0 && (
            <p className="py-2 px-2 text-xs text-muted-foreground/50">Még nincs chat itt.</p>
          )}
          {visible.map((chat) => (
            <ChatRow
              key={chat.id}
              chat={chat}
              isActive={activeChat === chat.id}
              projects={projects}
              onSelect={() => onSelectChat(chat.id)}
              onDelete={() => onDeleteChat(chat.id)}
              onRename={(t) => onRenameChat(chat.id, t)}
              onPin={(p) => onPinChat(chat.id, p)}
              onMove={(pId) => onMoveChat(chat.id, pId)}
              onCreateProject={onCreateProject}
            />
          ))}
          {chats.length > MAX_VISIBLE && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="py-1 px-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors text-left"
            >
              … még {chats.length - MAX_VISIBLE} chat
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Main Sidebar ───────────────────────────────────────────
export function ChatSidebar({
  chats,
  projects,
  activeChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onPinChat,
  onMoveChat,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  isOpen,
  onToggle,
  isMobile = false,
}: ChatSidebarProps) {
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const [quota, setQuota] = useState<{ percentUsed: number; tier: string; exhausted: boolean; isLifetime: boolean; windowResetsAt: string | null } | null>(null);
  const [search, setSearch] = useState("");

  // Inline project creation state
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const searchParams = useSearchParams();
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/usage").then(r => r.ok ? r.json() : null).then(d => { if (d) setQuota(d); });

    if (searchParams?.get("settings") === "1" || searchParams?.get("upgraded") === "1") {
      setProfileOpen(true);
    }


  }, [searchParams]);

  const handleCreateInlineProject = async () => {
    if (!newProjectName.trim()) return;
    await onCreateProject(newProjectName.trim(), "📁");
    setNewProjectName("");
    setCreatingProject(false);
  };

  // Derived data
  const pinnedChats = chats.filter((c) => c.pinned);
  const unorganizedChats = chats.filter((c) => !c.projectId);

  const filteredChats = search
    ? chats.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-transparent transition-all duration-200",
        isMobile
          ? cn(
            "fixed inset-y-0 left-0 z-40 w-[280px] bg-background shadow-xl",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )
          : cn(isOpen ? "w-[260px] lg:w-[280px]" : "w-0 overflow-hidden")
      )}
    >
      <div className="flex h-full flex-col px-4 pt-2 pb-4 w-full">
        {/* Header */}
        <div className="flex items-center justify-between py-2 mb-4">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={BrainIcon} size={32} strokeWidth={1.8} />
            <span className="text-2xl font-medium tracking-tighter -translate-y-px">Reig Chat</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
            onClick={onToggle}
          >
            <HugeiconsIcon icon={SidebarLeftIcon} size={20} strokeWidth={1.5} />
          </Button>
        </div>

        {/* Search & New Chat */}
        <div className="flex flex-col gap-0 mb-8">
          <div className="relative flex items-center mb-1">
            <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.8} className="absolute left-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Keresés..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 border-none rounded-lg h-9 pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground text-foreground"
            />
          </div>
          <button
            onClick={() => onNewChat()}
            className="flex cursor-pointer items-center gap-3 px-2 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors group"
          >
            <HugeiconsIcon className="text-muted-foreground group-hover:text-foreground" icon={PlusSignIcon} size={18} strokeWidth={2.4} />
            <span>Új Chat</span>
          </button>
        </div>



        <ScrollArea className="flex-1 -mx-2 px-2 overflow-y-auto">
          {/* ── Search results ─────────────────────────── */}
          {filteredChats ? (
            <div className="flex flex-col gap-1">
              <div className="px-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Keresési eredmények
              </div>
              {filteredChats.length === 0 ? (
                <p className="px-2 py-4 text-xs text-muted-foreground/50 text-center">
                  Nincs találat
                </p>
              ) : (
                filteredChats.map((chat) => (
                  <ChatRow
                    key={chat.id}
                    chat={chat}
                    isActive={activeChat === chat.id}
                    projects={projects}
                    onSelect={() => { onSelectChat(chat.id); setSearch(""); }}
                    onDelete={() => onDeleteChat(chat.id)}
                    onRename={(t) => onRenameChat(chat.id, t)}
                    onPin={(p) => onPinChat(chat.id, p)}
                    onMove={(pId) => onMoveChat(chat.id, pId)}
                    onCreateProject={(name) => onCreateProject(name, "📁")}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* ── Pinned ────────────────────────────── */}
              {pinnedChats.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 text-[12px] font-medium text-muted-foreground/60 mb-1">
                    Kitűzött
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {pinnedChats.map((chat) => (
                      <ChatRow
                        key={chat.id}
                        chat={chat}
                        isActive={activeChat === chat.id}
                        projects={projects}
                        onSelect={() => onSelectChat(chat.id)}
                        onDelete={() => onDeleteChat(chat.id)}
                        onRename={(t) => onRenameChat(chat.id, t)}
                        onPin={(p) => onPinChat(chat.id, p)}
                        onMove={(pId) => onMoveChat(chat.id, pId)}
                        onCreateProject={(name) => onCreateProject(name, "📁")}
                      />
                    ))}
                  </div>
                </div>
              )}





              {/* ── Recents (unorganized) ──────────────── */}
              {unorganizedChats.length > 0 && (
                <div>
                  <div className="px-2 text-[12px] font-medium  text-muted-foreground/60 mb-1">
                    Legutóbbi
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {unorganizedChats.map((chat) => (
                      <ChatRow
                        key={chat.id}
                        chat={chat}
                        isActive={activeChat === chat.id}
                        projects={projects}
                        onSelect={() => onSelectChat(chat.id)}
                        onDelete={() => onDeleteChat(chat.id)}
                        onRename={(t) => onRenameChat(chat.id, t)}
                        onPin={(p) => onPinChat(chat.id, p)}
                        onMove={(pId) => onMoveChat(chat.id, pId)}
                        onCreateProject={(name) => onCreateProject(name, "📁")}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {chats.length === 0 && (
                <div className="px-4 py-8 text-xs text-muted-foreground text-center opacity-50">
                  Nincs aktív beszélgetés,<br />kezdj egyet az "Új chat" gombbal!
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="pt-4 mt-auto flex flex-col gap-4">

          {mounted && quota && quota.tier == "FREE" && (
            <Link className="w-full" href="?settings=1&packages=1">
              <Button className={"h-12 w-full text-base tracking-tight  shadow-[inset_0_2.5px_2px_#FFFFFF55] dark:shadow-[inset_0_-2.5px_2px_#00000055] relative overflow-hidden"} size={"lg"}>Oldd fel az összes modellt
                <HugeiconsIcon className="scale-125 ml-1" size={128} icon={SparklesIcon} />
                <div className="absolute h-10 w-10 bg-blue-500 blur-lg scale-x-200 translate-y-12"></div>
              </Button>
            </Link>
          )}
          {mounted && quota && (
            <button
              onClick={() => setProfileOpen(true)}
              className="group text-left p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-zinc-200/50 dark:border-white/5 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Kvóta
                </span>
                <span className={cn("text-[11px] font-medium", quota.exhausted ? "text-red-500" : "text-zinc-700 dark:text-zinc-300")}>
                  {quota.percentUsed}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800/80 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500 ease-out", quota.exhausted ? "bg-red-500" : "bg-primary")}
                  style={{ width: `${Math.min(100, quota.percentUsed)}%` }}
                />
              </div>
              {mounted && session?.user && (
                <div className="flex items-center gap-3 group cursor-pointer mt-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-medium text-zinc-950">
                    {session.user.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
                  </div>
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-medium text-zinc-900 dark:text-white">{session.user.name}</span>
                    </div>
                  </div>
                  <HugeiconsIcon icon={SettingsIcon} size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              )}
            </button>
          )}
        </div>
      </div>
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </aside>
  );
}
