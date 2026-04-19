"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { useSession } from "@/lib/auth-client";
import { redirect } from "next/navigation";

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

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
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      redirect("/login");
    }
  }, [session, isPending]);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_open");
    if (saved !== null) {
      setSidebarOpen(saved === "true");
    } else {
      setSidebarOpen(!isMobile);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem("sidebar_open", String(newState));
  };

  // Auto-open the latest chat with nothing selected
  useEffect(() => {
    if (!activeChat && chats.length > 0) {
      setActiveChat(chats[0].id);
    }
  }, [activeChat, chats]);

  const fetchChats = useCallback(async () => {
    const res = await fetch("/api/chats");
    const data = await res.json();
    setChats(data);
  }, []);

  useEffect(() => {
    if (session) {
      fetchChats();
    }
  }, [fetchChats, session]);

  const createChat = async () => {
    const res = await fetch("/api/chats", { method: "POST" });
    const chat = await res.json();
    setChats((prev) => [chat, ...prev]);
    setActiveChat(chat.id);
    if (isMobile) setSidebarOpen(false);
  };

  const deleteChat = async (id: string) => {
    await fetch(`/api/chats/${id}`, { method: "DELETE" });
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChat === id) {
      setActiveChat(chats.length > 1 ? chats.find((c) => c.id !== id)?.id ?? null : null);
    }
  };

  const onChatUpdated = () => {
    fetchChats();
  };

  const handleSelectChat = (id: string) => {
    setActiveChat(id);
    if (isMobile) setSidebarOpen(false);
  };

  if (isPending || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-background">
      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Floating sidebar button */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-2.5 cursor-pointer left-3 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-background/80 shadow-md backdrop-blur-md text-foreground transition-colors hover:bg-accent/80 active:scale-95 focus:outline-none"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 4h12M2 8h12M2 12h12" />
          </svg>
        </button>
      )}

      <ChatSidebar
        chats={chats}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
        onNewChat={createChat}
        onDeleteChat={deleteChat}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        isMobile={isMobile}
      />

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <ChatArea
          key={activeChat ?? "empty"}
          chatId={activeChat}
          onNewChat={createChat}
          onChatUpdated={onChatUpdated}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
      </main>
    </div>
  );
}
