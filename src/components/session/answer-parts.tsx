"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const OPTION_KEYS = ["A", "B", "C", "D"] as const;

export type OptionState = "idle" | "right" | "wrong" | "dim";

export function OptionButton({
  index,
  state,
  disabled,
  onClick,
  children,
  compact,
}: {
  index: number;
  state: OptionState;
  disabled: boolean;
  onClick: () => void;
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      animate={state === "right" ? { scale: [1, 1.04, 1] } : state === "wrong" ? { x: [0, -6, 6, -3, 0] } : {}}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex min-h-14 w-full items-center gap-3.5 rounded-[var(--radius-tile)] border-[1.5px] bg-surface px-4 py-2.5 text-left text-[17px] transition-colors",
        compact && "justify-center text-xl font-bold",
        state === "idle" && "border-line enabled:hover:border-brand",
        state === "right" && "border-brand bg-brand-soft",
        state === "wrong" && "border-danger bg-danger-soft",
        state === "dim" && "border-line opacity-60",
        "disabled:cursor-default",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-[15px] font-bold",
          state === "right" ? "bg-brand text-white" : state === "wrong" ? "bg-danger text-white" : "bg-surface-2",
        )}
      >
        {OPTION_KEYS[index]}
      </span>
      {children && <span className="min-w-0 flex-1">{children}</span>}
    </motion.button>
  );
}

export function optionState(index: number, chosen: number | null, rightIndex: number): OptionState {
  if (chosen === null) return "idle";
  if (index === rightIndex) return "right";
  if (index === chosen) return "wrong";
  return "dim";
}

export function FeedbackPanel({
  correct,
  title,
  children,
  onNext,
  nextLabel = "Tiếp tục",
}: {
  correct: boolean;
  title: string;
  children: ReactNode;
  onNext: () => void;
  nextLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    button.current?.focus({ preventScroll: true });
  }, []);

  return (
    <motion.div
      ref={ref}
      role="status"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("mt-[18px] rounded-[var(--radius-card)] p-[18px]", correct ? "bg-brand-soft" : "bg-danger-soft")}
    >
      <h3 className={cn("mb-2 flex items-center gap-2 text-lg font-bold", correct ? "text-brand-strong" : "text-danger")}>
        {correct ? <CircleCheck className="size-5" aria-hidden /> : <CircleAlert className="size-5" aria-hidden />}
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
      <Button ref={button} block className="mt-3.5" onClick={onNext}>
        {nextLabel}
      </Button>
    </motion.div>
  );
}

export function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-tile)] bg-surface px-3.5 py-3">
      <b>Mẹo · {label}:</b> {children}
    </div>
  );
}

/** Lets A–D (or 1–4) pick an option, the way you would on paper. */
export function useOptionKeys(count: number, enabled: boolean, onPick: (index: number) => void) {
  useEffect(() => {
    if (!enabled) return;
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const letter = OPTION_KEYS.indexOf(e.key.toUpperCase() as (typeof OPTION_KEYS)[number]);
      const index = letter >= 0 ? letter : Number(e.key) - 1;
      if (index >= 0 && index < count) onPick(index);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, enabled, onPick]);
}
