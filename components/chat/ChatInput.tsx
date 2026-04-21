"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Airplane01Icon, ArrowUp02Icon, BrainIcon, ChevronDown, Paperclip, RepeatIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MemoriesDialog } from "@/components/memories/MemoriesDialog";
import { cn } from "@/lib/utils";

interface ModelOption {
  id: string;
  label: string;
  provider: string;
  requiredTier: "FREE" | "PRO" | "ULTRA";
  accessible: boolean;
  multiplier: number; // display multiplier; 0 = free/ingyenes
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
  requiredTier: "FREE",
  accessible: true,
  multiplier: 1,
};

// Provider accent colors & display names
const PROVIDER_META: Record<string, { color: string; dot: string; name: string }> = {
  anthropic: { color: "text-amber-500/80", dot: "bg-amber-500/70", name: "Anthropic" },
  openai: { color: "text-emerald-500/80", dot: "bg-emerald-500/70", name: "OpenAI" },
  google: { color: "text-blue-400/80", dot: "bg-blue-400/70", name: "Google" },
  mistralai: { color: "text-orange-600/80", dot: "bg-orange-600/70", name: "Mistral AI" },
  deepseek: { color: "text-cyan-400/80", dot: "bg-cyan-400/70", name: "DeepSeek" },
  qwen: { color: "text-violet-400/80", dot: "bg-violet-400/70", name: "Qwen" },
  "reig chat": { color: "text-foreground/60", dot: "bg-foreground/40", name: "Reig Chat" },
  codestral: { color: "text-orange-400/80", dot: "bg-orange-400/70", name: "Codestral" },
  devstral: { color: "text-orange-400/80", dot: "bg-orange-400/70", name: "Mistral AI" },

};

function getProviderMeta(provider: string) {
  const key = provider.toLowerCase();
  return PROVIDER_META[key] ?? { color: "text-muted-foreground/60", dot: "bg-muted-foreground/40", name: provider };
}

function ModelCard({
  model,
  isSelected,
  onSelect,
}: {
  model: ModelOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const meta = getProviderMeta(model.provider);
  const tierLabel = model.requiredTier !== "FREE" ? model.requiredTier : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group cursor-pointer relative w-full text-left rounded-xl px-3.5 py-3 transition-all duration-150 overflow-hidden",
        "border-2",
        isSelected
          ? "bg-foreground text-background border-foreground/80"
          : model.accessible
            ? "border-border/40 hover:border-border/80 hover:bg-accent/40 bg-transparent"
            : "border-border/20 bg-transparent opacity-60 hover:opacity-80"
      )}
    >
      {/* Tier badge */}
      {tierLabel && (
        <span className={cn(
          "absolute top-2.5 right-2.5 text-[9px] font-bold tracking-wider px-1.5 py-px rounded-md",
          isSelected
            ? "bg-background/20 text-background/80"
            : tierLabel === "ULTRA"
              ? "bg-purple-500/15 text-purple-400"
              : "bg-gray-500/15 text-gray-400"
        )}>
          {tierLabel}
        </span>
      )}

      {/* Lock overlay for inaccessible */}
      {!model.accessible && (
        <span className="absolute bottom-2.5 right-2.5">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-muted-foreground/40">
            <rect x="3" y="7" width="10" height="7" rx="1.5" />
            <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
          </svg>
        </span>
      )}

      {/* Provider row */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", isSelected ? "bg-background/50" : meta.dot)} />
        <span className={cn(
          "text-[10px] font-medium tracking-widest uppercase",
          isSelected ? "text-background/60" : meta.color
        )}>
          {meta.name}
        </span>
      </div>

      {/* Model name */}
      <p className={cn(
        "text-[16px] font-medium leading-snug pr-6",
        isSelected ? "text-background" : "text-foreground/90"
      )}>
        {model.label} {model.label.includes("Auto") ? <HugeiconsIcon size={16} className="inline ml-1 -translate-y-[2px]" strokeWidth={1} fill="currentColor" icon={Airplane01Icon} /> : ""}
      </p>

      {/* Multiplier + lock row */}
      <div className="flex items-center justify-between mt-2">
        <span className={cn(
          "text-[10px] font-mono font-semibold",
          isSelected
            ? "text-background/50"
            : model.multiplier === 0
              ? "text-emerald-500/70"
              : "text-muted-foreground/40"
        )}>
          {model.multiplier === 0 ? "ingyenes" : `${model.multiplier}×`}
        </span>

      </div>

    </button>
  );
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  isStreaming,
  selectedModelId,
  onModelChange,
}: ChatInputProps) {
  const router = useRouter();
  const [memoriesOpen, setMemoriesOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([ALWAYS_FIRST]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/models")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.models) return;
        setModels(data.models);
        const saved = localStorage.getItem("selected_model_id");
        const savedModel = data.models.find((m: ModelOption) => m.id === saved && m.accessible);
        if (savedModel) {
          onModelChange(savedModel.id);
        } else {
          const first = data.models.find((m: ModelOption) => m.accessible) ?? data.models[0];
          onModelChange(first?.id ?? "openrouter/auto");
          localStorage.removeItem("selected_model_id");
        }
        setModelsLoading(false);
      })
      .catch(() => { if (!cancelled) setModelsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleModelSelect = (model: ModelOption) => {
    if (!model.accessible) {
      router.push("?settings=1&packages=1");
      setPickerOpen(false);
      return;
    }
    onModelChange(model.id);
    localStorage.setItem("selected_model_id", model.id);
    setPickerOpen(false);
  };

  const selectedModel = models.find((m) => m.id === selectedModelId) ?? ALWAYS_FIRST;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);

  useEffect(() => { textareaRef.current?.focus(); }, []);

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
      if (input.trim() && !isStreaming) formRef.current?.requestSubmit();
    }
  };

  const canSubmit = input.trim() && !isStreaming;

  // Separate Automatikus from the rest
  const automatikus = models.find((m) => m.id === "openrouter/auto");
  const restModels = models.filter((m) => m.id !== "openrouter/auto");

  return (
    <>
      <div className="w-full px-4 md:px-0 py-3 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-full max-w-2xl">
          <div className="relative rounded-2xl border-2 border-border/60 dark:border-border/30 bg-background shadow-none focus-within:border-border/80 dark:focus-within:border-border/60 transition-all duration-200">
            <form ref={formRef} onSubmit={onSubmit}>
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

              <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
                <div className="flex items-center gap-1.5">

                  {/* Model Picker */}
                  <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                    <PopoverTrigger
                      type="button"
                      className="h-8 gap-1.5 inline-flex items-center rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      {modelsLoading ? (
                        <span className="opacity-50">Betöltés...</span>
                      ) : (
                        <>
                          {/* Provider dot */}
                          <div className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            getProviderMeta(selectedModel.provider).dot
                          )} />
                          <span className="max-w-[140px] truncate">{selectedModel.label}</span>
                        </>
                      )}
                      <HugeiconsIcon
                        icon={ChevronDown}
                        size={12}
                        strokeWidth={2}
                        className={cn("shrink-0 opacity-60 transition-transform duration-150", pickerOpen && "rotate-180")}
                      />
                    </PopoverTrigger>

                    <PopoverContent
                      align="start"
                      side="top"
                      sideOffset={8}
                      className="w-[480px] p-3 rounded-2xl shadow-xl"
                    >
                      <div className="max-h-[400px] overflow-y-auto space-y-2">
                        {/* Automatikus hero card */}
                        {automatikus && (
                          <div className="mb-1">
                            <ModelCard
                              model={automatikus}
                              isSelected={selectedModelId === automatikus.id}
                              onSelect={() => handleModelSelect(automatikus)}
                            />
                          </div>
                        )}

                        {/* Rest: 2-col grid */}
                        {restModels.length > 0 && (
                          <>
                            <div className="flex items-center gap-4 px-1 py-2">
                              <div className="h-px flex-1 bg-border/40" />
                              <span className="text-[12px] text-muted-foreground/40 font-medium uppercase tracking-widest">
                                Prémium Modellek
                              </span>
                              <div className="h-px flex-1 bg-border/40" />
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {restModels.map((model) => (
                                <ModelCard
                                  key={model.id}
                                  model={model}
                                  isSelected={selectedModelId === model.id}
                                  onSelect={() => handleModelSelect(model)}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Memories */}
                  <Tooltip>
                    <TooltipTrigger
                      type="button"
                      onClick={() => setMemoriesOpen(true)}
                      className="h-8 gap-1.5 inline-flex items-center rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <HugeiconsIcon icon={BrainIcon} size={14} strokeWidth={2} />
                      <span>Memória</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Tekintsd meg és kezeld az emlékeket
                    </TooltipContent>
                  </Tooltip>

                  {/* Attach */}
                  <Tooltip>
                    <TooltipTrigger
                      type="button"
                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <HugeiconsIcon icon={Paperclip} size={15} strokeWidth={2} />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      File csatolása
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Submit */}
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