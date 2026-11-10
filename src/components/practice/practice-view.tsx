"use client";

import { ChevronRight, Headphones, Layers, PencilLine, Volume2, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { startPractice, type PracticeKind } from "@/lib/repo";

const DRILLS: readonly { kind: PracticeKind; icon: LucideIcon; title: string; detail: string; accent?: boolean }[] = [
  { kind: "p5", icon: PencilLine, title: "Part 5 · Điền vào chỗ trống", detail: "10 câu ngữ pháp và từ vựng, có giải thích" },
  { kind: "p2", icon: Headphones, title: "Part 2 · Hỏi – đáp", detail: "10 câu nghe, chọn câu đáp phù hợp" },
  { kind: "dict", icon: Volume2, title: "Nghe chép chính tả", detail: "8 câu ngắn — cách luyện tai hiệu quả nhất", accent: true },
  { kind: "cards", icon: Layers, title: "Ôn thẻ từ đã học", detail: "15 từ, ưu tiên từ hay quên", accent: true },
];

export function PracticeView() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState<PracticeKind | null>(null);

  async function open(kind: PracticeKind) {
    setLoading(kind);
    try {
      const session = await startPractice(kind);
      if (!session) {
        toast("Chưa có từ nào đã học. Làm buổi học hôm nay trước nhé.");
        setLoading(null);
        return;
      }
      router.push("/learn");
    } catch {
      toast("Không mở được bài luyện. Thử lại nhé.");
      setLoading(null);
    }
  }

  return (
    <div>
      <PageHeader title="Luyện tập" description="Luyện thêm ngoài buổi học. Kết quả vẫn tính vào tiến độ và sổ lỗi." />
      <ul className="flex flex-col gap-3">
        {DRILLS.map(({ kind, icon: Icon, title, detail, accent }) => (
          <li key={kind}>
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => open(kind)}
              className="flex w-full items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-[18px] text-left transition-[border-color,transform] hover:border-brand active:scale-[0.98] disabled:opacity-60"
            >
              <span
                className={cn(
                  "flex size-[52px] shrink-0 items-center justify-center rounded-2xl",
                  accent ? "bg-sun-soft text-sun-strong" : "bg-brand-soft text-brand",
                )}
              >
                <Icon className="size-6" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[17px]">{title}</b>
                <span className="text-sm text-muted">{loading === kind ? "Đang chuẩn bị…" : detail}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <SectionTitle>Sắp có</SectionTitle>
      <Card className="text-sm text-muted">
        Part 1 (tranh), Part 3–4 (hội thoại, bài nói), Part 6–7 (đọc hiểu) và thi thử có bấm giờ sẽ thêm ở các đợt sau.
      </Card>
    </div>
  );
}
