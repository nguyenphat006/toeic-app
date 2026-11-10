"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/primitives";
import { WORD_BY_ID } from "@/content";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/dates";
import { db } from "@/lib/db";
import { GRADES, newCard, previewIntervals, type Grade } from "@/lib/srs";

import { SpeakButton } from "./speak-button";

const GRADE_STYLES = {
  danger: "bg-danger-soft text-danger",
  sun: "bg-sun-soft text-sun-ink",
  brand: "bg-brand-soft text-brand-strong",
} as const;

export function FlashCard({
  wordId,
  isNew,
  speechRate,
  onRate,
}: {
  wordId: string;
  isNew: boolean;
  speechRate: number;
  onRate: (grade: Grade) => void;
}) {
  const word = WORD_BY_ID.get(wordId);
  const [flipped, setFlipped] = useState(false);
  const row = useLiveQuery(() => db.cards.get(wordId), [wordId]);
  const intervals = flipped ? previewIntervals(row?.card ?? newCard()) : null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!flipped && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setFlipped(true);
        return;
      }
      const n = Number(e.key);
      const grade = flipped && n >= 1 && n <= GRADES.length ? GRADES[n - 1]?.grade : undefined;
      if (grade) onRate(grade);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, onRate]);

  if (!word) return null;

  return (
    <div>
      <div className="mb-3.5 flex items-center gap-2">
        {isNew ? <Chip>Từ mới</Chip> : <Chip tone="sun">Ôn tập</Chip>}
        <span className="text-sm text-muted">{flipped ? "Tự chấm: bạn nhớ từ này tới đâu?" : "Chạm vào thẻ để lật"}</span>
      </div>

      <div
        className="flip-scene cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={flipped ? `Mặt sau thẻ ${word.word}` : `Lật thẻ ${word.word}`}
        onClick={() => setFlipped(true)}
      >
        <motion.div
          className="relative min-h-[300px] [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.22, 0.8, 0.3, 1] }}
        >
          <div className="flip-face absolute inset-0 flex flex-col items-center justify-center gap-2.5 rounded-[var(--radius-card)] border border-line bg-surface p-6 text-center">
            <p className="text-[38px] font-bold tracking-tight [overflow-wrap:anywhere]">{word.word}</p>
            <p className="italic text-muted">{word.pos}</p>
            <SpeakButton text={word.word} rate={speechRate} label="Nghe" variant="pill" />
            <p className="mt-3 text-sm text-muted">Nhớ nghĩa chưa? Chạm để xem</p>
          </div>

          <div className="flip-face absolute inset-0 flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-6 [transform:rotateY(180deg)]">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0">
                <span className="text-[26px] font-bold [overflow-wrap:anywhere]">{word.word}</span>{" "}
                <span className="italic text-muted">{word.pos}</span>
              </p>
              <SpeakButton text={word.word} rate={speechRate} label="Nghe từ" />
            </div>
            <p className="text-[22px] font-bold text-brand-strong">{word.meaning}</p>
            <div className="rounded-[var(--radius-tile)] bg-surface-2 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{word.example}</p>
                <SpeakButton text={word.example} rate={speechRate} label="Nghe câu ví dụ" className="-mt-2 -mr-2" />
              </div>
              <p className="mt-1 text-sm text-muted">{word.exampleMeaning}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {intervals ? (
        <motion.div
          className="mt-[18px] grid grid-cols-4 gap-2.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {GRADES.map(({ grade, label, tone }, i) => (
            <button
              key={grade}
              type="button"
              onClick={() => onRate(grade)}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center rounded-[var(--radius-tile)] font-bold leading-tight transition-transform active:scale-95",
                GRADE_STYLES[tone],
              )}
            >
              {label}
              <small className="text-xs font-medium opacity-80">{formatDuration(intervals[grade])}</small>
              <span className="sr-only">Phím {i + 1}</span>
            </button>
          ))}
        </motion.div>
      ) : (
        <Button block className="mt-[18px]" onClick={() => setFlipped(true)}>
          Lật thẻ
        </Button>
      )}
    </div>
  );
}
