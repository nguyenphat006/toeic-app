"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { SpeakButton } from "@/components/session/speak-button";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { TOPICS, WORDS, type TopicId } from "@/content";
import { cn } from "@/lib/cn";
import { db, DEFAULT_SETTINGS } from "@/lib/db";
import { getSettings } from "@/lib/repo";
import { cardStatus, type CardStatus } from "@/lib/srs";

const STATUS: Record<CardStatus, { dot: string; label: string }> = {
  new: { dot: "bg-line", label: "Chưa học" },
  learning: { dot: "bg-sun", label: "Đang học" },
  known: { dot: "bg-brand", label: "Đã thuộc" },
};

/** Lets "ke toan" match "kế toán" — learners rarely type Vietnamese accents on the go. */
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");

export function VocabView() {
  const [topic, setTopic] = useState<TopicId | "all">("all");
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const cards = useLiveQuery(() => db.cards.toArray(), []);
  const rate = (useLiveQuery(getSettings, []) ?? DEFAULT_SETTINGS).speechRate;

  const byWord = useMemo(() => new Map((cards ?? []).map((c) => [c.wordId, c.card])), [cards]);
  const rows = useMemo(() => {
    const q = fold(deferred.trim());
    return WORDS.filter((w) => (topic === "all" || w.topic === topic) && (!q || fold(w.word).includes(q) || fold(w.meaning).includes(q)));
  }, [deferred, topic]);

  return (
    <div>
      <PageHeader title="Từ vựng" description={`${WORDS.length} từ theo chủ đề TOEIC. Chấm màu cho biết bạn đã học tới đâu.`} />

      <label className="flex h-[50px] items-center gap-2.5 rounded-full border-[1.5px] border-line bg-surface px-4 focus-within:border-brand">
        <Search className="size-5 shrink-0 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt"
          aria-label="Tìm từ"
          className="min-w-0 flex-1 bg-transparent outline-none"
        />
      </label>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 pt-3.5" role="tablist" aria-label="Chủ đề">
        {[{ id: "all" as const, name: "Tất cả" }, ...TOPICS].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={topic === t.id}
            onClick={() => setTopic(t.id)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border-[1.5px] px-3.5 py-2 text-sm font-semibold transition-colors",
              topic === t.id ? "border-brand bg-brand text-white" : "border-line bg-surface hover:border-brand",
            )}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="mx-1 my-2.5 flex flex-wrap gap-4 text-[13px] text-muted">
        {Object.values(STATUS).map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <i className={cn("size-2.5 rounded-full", s.dot)} />
            {s.label}
          </span>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Search className="size-7" aria-hidden />} title={`Không có từ nào khớp “${query}”`}>
          Thử gõ ít chữ hơn, hoặc chọn chủ đề “Tất cả”.
        </EmptyState>
      ) : (
        <ul className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          {rows.map((w) => {
            const status = STATUS[cardStatus(byWord.get(w.id))];
            return (
              <li key={w.id} className="flex items-center gap-3 border-b border-line py-3 pr-3 pl-4 last:border-b-0">
                <i className={cn("size-2.5 shrink-0 rounded-full", status.dot)} title={status.label} />
                <div className="min-w-0 flex-1">
                  <p>
                    <b className="text-[17px]">{w.word}</b> <span className="text-sm italic text-muted">{w.pos}</span>
                  </p>
                  <p className="text-sm text-muted [overflow-wrap:anywhere]">{w.meaning}</p>
                </div>
                <SpeakButton text={w.word} rate={rate} label={`Nghe ${w.word}`} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
