"use client";

import { Play } from "lucide-react";

import { cn } from "@/lib/cn";

export function PlayButton({ playing, onClick, label }: { playing: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex size-[88px] items-center justify-center rounded-full bg-brand text-white shadow-[var(--shadow-press-brand)] transition-transform active:scale-95",
        playing && "animate-breathe",
      )}
    >
      <Play className="ml-1 size-9" aria-hidden />
    </button>
  );
}
