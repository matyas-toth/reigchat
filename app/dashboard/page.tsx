"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatSidebar, Chat } from "@/components/chat/ChatSidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { useSession } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { Project } from "@/components/chat/MoveToProjectPicker";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isPending && !session) redirect("/login");
  }, [session, isPending]);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_open");
    setSidebarOpen(saved !== null ? saved === "true" : !isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    localStorage.setItem("sidebar_open", String(next));
  };

  // Auto-select latest chat
  useEffect(() => {
    if (!activeChat && chats.length > 0) setActiveChat(chats[0].id);
  }, [activeChat, chats]);

  // ── Fetchers ─────────────────────────────────────────────
  const fetchChats = useCallback(async () => {
    const res = await fetch("/api/chats");
    const data = await res.json();
    setChats(data);
  }, []);

  const fetchProjects = useCallback(async () => {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
  }, []);

  useEffect(() => {
    if (session) {
      fetchChats();
      fetchProjects();
    }
  }, [fetchChats, fetchProjects, session]);

  // ── Chat handlers ─────────────────────────────────────────
  const createChat = async (projectId?: string) => {
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectId ? { projectId } : {}),
    });
    const chat = await res.json();
    setChats((prev) => [chat, ...prev]);
    setActiveChat(chat.id);
    if (isMobile) setSidebarOpen(false);
  };

  const deleteChat = async (id: string) => {
    await fetch(`/api/chats/${id}`, { method: "DELETE" });
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChat === id) {
      setActiveChat(chats.find((c) => c.id !== id)?.id ?? null);
    }
  };

  const renameChat = async (id: string, title: string) => {
    // Optimistic
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    await fetch(`/api/chats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  };

  const pinChat = async (id: string, pinned: boolean) => {
    // Optimistic
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, pinned } : c)));
    if (pinned) {
      await fetch(`/api/chats/${id}/pin`, { method: "POST" });
    } else {
      await fetch(`/api/chats/${id}/pin`, { method: "DELETE" });
    }
  };

  const moveChat = async (id: string, projectId: string | null) => {
    // Optimistic
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, projectId } : c)));
    await fetch(`/api/chats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
  };

  // ── Project handlers ──────────────────────────────────────
  const createProject = async (name: string, emoji: string): Promise<Project> => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji }),
    });
    const project = await res.json();
    setProjects((prev) => [...prev, project]);
    return project;
  };

  const renameProject = async (id: string, name: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  };

  const deleteProject = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    // Detach chats optimistically
    setChats((prev) => prev.map((c) => (c.projectId === id ? { ...c, projectId: null } : c)));
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
  };

  const handleSelectChat = (id: string) => {
    setActiveChat(id);
    if (isMobile) setSidebarOpen(false);
  };

  const activeProjectId = chats.find((c) => c.id === activeChat)?.projectId ?? null;
  const activeProjectName = projects.find((p) => p.id === activeProjectId)?.name;

  if (isPending || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950 text-foreground transition-colors">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Floating toggle when sidebar closed */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-3 cursor-pointer left-4 z-40 flex h-8 w-8 items-center justify-center rounded-md border border-border/50 bg-background/80 shadow-md backdrop-blur-md text-foreground transition-colors hover:bg-accent/80 active:scale-95 focus:outline-none"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 4h12M2 8h12M2 12h12" />
          </svg>
        </button>
      )}

      <ChatSidebar
        chats={chats}
        projects={projects}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
        onNewChat={createChat}
        onDeleteChat={deleteChat}
        onRenameChat={renameChat}
        onPinChat={pinChat}
        onMoveChat={moveChat}
        onCreateProject={createProject}
        onRenameProject={renameProject}
        onDeleteProject={deleteProject}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        isMobile={isMobile}
      />

      <main className="relative flex flex-1 flex-col overflow-hidden bg-background rounded-tl-[20px] border-l border-t border-border/40 transition-colors">
        <ChatArea
          key={activeChat ?? "empty"}
          chatId={activeChat}
          chatTitle={chats.find((c) => c.id === activeChat)?.title || "Új beszélgetés"}
          chatProjectName={activeProjectName}
          chatProjectId={activeProjectId}
          projects={projects}
          onNewChat={createChat}
          onChatUpdated={fetchChats}
          onRenameChat={(title) => activeChat && renameChat(activeChat, title)}
          onPinChat={(pinned) => activeChat && pinChat(activeChat, pinned)}
          onMoveChat={(projectId) => activeChat && moveChat(activeChat, projectId)}
          onDeleteChat={() => activeChat && deleteChat(activeChat)}
          onCreateProject={createProject}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
      </main>
    </div>
  );
}
