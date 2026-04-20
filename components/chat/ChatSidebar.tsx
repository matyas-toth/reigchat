"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, PlusSignIcon, Folder01Icon, BookOpen01Icon, ArrowDown01Icon, SidebarLeftIcon, BrainIcon } from "@hugeicons/core-free-icons";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  chats: Chat[];
  activeChat: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;

  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export function ChatSidebar({
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,

  isOpen,
  onToggle,
  isMobile = false,
}: ChatSidebarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const [quota, setQuota] = useState<{ percentUsed: number; tier: string; exhausted: boolean; isLifetime: boolean; windowResetsAt: string | null } | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/usage").then(r => r.ok ? r.json() : null).then(d => { if (d) setQuota(d); });
  }, []);

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

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
        {/* Top Header Section */}
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

        {/* Search & Primary Action */}
        <div className="flex flex-col gap-3 mb-0 ">
          <div className="relative flex items-center">
            <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.8} className="absolute left-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Keresés..."
              className="w-full bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 border-none rounded-lg h-9 pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground text-foreground"
            />
          </div>
          <button
            onClick={onNewChat}
            className="flex items-center gap-3 px-2 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors group"
          >
            <HugeiconsIcon className="text-muted-foreground group-hover:text-foreground" icon={PlusSignIcon} size={18} strokeWidth={2.4} />
            <span>Új Chat</span>
          </button>
        </div>

        {/* Main Navigation & Pinned Items */}
        <div className="flex flex-col gap-1 mb-5">
          <button className="flex items-center gap-3 px-2 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors group">
            <HugeiconsIcon icon={Folder01Icon} strokeWidth={2.4} size={18} className="text-muted-foreground group-hover:text-foreground" />
            Projektek
          </button>

        </div>

        <div className="h-px bg-border/40 w-full mb-5" />

        <ScrollArea className="flex-1 -mx-2 px-2 overflow-y-auto">
          <div className="flex flex-col gap-6">

            {/* Pinned Section */}
            <div>
              <div className="px-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Kitűzött</div>
              <div className="flex flex-col gap-0.5">
                {["Research & Analysis", "Web Search", "Knowledge Base"].map((item) => (
                  <button key={item} className="flex items-center gap-3 px-2 py-2 text-[13px] text-foreground/75 hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors group text-left">
                    <HugeiconsIcon icon={Folder01Icon} size={16} strokeWidth={2.4} className="text-muted-foreground group-hover:text-foreground shrink-0" />
                    <span className="truncate">{item}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recents Section */}
            <div>
              <div className="px-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Legutóbbi</div>
              <div className="flex flex-col gap-0.5">
                {chats.length === 0 && (
                  <div className="px-10 py-4 text-xs text-muted-foreground text-center opacity-50">
                    Nincs aktív beszélgetés, kezdj egyet a "Új chat" gombbal!
                  </div>
                )}
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group flex items-center justify-between rounded-lg h-9 px-2 py-2 text-[13px] transition-colors cursor-pointer",
                      activeChat === chat.id
                        ? "bg-zinc-200 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-50"
                        : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
                    )}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <span className="truncate font-medium">
                      {chat.title}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      className="ml-2 hidden shrink-0 rounded p-1 text-muted-foreground/50 hover:text-destructive group-hover:block transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="pt-4 mt-auto flex flex-col gap-4">
          {mounted && quota && (
            <button
              onClick={() => router.push("/profile")}
              className="group text-left p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-zinc-200/50 dark:border-white/5 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">

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
                <div className="flex items-center gap-3 group cursor-pointer mt-4" onClick={() => router.push("/profile")}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-medium text-zinc-950">
                    {session.user.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "JB"}
                  </div>
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-medium text-zinc-900 dark:text-white">{session.user.name || "James Brown"}</span>

                    </div>
                  </div>
                  <HugeiconsIcon icon={ArrowDown01Icon} size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              )}
            </button>
          )}



        </div>
      </div>
    </aside>
  );
}
