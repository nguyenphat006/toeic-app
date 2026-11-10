"use client";

import { Volume2 } from "lucide-react";
import type { MouseEvent } from "react";

import { cn } from "@/lib/cn";
import { play } from "@/lib/tts";

export function SpeakButton({
  text,
  rate,
  label,
  variant = "icon",
  className,
}: {
  text: string;
  rate: number;
  label: string;
  variant?: "icon" | "pill";
  className?: string;
}) {
  function onClick(e: MouseEvent) {
    // Speaker buttons sit on top of the flip card; tapping one must not flip it.
    e.stopPropagation();
    void play([{ text }], rate);
  }
  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3.5 py-2 text-sm font-semibold text-brand-strong transition-transform active:scale-95",
          className,
        )}
      >
        <Volume2 className="size-[18px]" aria-hidden /> {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink", className)}
    >
      <Volume2 className="size-[22px]" aria-hidden />
    </button>
  );
}
