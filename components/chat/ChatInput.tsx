"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUp02Icon, BrainIcon, ChevronDown, Paperclip } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { MemoriesDialog } from "@/components/memories/MemoriesDialog";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isStreaming: boolean;
}

const MODELS = [
  { id: "claude-opus-4-6", label: "Claude Opus 4.6", provider: "Anthropic" },
  { id: "claude-opus-4-7", label: "Claude Opus 4.7", provider: "Anthropic" },
  { id: "deepseek-chat", label: "Deepseek Chat", provider: "Deepseek" },
  { id: "gpt-5-4", label: "GPT 5.4", provider: "OpenAI" },
];

export function ChatInput({
  input,
  setInput,
  onSubmit,
  isStreaming,
}: ChatInputProps) {
  const [memoriesOpen, setMemoriesOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);

  // Autofocus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Global key capture — focus textarea when user starts typing anywhere
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;
      textareaRef.current?.focus();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        formRef.current?.requestSubmit();
      }
    }
  };

  const canSubmit = input.trim() && !isStreaming;

  return (
    <>
      <div className="w-full px-4 md:px-0 py-3 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-full max-w-2xl">
          {/* Main input card */}
          <div className="relative rounded-2xl border-2 border-border/60 dark:border-border/30 bg-background shadow-none focus-within:border-border/80 dark:focus-within:border-border/60  transition-all duration-200">
            <form ref={formRef} onSubmit={onSubmit}>
              {/* Textarea */}
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setInput(e.target.value)
                }
                onKeyDown={onKeyDown}
                placeholder="Kérdezz bármit..."
                disabled={isStreaming}
                rows={1}
                className={cn(
                  "w-full resize-none border-0 bg-transparent dark:bg-transparent disabled:bg-transparent disabled:dark:bg-transparent px-4 pt-4 pb-2",
                  "text-sm leading-relaxed placeholder:text-muted-foreground/50",
                  "focus-visible:ring-0 focus-visible:outline-none",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  "min-h-[52px] max-h-[200px] overflow-y-auto"
                )}
              />

              {/* Bottom toolbar */}
              <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
                {/* Left side: model selector + memories */}
                <div className="flex items-center gap-1.5">
                  {/* Model selector */}
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      >
                        <span className="max-w-[120px] truncate">{selectedModel.label}</span>
                        <HugeiconsIcon
                          icon={ChevronDown}
                          size={12}
                          strokeWidth={2}
                          className="shrink-0 opacity-60"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      side="top"
                      className="w-52 rounded-xl p-1.5"
                      sideOffset={6}
                    >
                      {MODELS.map((model) => (
                        <DropdownMenuItem
                          key={model.id}
                          onSelect={() => setSelectedModel(model)}
                          className={cn(
                            "flex cursor-pointer flex-col items-start gap-0 rounded-lg px-3 py-2 text-sm",
                            selectedModel.id === model.id && "bg-muted"
                          )}
                        >
                          <span className="font-medium">{model.label}</span>
                          <span className="text-xs text-muted-foreground">{model.provider}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Memories button */}
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemoriesOpen(true)}
                        className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      >
                        <HugeiconsIcon icon={BrainIcon} size={14} strokeWidth={2} />
                        <span>Memória</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Tekintsd meg és kezeld az emlékeket
                    </TooltipContent>
                  </Tooltip>

                  {/* Attach button */}
                  <Tooltip>
                    <TooltipTrigger >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      >
                        <HugeiconsIcon icon={Paperclip} size={15} strokeWidth={2} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      File csatolása
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Right side: submit button */}
                <Button
                  type="submit"
                  size="icon"
                  disabled={!canSubmit}
                  className={cn(
                    "h-8 w-8 shrink-0 rounded-lg transition-all duration-150",
                    canSubmit
                      ? "bg-foreground text-background hover:bg-foreground/85"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <HugeiconsIcon icon={ArrowUp02Icon} size={15} strokeWidth={2.5} />
                </Button>
              </div>
            </form>
          </div>

          {/* Hint */}
          <p className="my-2 text-center text-[11px] text-muted-foreground/40 select-none tracking-wide">
            <kbd className="font-mono">Enter</kbd> a küldéshez, <kbd className="font-mono">Shift+Enter</kbd> az új sorhoz
          </p>
        </div>
      </div>

      <MemoriesDialog open={memoriesOpen} onOpenChange={setMemoriesOpen} />
    </>
  );
}