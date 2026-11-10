"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { CircleCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader, SectionTitle, Skeleton } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { getQuestion, KIND_LABELS, TAG_LABELS, type QuestionTag } from "@/content";
import { db, type MistakeRow } from "@/lib/db";
import { startRedo } from "@/lib/repo";

const RECENT_LIMIT = 8;

export function MistakesView() {
  const router = useRouter();
  const toast = useToast();
  const open = useLiveQuery(() => db.mistakes.where("fixed").equals(0).toArray(), []);

  const groups = useMemo(() => {
    const map = new Map<QuestionTag, MistakeRow[]>();
    for (const m of open ?? []) map.set(m.tag, [...(map.get(m.tag) ?? []), m]);
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [open]);

  async function redo(tag: QuestionTag) {
    try {
      if (await startRedo(tag)) router.push("/learn");
    } catch {
      toast("Không mở được bài luyện lại. Thử lại nhé.");
    }
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Đang tải">
        <Skeleton className="h-14 w-1/2" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  if (open.length === 0) {
    return (
      <div>
        <PageHeader title="Sổ lỗi" />
        <EmptyState icon={<CircleCheck className="size-7" aria-hidden />} title="Chưa có câu sai nào cần làm lại">
          Câu nào trả lời sai sẽ tự vào đây, gom theo dạng để bạn luyện đúng chỗ yếu.
        </EmptyState>
      </div>
    );
  }

  const recent = open.slice().sort((a, b) => b.lastAt - a.lastAt).slice(0, RECENT_LIMIT);

  return (
    <div>
      <PageHeader title="Sổ lỗi" description={`${open.length} câu cần làm lại. Dạng sai nhiều nhất đứng đầu.`} />
      <ul className="flex flex-col gap-3">
        {groups.map(([tag, list]) => (
          <li key={tag}>
            <Card className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <b>{TAG_LABELS[tag]}</b>
                <p className="text-sm text-muted">
                  {list.length} câu · {list[0]?.kind === "p5" ? "Part 5" : "Part 2"}
                </p>
              </div>
              <Button variant="secondary" size="md" onClick={() => redo(tag)}>
                Luyện lại
              </Button>
            </Card>
          </li>
        ))}
      </ul>

      <SectionTitle>Sai gần đây</SectionTitle>
      <ul className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        {recent.map((m) => {
          const q = getQuestion(m.questionId);
          if (!q) return null;
          const text = "sentence" in q ? q.sentence.replace("___", "_____") : q.prompt;
          return (
            <li key={m.questionId} className="border-b border-line px-4 py-3 last:border-b-0">
              <p className="font-semibold">{text}</p>
              <p className="text-sm text-muted">
                Sai {m.count} lần · {KIND_LABELS[m.kind]}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
