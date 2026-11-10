"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Star, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, EmptyState, Skeleton } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { dayKey, formatClock } from "@/lib/dates";
import { db, DEFAULT_SETTINGS } from "@/lib/db";
import { clearSession, getSettings, rateWord, recordAnswer, recordDictation, saveSession } from "@/lib/repo";
import { requeueForgotten, type Session } from "@/lib/session";
import { Rating, type Grade } from "@/lib/srs";
import { computeStreak } from "@/lib/streak";

import { DictationItem } from "./dictation-item";
import { FlashCard } from "./flash-card";
import { Part2Item } from "./part2-item";
import { Part5Item } from "./part5-item";
import { useStudyClock } from "./use-study-clock";

export function SessionView() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    db.sessions.get("current").then((s) => {
      if (alive) setSession(s && s.date === dayKey() ? s : null);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (session === undefined) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Đang tải">
        <Skeleton className="h-6" />
        <Skeleton className="h-[360px]" />
      </div>
    );
  }
  if (session === null) {
    return (
      <EmptyState icon={<Star className="size-7" aria-hidden />} title="Chưa có buổi học nào đang mở">
        <p>Bấm Bắt đầu ở trang Hôm nay để vào học.</p>
        <Link href="/" className="mt-4 inline-flex font-bold text-brand underline underline-offset-4">
          Về trang Hôm nay
        </Link>
      </EmptyState>
    );
  }
  return <ActiveSession initial={session} />;
}

function ActiveSession({ initial }: { initial: Session }) {
  const router = useRouter();
  const toast = useToast();
  const settings = useLiveQuery(getSettings, []) ?? DEFAULT_SETTINGS;
  const [session, setSession] = useState(initial);
  const seconds = useStudyClock(initial.seconds, !session.finished);
  const busy = useRef(false);

  // Persist on every step so a closed tab resumes at the same question.
  const commit = useCallback(
    async (next: Session) => {
      setSession(next);
      await saveSession({ ...next, seconds });
    },
    [seconds],
  );

  const advance = useCallback(
    async (patch: Partial<Session> = {}) => {
      const base = { ...session, ...patch };
      const index = base.index + 1;
      await commit({ ...base, index, finished: index >= base.queue.length });
    },
    [commit, session],
  );

  const onRate = useCallback(
    async (grade: Grade) => {
      if (busy.current) return;
      busy.current = true;
      try {
        const item = session.queue[session.index];
        if (item?.type !== "card") return;
        await rateWord(item.wordId, grade);
        const queue = grade === Rating.Again ? requeueForgotten(session.queue, session.index) : session.queue;
        await advance({ queue, cardsReviewed: session.cardsReviewed + 1 });
      } catch {
        toast("Không lưu được kết quả. Thử lại nhé.");
      } finally {
        busy.current = false;
      }
    },
    [advance, session, toast],
  );

  const onAnswer = useCallback(
    (correct: boolean) => {
      const item = session.queue[session.index];
      if (!item) return;
      const save = item.type === "dict" ? recordDictation(correct) : item.type !== "card" ? recordAnswer(item.questionId, correct, !!item.redo) : null;
      save?.catch(() => toast("Không lưu được câu trả lời."));
      setSession((s) => ({ ...s, right: s.right + (correct ? 1 : 0), wrong: s.wrong + (correct ? 0 : 1) }));
    },
    [session, toast],
  );

  const onNext = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    advance().finally(() => {
      busy.current = false;
    });
  }, [advance]);

  async function quit() {
    await saveSession({ ...session, seconds });
    if (session.mode === "practice") {
      await clearSession();
      toast("Đã dừng lượt luyện.");
    } else {
      toast("Đã lưu. Lần sau bấm Học tiếp để làm nốt.");
    }
    router.push("/");
  }

  if (session.finished) return <SessionFinish session={{ ...session, seconds }} />;

  const item = session.queue[session.index];
  const pct = Math.round((session.index / session.queue.length) * 100);

  return (
    <div>
      <div className="-mx-1 -mt-2 mb-5 flex items-center gap-2.5">
        <button
          type="button"
          onClick={quit}
          aria-label="Thoát buổi học"
          className="inline-flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
        >
          <X className="size-[22px]" aria-hidden />
        </button>
        <div
          className="h-3 flex-1 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label="Tiến độ buổi học"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div className="h-full rounded-full bg-brand" animate={{ width: `${pct}%` }} transition={{ duration: 0.45, ease: "easeOut" }} />
        </div>
        <span className="min-w-11 text-right text-sm text-muted tabular-nums" aria-label="Thời gian đã học">
          {formatClock(seconds)}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={session.index}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {item?.type === "card" && <FlashCard wordId={item.wordId} isNew={item.isNew} speechRate={settings.speechRate} onRate={onRate} />}
          {item?.type === "p5" && <Part5Item questionId={item.questionId} order={item.order} redo={item.redo} onAnswer={onAnswer} onNext={onNext} />}
          {item?.type === "p2" && (
            <Part2Item questionId={item.questionId} order={item.order} redo={item.redo} speechRate={settings.speechRate} onAnswer={onAnswer} onNext={onNext} />
          )}
          {item?.type === "dict" && <DictationItem text={item.text} speechRate={settings.speechRate} onAnswer={onAnswer} onNext={onNext} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SessionFinish({ session }: { session: Session }) {
  const router = useRouter();
  const days = useLiveQuery(() => db.days.toArray(), []);
  const total = session.right + session.wrong;
  const daily = session.mode === "daily";

  async function home() {
    await clearSession();
    router.push("/");
  }

  const stats = [
    { value: formatClock(session.seconds), label: "thời gian" },
    { value: String(session.cardsReviewed), label: "thẻ từ" },
    { value: total ? `${session.right}/${total}` : "—", label: "câu đúng" },
  ];

  return (
    <Card className="flex flex-col items-center gap-3.5 px-5 py-8 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="flex size-24 items-center justify-center rounded-full bg-sun text-white"
      >
        <Star className="size-12" aria-hidden />
      </motion.div>
      <h1 className="text-[26px] font-bold">{daily ? "Xong buổi học hôm nay!" : "Xong lượt luyện!"}</h1>
      <p className="text-muted">
        {daily ? (
          <>
            Chuỗi ngày học: <b>{days ? computeStreak(days) : "…"} ngày</b>. Mai gặp lại nhé.
          </>
        ) : (
          "Luyện thêm là cách nhanh nhất để lên điểm."
        )}
      </p>
      <dl className="mt-1.5 grid w-full grid-cols-3 gap-2.5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[var(--radius-tile)] bg-surface-2 px-1.5 py-3">
            <dd className="text-[22px] font-bold tabular-nums">{s.value}</dd>
            <dt className="text-[13px] text-muted">{s.label}</dt>
          </div>
        ))}
      </dl>
      <Button block onClick={home}>
        Về trang Hôm nay
      </Button>
    </Card>
  );
}
