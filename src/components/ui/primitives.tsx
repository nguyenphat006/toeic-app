import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[var(--radius-card)] border border-line bg-surface p-5", className)} {...props} />;
}

type Tone = "brand" | "sun" | "danger" | "neutral";

const CHIP_TONES: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand-strong",
  sun: "bg-sun-soft text-sun-ink",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-2 text-muted",
};

export function Chip({ tone = "brand", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold", CHIP_TONES[tone], className)}>
      {children}
    </span>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mx-1 mb-3 mt-7 text-[15px] font-bold text-muted">{children}</h2>;
}

export function PageHeader({ title, description, aside }: { title: string; description?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold leading-tight">{title}</h1>
        {description && <p className="mt-1.5 text-muted">{description}</p>}
      </div>
      {aside}
    </header>
  );
}

export function Meter({ value, tone = "brand", label }: { value: number; tone?: "brand" | "sun"; label: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className="h-2.5 overflow-hidden rounded-full bg-brand-soft"
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", tone === "brand" ? "bg-brand" : "bg-sun")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ProgressRing({ value, children, size = 92 }: { value: number; children: ReactNode; size?: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const ratio = Math.min(1, Math.max(0, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" width={size} height={size} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={10} className="stroke-brand-soft" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={10}
          strokeLinecap="round"
          className="stroke-brand transition-[stroke-dashoffset] duration-700 ease-out"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">{children}</div>
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <Card className="px-5 py-9 text-center text-muted">
      <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand">{icon}</div>
      <p className="font-bold text-ink">{title}</p>
      {children && <div className="mt-1 text-sm">{children}</div>}
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[var(--radius-card)] bg-surface-2", className)} />;
}
