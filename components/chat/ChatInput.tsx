"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useEffect, type ChangeEvent, type FormEvent } from "react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isStreaming: boolean;
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  isStreaming,
}: ChatInputProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autofocus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Global key capture — focus textarea when user starts typing anywhere
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if already focused on an input, or modifier keys, or special keys
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return; // ignore Escape, Tab, arrows, etc.

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

  return (
    <div className="px-0 py-3 mb-4">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="mx-auto flex max-w-2xl items-end gap-2"
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setInput(e.target.value)
          }
          onKeyDown={onKeyDown}
          placeholder="Tell me what you're working on..."
          disabled={isStreaming}
          rows={1}
          className="min-h-[44px] max-h-[160px] resize-none rounded-xl border-border/50 bg-muted/30 px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/30"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isStreaming}
          className="h-[44px] w-[44px] shrink-0 rounded-xl"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </Button>
      </form>

    </div>
  );
}
