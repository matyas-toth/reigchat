"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState, useMemo } from "react";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ChatSpinner from "./ChatSpinner";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChatSpark01Icon } from "@hugeicons/core-free-icons";
import { MemoizedMarkdown } from "../memoized-markdown";
import { useSession } from "@/lib/auth-client";

interface ChatAreaProps {
  chatId: string | null;
  onNewChat: () => void;
  onChatUpdated: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

interface DbMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

/* ── Helper: extract tool parts from a message ───────── */
interface ToolPart {
  toolCallId: string;
  toolName: string;
  state: string;
  output?: string;
  label: string;
}

function extractToolParts(message: UIMessage): ToolPart[] {
  const parts: ToolPart[] = [];
  if (!message.parts) return parts; // safety check

  for (const part of message.parts) {
    // Tool parts have type "tool-{name}" pattern
    if (typeof part === "object" && part.type && part.type.startsWith("tool-")) {
      const toolName = part.type.substring(5);
      const toolPart = part as any; // Cast to access state, output, input, toolCallId

      // Build a human-readable label from input
      let label = toolName;
      if (toolPart.state === "output-available" && typeof toolPart.output === "string") {
        label = toolPart.output;
      } else if (toolPart.input) {
        const input = toolPart.input;
        switch (toolName) {
          case "createProject":
            label = `Creating project ${input.emoji || ""} ${input.projectName || ""}`.trim();
            break;
          case "addItem":
            label = `Adding ${input.type?.toString().toLowerCase() || "item"} "${input.title}" to ${input.projectName}`;
            break;
          case "updateItemStatus":
            label = `Updating status → ${input.newStatus}`;
            break;
          case "updateItemContent":
            label = `Updating "${input.newTitle || "item"}"`;
            break;
          case "archiveProject":
            label = `Archiving project`;
            break;
          case "saveMemory":
            label = `Saving to memory...`;
            break;
          case "searchMemories":
            label = `Searching vault for "${input.query}"...`;
            break;
        }
      }

      parts.push({
        toolCallId: toolPart.toolCallId,
        toolName: toolName,
        state: toolPart.state,
        output: typeof toolPart.output === "string" ? toolPart.output : undefined,
        label,
      });
    }
  }
  return parts;
}

/* ── Chat Loader ─────────────────────────────────────── */

export function ChatArea({
  chatId,
  onNewChat,
  onChatUpdated,
  sidebarOpen,
  onToggleSidebar,
}: ChatAreaProps) {
  const [loaded, setLoaded] = useState(!chatId);
  const [historyMessages, setHistoryMessages] = useState<UIMessage[]>([]);

  useEffect(() => {
    if (!chatId) {
      setHistoryMessages([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    fetch(`/api/chats/${chatId}`)
      .then((res) => res.json())
      .then((msgs: DbMessage[]) => {
        setHistoryMessages(
          msgs.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            parts: [{ type: "text" as const, text: m.content }],
          }))
        );
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [chatId]);

  if (!chatId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <ChatSpinner name="pulse"></ChatSpinner>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <ChatSpinner name="pulse"></ChatSpinner>
      </div>
    );
  }

  return (
    <ChatInner
      chatId={chatId}
      initialMessages={historyMessages}
      onChatUpdated={onChatUpdated}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={onToggleSidebar}
    />
  );
}

/* ── Tool Call Notification Stack ─────────────────────── */

function ToolCallStack({
  toolParts,
  isFinished,
}: {
  toolParts: ToolPart[];
  isFinished: boolean;
}) {
  // Only show last 2 tool calls
  const visible = toolParts.slice(-2);

  if (visible.length === 0) return null;

  return (
    <AnimatePresence mode="popLayout">
      {true &&
        visible.map((tool) => (
          <motion.div
            key={tool.toolCallId}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex items-center gap-2.5 py-1 mb-1"
          >
            {tool.state === "output-available" ? (
              <>

                <span className="text-xs text-muted-foreground">
                  {tool.output || tool.label}
                </span>
              </>
            ) : (
              <ChatSpinner name="waverows">
                <span className="ml-2 text-xs text-muted-foreground">
                  {tool.label}
                </span>
              </ChatSpinner>
            )}
          </motion.div>
        ))}
    </AnimatePresence>
  );
}

/* ── Main Chat Component ─────────────────────────────── */

function ChatInner({
  chatId,
  initialMessages,
  onChatUpdated,
  sidebarOpen,
  onToggleSidebar,
}: {
  chatId: string;
  initialMessages: UIMessage[];
  onChatUpdated: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  const { data: session } = useSession();
  const userName = session?.user?.name?.split(" ")[0] || "Vendég";
  const hour = new Date().getHours();
  const greeting = hour < 9 ? "Jó reggelt" : hour < 18 ? "Jó napot" : "Jó estét";

  const [input, setInput] = useState("");
  const [selectedModelId, setSelectedModelId] = useState<string>("openrouter/auto");
  const selectedModelIdRef = useRef(selectedModelId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [quotaError, setQuotaError] = useState<{ reason: string; resetsAt: string | null } | null>(null);

  // Keep ref in sync so the stable transport closure always reads the latest model
  useEffect(() => {
    selectedModelIdRef.current = selectedModelId;
  }, [selectedModelId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        // body is evaluated at send-time; use a getter so we always get the current model
        body: { chatId, get modelId() { return selectedModelIdRef.current; } },
      }),
    [chatId] // only recreate on chat switch, NOT on model change
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    messages: initialMessages,
    onFinish: () => {
      onChatUpdated();
    },
    onError: async (err) => {
      // The AI SDK surfaces the raw response body via err.message or the response
      // Try parsing the error as our quota JSON payload
      try {
        const body = JSON.parse((err as any).responseBody ?? err.message ?? "{}");
        if (body.error === "quota_exceeded") {
          setQuotaError({ reason: body.reason, resetsAt: body.resetsAt });
          return;
        }
      } catch {
        // not a quota error - ignore
      }
    },
  });

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  const isStreaming = status === "streaming";
  const isThinking = status === "submitted" || status === "streaming";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const THINKING_OPTIONS = [
    "Gondolkodás folyamatban...",
    "Kávét főzök...",
    "Épp álmodom egyet...",
    "Ne zavarj, dolgozom...",
    "Összerakom a fejemben...",
    "Szikrázik az agyam...",
    "Mindjárt, mindjárt...",
    "Elgondolkoztam...",
    "Megkeresem a választ...",
    "Filozofálok egy kicsit...",
    "Bekukkantok a tudásomba...",
    "Okoskodom...",
    "Szürkeállomány aktiválva...",
    "Ráérek, ne rohanj...",
    "Hamarosan visszatérek..."
  ];

  const [thinkingText, setThinkingText] = useState("Thinking");

  useEffect(() => {
    if (status === "submitted") {
      setThinkingText(THINKING_OPTIONS[Math.floor(Math.random() * THINKING_OPTIONS.length)]);
    }
  }, [status]);

  // Extract tool parts from the last assistant message (active during streaming)
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const activeToolParts = lastAssistantMsg ? extractToolParts(lastAssistantMsg) : [];
  const hasText = lastAssistantMsg?.parts.some(
    (p) => p.type === "text" && (p as { text: string }).text.length > 0
  );

  return (
    <div className="flex w-full h-full overflow-hidden">
      <div className="flex h-full flex-1 flex-col min-w-[300px]">
        {/* Header */}


        {/* Dynamic Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Messages Wrapper */}
          {(messages.length > 0 || isThinking) && (
            <div ref={scrollRef} className="flex-1 overflow-y-auto w-full">
              <div className="mx-auto max-w-2xl px-3 md:px-0 py-4 md:py-6">
                <AnimatePresence initial={false}>
                  {messages.map((message) => {
                    const toolParts = extractToolParts(message);
                    const textParts = message.parts.filter((p) => p.type === "text");
                    const isLastAssistant = message === lastAssistantMsg;

                    return (
                      <div key={message.id}>
                        {/* User bubble OR assistant text bubble */}
                        {message.role === "user" ? (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mb-4 flex justify-end gap-3"
                          >
                            <div
                              className="max-w-[85%] rounded-3xl prose prose-invert dark:prose-zinc px-4 py-2.5 text-base md:text-sm leading-relaxed whitespace-pre-wrap bg-primary text-primary-foreground"
                              style={{ cornerShape: "superellipse(1.3)" } as any}
                            >
                              {textParts.map((part, i) =>
                                part.type === "text" ? <MemoizedMarkdown id={message.id} key={`${message.id}-text`} content={part.text}></MemoizedMarkdown> : null
                              )}
                            </div>
                          </motion.div>
                        ) : (
                          <>
                            {/* Tool call notifications — above the text bubble */}
                            {toolParts.length > 0 && (
                              <div className="mb-2 ml-1">
                                {isLastAssistant && isThinking ? (
                                  <ToolCallStack
                                    toolParts={toolParts}
                                    isFinished={false}
                                  />
                                ) : (
                                  /* For finished messages in history, show completed tools briefly or not */
                                  <ToolCallStack
                                    toolParts={toolParts}
                                    isFinished={true}
                                  />
                                )}
                              </div>
                            )}

                            {/* Assistant text */}
                            {textParts.some(
                              (p) => p.type === "text" && (p as { text: string }).text.length > 0
                            ) && (
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="mb-4 flex justify-start gap-3"
                                >
                                  <div
                                    className="max-w-[85%] prose prose-zinc dark:prose-invert rounded-3xl px-4 py-2.5 text-base md:text-sm leading-relaxed whitespace-pre-wrap bg-muted/50 text-foreground"
                                    style={{ cornerShape: "superellipse(1.3)" } as any}
                                  >
                                    {textParts.map((part, i) =>
                                      part.type === "text" ? <MemoizedMarkdown id={message.id} key={`${message.id}-text`} content={part.text}></MemoizedMarkdown> : null
                                    )}
                                  </div>
                                </motion.div>
                              )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </AnimatePresence>

                {/* Thinking indicator — only when no tool calls and no text yet */}
                <AnimatePresence>
                  {isThinking && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="mb-4 flex items-center gap-3"
                    >
                      <ChatSpinner name="pulse">{thinkingText}</ChatSpinner>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Input & Greeting Wrapper */}
          <motion.div
            layout
            initial={false}
            className={cn(
              "w-full flex flex-col shrink-0 relative z-10",
              messages.length === 0 && !isThinking ? "h-[85%] justify-center" : "justify-end"
            )}
          >
            <AnimatePresence mode="popLayout">
              {messages.length === 0 && !isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.1 } }}
                  exit={{ opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.15 } }}
                  className="mb-6 text-center px-4"
                >
                  <h2 className="text-5xl font-medium tracking-tighter dark:tracking-tight mb-2">{greeting}, {userName}!</h2>
                  <p className="text-muted-foreground mt-4">{quotaError ? "Elérted a limited." : "Mi jár a fejedben ma?"}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quota wall banner or normal input */}
            {quotaError ? (
              <div className="border-t border-border/50 bg-background px-4 py-6">
                <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-xl border border-border bg-card p-6 text-center text-card-foreground shadow-sm">
                  <p className="text-base font-semibold mb-2 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    Your thinking space is full.
                  </p>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
                    {quotaError.reason === "lifetime_exhausted"
                      ? "You've used your free allowance — and honestly, you made good use of it. Every project you haven't mapped yet, that's what Pro is for."
                      : `Your 8-hour window is exhausted. Resets ${quotaError.resetsAt ? `in ${Math.max(0, Math.round((new Date(quotaError.resetsAt).getTime() - Date.now()) / 60000))} minutes` : "soon"}.`}
                  </p>
                  <Button
                    variant="default"
                    className="w-full max-w-sm"
                    onClick={() => window.location.href = '/profile'}
                  >
                    Unlock Unlimited Thinking — $12/mo
                  </Button>
                  <p className="mt-3 text-[11px] text-muted-foreground/60">No commitment. Cancel anytime. Your data stays.</p>
                </div>
              </div>
            ) : (
              <ChatInput
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                isStreaming={isThinking}
                selectedModelId={selectedModelId}
                onModelChange={setSelectedModelId}
              />
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
