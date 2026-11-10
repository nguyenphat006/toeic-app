"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Check, Flame, Layers, Leaf, Play, RotateCcw, Target } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, Meter, ProgressRing, SectionTitle, Skeleton } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { WORDS } from "@/content";
import { cn } from "@/lib/cn";
import { addDays, dayKey, startOfWeek, WEEKDAY_SHORT } from "@/lib/dates";
import { db, DEFAULT_SETTINGS } from "@/lib/db";
import { getSettings, startDailySession } from "@/lib/repo";
import { LEVEL_2_WORD_THRESHOLD, MAX_REDO_PER_SESSION, MAX_REVIEWS_PER_SESSION } from "@/lib/session";
import { isDue } from "@/lib/srs";
import { computeStreak } from "@/lib/streak";

function greeting(hour: number) {
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export function TodayView() {
  const router = useRouter();
  const toast = useToast();
  const [starting, setStarting] = useState(false);

  const data = useLiveQuery(async () => {
    const [settings, cards, openMistakes, days, session] = await Promise.all([
      getSettings(),
      db.cards.toArray(),
      db.mistakes.where("fixed").equals(0).count(),
      db.days.toArray(),
      db.sessions.get("current"),
    ]);
    const now = new Date();
    return {
      settings,
      started: cards.length,
      due: cards.filter((c) => isDue(c.card, now)).length,
      openMistakes,
      days,
      today: days.find((d) => d.date === dayKey(now)),
      resumable: !!session && session.mode === "daily" && session.date === dayKey(now) && !session.finished,
    };
  }, []);

  async function start() {
    setStarting(true);
    try {
      await startDailySession();
      router.push("/learn");
    } catch {
      toast("Không mở được buổi học. Thử tải lại trang.");
      setStarting(false);
    }
  }

  if (!data) return <TodaySkeleton />;

  const { settings, started, due, openMistakes, days, today, resumable } = data;
  const goalSeconds = (settings.goalMinutes || DEFAULT_SETTINGS.goalMinutes) * 60;
  const studied = today?.seconds ?? 0;
  const firstTime = started === 0 && days.length === 0;
  const newCount = Math.min(settings.newPerDay, WORDS.length - started);
  const level = started >= LEVEL_2_WORD_THRESHOLD ? 2 : 1;
  const weekStart = startOfWeek();

  const plan = [
    { icon: Layers, label: "Ôn từ đến hạn", value: Math.min(due, MAX_REVIEWS_PER_SESSION) },
    { icon: Leaf, label: "Từ mới", value: newCount },
    { icon: Target, label: "Câu Part 5 + Part 2", value: settings.quizPerDay },
    { icon: RotateCcw, label: "Làm lại câu sai", value: Math.min(openMistakes, MAX_REDO_PER_SESSION) },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-brand">{greeting(new Date().getHours())}</p>
          <h1 className="text-[26px] font-bold leading-tight">{firstTime ? "Mình bắt đầu từ đầu nhé" : "Hôm nay học gì?"}</h1>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sun-soft px-3.5 py-2 font-bold text-sun-ink"
          title="Số ngày học liên tiếp"
        >
          <Flame className="size-5 text-sun-strong" aria-hidden />
          {computeStreak(days)}
          <span className="sr-only">ngày liên tiếp</span>
        </span>
      </header>

      <Card className="flex flex-col gap-5 p-6">
        <div className="flex items-center gap-[18px]">
          <ProgressRing value={studied / goalSeconds}>
            <b className="text-[22px]">{Math.floor(studied / 60)}</b>
            <span className="text-xs text-muted">/ {settings.goalMinutes} phút</span>
          </ProgressRing>
          <div>
            <h2 className="text-[19px] font-bold">Buổi học {settings.goalMinutes} phút</h2>
            <p className="mt-1 text-sm text-muted">Ôn từ, học từ mới, luyện đề rồi làm lại câu sai.</p>
          </div>
        </div>

        <ul className="flex flex-col gap-2.5">
          {plan.map(({ icon: Icon, label, value }) => (
            <li key={label} className={cn("flex items-center gap-3 rounded-[var(--radius-tile)] bg-surface-2 px-3.5 py-3", value === 0 && "opacity-60")}>
              <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-surface text-brand">
                <Icon className="size-[18px]" aria-hidden />
              </span>
              {label}
              <b className="ml-auto tabular-nums">{value}</b>
            </li>
          ))}
        </ul>

        {resumable ? (
          <Button block onClick={() => router.push("/learn")}>
            <Play className="size-5" aria-hidden /> Học tiếp
          </Button>
        ) : today?.done ? (
          <>
            <div className="flex items-center gap-3 rounded-[var(--radius-tile)] bg-brand-soft px-4 py-3.5 font-semibold text-brand-strong">
              <Check className="size-5" aria-hidden /> Đã xong buổi hôm nay. Giỏi lắm!
            </div>
            <Button variant="secondary" block onClick={start} disabled={starting}>
              Học thêm một buổi
            </Button>
          </>
        ) : (
          <Button block onClick={start} disabled={starting}>
            <Play className="size-5" aria-hidden /> {starting ? "Đang chuẩn bị…" : firstTime ? "Bắt đầu học" : "Bắt đầu buổi học"}
          </Button>
        )}
      </Card>

      <SectionTitle>Tuần này</SectionTitle>
      <Card>
        <ol className="grid grid-cols-7 gap-2 text-center">
          {WEEKDAY_SHORT.map((label, i) => {
            const date = dayKey(addDays(weekStart, i));
            const day = days.find((d) => d.date === date);
            const isToday = date === dayKey();
            return (
              <li key={label} className="flex flex-col items-center gap-1.5 text-[13px] text-muted">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full",
                    day?.done ? "bg-brand text-white" : day && day.seconds > 0 ? "bg-sun-soft" : "bg-surface-2",
                    isToday && "ring-2 ring-sun",
                  )}
                  aria-label={day?.done ? "Đã học" : "Chưa học"}
                >
                  {day?.done && <Check className="size-4" aria-hidden />}
                </span>
                {label}
              </li>
            );
          })}
        </ol>
      </Card>

      <SectionTitle>Lộ trình</SectionTitle>
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <b>
            Giai đoạn {level} · {level === 1 ? "Nền móng" : "Vào TOEIC"}
          </b>
          <span className="shrink-0 text-sm text-muted tabular-nums">
            {started}/{WORDS.length} từ
          </span>
        </div>
        <Meter value={started / WORDS.length} label="Số từ đã học" />
        <p className="text-sm text-muted">
          {level === 1
            ? `Học đủ ${LEVEL_2_WORD_THRESHOLD} từ đầu tiên để mở câu Part 5 khó hơn (thì, câu bị động, liên từ).`
            : "Đã mở câu Part 5 khó hơn. Giữ nhịp mỗi ngày nhé."}
        </p>
      </Card>
    </motion.div>
  );
}

function TodaySkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="h-14 w-2/3" />
      <Skeleton className="h-[420px]" />
      <Skeleton className="h-24" />
    </div>
  );
}
