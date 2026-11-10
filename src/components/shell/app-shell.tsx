"use client";

import { BarChart3, BookOpen, CircleAlert, House, Target, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const TABS: readonly { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Hôm nay", icon: House },
  { href: "/vocab", label: "Từ vựng", icon: BookOpen },
  { href: "/practice", label: "Luyện tập", icon: Target },
  { href: "/mistakes", label: "Sổ lỗi", icon: CircleAlert },
  { href: "/progress", label: "Tiến độ", icon: BarChart3 },
];

/** Full-screen routes hide the tab bar so the learner stays focused. */
const FOCUS_ROUTES = ["/learn"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const focus = FOCUS_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <main className={cn("flex-1 px-4 pt-5 md:pt-9", focus ? "pb-8" : "pb-28")}>{children}</main>
      {!focus && (
        <nav
          aria-label="Điều hướng chính"
          className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-xl grid-cols-5 border-t border-line bg-surface/95 px-1 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] backdrop-blur-md"
        >
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-xs font-semibold",
                  active ? "text-brand-strong" : "text-muted hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "flex h-[30px] w-[52px] items-center justify-center rounded-full transition-colors duration-300",
                    active && "bg-brand-soft",
                  )}
                >
                  <Icon className="size-[22px]" strokeWidth={2} aria-hidden />
                </span>
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
