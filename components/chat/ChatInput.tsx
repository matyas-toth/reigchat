"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUp02Icon, BrainIcon, ChevronDown, Paperclip } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { MemoriesDialog } from "@/components/memories/MemoriesDialog";
import { cn } from "@/lib/utils";

interface ModelOption {
  id: string;
  label: string;
  provider: string;
  isFree: boolean;
}

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isStreaming: boolean;
  selectedModelId: string;
  onModelChange: (id: string) => void;
}

const ALWAYS_FIRST: ModelOption = {
  id: "openrouter/auto",
  label: "Automatikus",
  provider: "Reig Chat",
  isFree: false,
};

export function ChatInput({
  input,
  setInput,
  onSubmit,
  isStreaming,
  selectedModelId,
  onModelChange,
}: ChatInputProps) {
  const [memoriesOpen, setMemoriesOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([ALWAYS_FIRST]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch allowed models on mount
  useEffect(() => {
    let cancelled = false;
    fetch("/api/models")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.models) return;
        setModels(data.models);
        // Restore from localStorage if still valid
        const saved = localStorage.getItem("selected_model_id");
        if (saved && data.models.find((m: ModelOption) => m.id === saved)) {
          onModelChange(saved);
        } else {
          onModelChange(data.models[0]?.id ?? "openrouter/auto");
          localStorage.removeItem("selected_model_id");
        }
        setModelsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setModelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleModelSelect = (id: string) => {
    onModelChange(id);
    localStorage.setItem("selected_model_id", id);
    setPickerOpen(false);
  };

  const selectedModel = models.find((m) => m.id === selectedModelId) ?? ALWAYS_FIRST;

  // Split into two categories
  // Automatikus (openrouter/auto) always goes in the top section regardless of isFree
  const premiumModels = models.filter((m) => !m.isFree || m.id === "openrouter/auto");
  const experimentalModels = models.filter((m) => m.isFree && m.id !== "openrouter/auto");

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
          <div className="relative rounded-2xl border-2 border-border/60 dark:border-border/30 bg-background shadow-none focus-within:border-border/80 dark:focus-within:border-border/60 transition-all duration-200">
            <form ref={formRef} onSubmit={onSubmit}>
              {/* Textarea */}
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
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
                {/* Left: model picker + memories + attach */}
                <div className="flex items-center gap-1.5">

                  {/* Model Picker (Popover) */}
                  <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      >
                        {modelsLoading ? (
                          <span className="opacity-50">Betöltés...</span>
                        ) : (
                          <span className="max-w-[140px] truncate">{selectedModel.label}</span>
                        )}
                        <HugeiconsIcon
                          icon={ChevronDown}
                          size={12}
                          strokeWidth={2}
                          className={cn("shrink-0 opacity-60 transition-transform duration-150", pickerOpen && "rotate-180")}
                        />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent
                      align="start"
                      side="top"
                      sideOffset={8}
                      className="w-[420px] p-0 rounded-2xl border border-border/60 shadow-xl overflow-hidden"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className="max-h-[300px] overflow-y-auto">
                      {/* Elérhető Modellek */}
                      <div className="px-4 pt-4 pb-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Elérhető Modellek
                        </p>
                        <div className="flex flex-col gap-0.5">
                          {premiumModels.map((model) => (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() => handleModelSelect(model.id)}
                              className={cn(
                                "w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm text-left transition-colors cursor-pointer",
                                selectedModelId === model.id
                                  ? "bg-foreground text-background"
                                  : "hover:bg-accent/60 text-foreground"
                              )}
                            >
                              <span className="font-medium truncate">{model.label}</span>
                              <span className={cn(
                                "text-[11px] shrink-0 capitalize",
                                selectedModelId === model.id ? "text-background/60" : "text-muted-foreground"
                              )}>
                                {model.provider}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Kísérleti Modellek */}
                      {experimentalModels.length > 0 && (
                        <div className="px-4 pb-4 pt-2 border-t border-border/40">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-2">
                            Kísérleti Modellek
                          </p>
                          <div className="grid grid-cols-2 gap-1">
                            {experimentalModels.map((model) => (
                              <button
                                key={model.id}
                                type="button"
                                onClick={() => handleModelSelect(model.id)}
                                className={cn(
                                  "flex flex-col items-start rounded-xl px-3 py-2 text-left transition-colors cursor-pointer",
                                  selectedModelId === model.id
                                    ? "bg-foreground text-background"
                                    : "hover:bg-accent/60 text-foreground"
                                )}
                              >
                                <span className="text-xs font-medium truncate w-full">{model.label}</span>
                                <span className={cn(
                                  "text-[10px] capitalize truncate w-full",
                                  selectedModelId === model.id ? "text-background/60" : "text-muted-foreground"
                                )}>
                                  {model.provider}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Memories button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
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
                    <TooltipTrigger asChild>
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

                {/* Right: submit */}
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
            <kbd className="font-mono">Enter</kbd> a küldéshez,{" "}
            <kbd className="font-mono">Shift+Enter</kbd> az új sorhoz
          </p>
        </div>
      </div>

      <MemoriesDialog open={memoriesOpen} onOpenChange={setMemoriesOpen} />
    </>
  );
}