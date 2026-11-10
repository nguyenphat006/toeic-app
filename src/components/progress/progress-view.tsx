"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Download, Minus, Plus, Upload } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, Meter, PageHeader, SectionTitle, Skeleton } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { KIND_LABELS } from "@/content";
import { cn } from "@/lib/cn";
import { addDays, dayKey, startOfWeek, WEEKDAY_SHORT } from "@/lib/dates";
import { db, SETTING_LIMITS, type Settings } from "@/lib/db";
import { BackupError, exportBackup, getSettings, importBackup, updateSetting } from "@/lib/repo";
import { cardStatus } from "@/lib/srs";
import { computeStreak } from "@/lib/streak";

const ACCURACY_KINDS = ["p5", "p2", "dict"] as const;
/** Below this accuracy the bar turns yellow to flag a weak area. */
const WEAK_ACCURACY = 0.6;

const SETTING_ROWS: readonly { key: keyof typeof SETTING_LIMITS; label: string; hint: string; format?: (v: number) => string }[] = [
  { key: "newPerDay", label: "Từ mới mỗi ngày", hint: "Người mới nên để 5–10" },
  { key: "quizPerDay", label: "Câu luyện mỗi buổi", hint: "Part 5 + Part 2" },
  { key: "goalMinutes", label: "Mục tiêu mỗi ngày", hint: "Phút" },
  { key: "speechRate", label: "Tốc độ đọc", hint: "Giọng đọc của trình duyệt", format: (v) => v.toFixed(1) },
];

export function ProgressView() {
  const data = useLiveQuery(async () => {
    const [days, cards, attempts, settings] = await Promise.all([db.days.toArray(), db.cards.toArray(), db.attempts.toArray(), getSettings()]);
    const accuracy = Object.fromEntries(
      ACCURACY_KINDS.map((k) => {
        const list = attempts.filter((a) => a.kind === k);
        return [k, { right: list.filter((a) => a.correct).length, total: list.length }];
      }),
    ) as Record<(typeof ACCURACY_KINDS)[number], { right: number; total: number }>;
    return {
      days,
      settings,
      accuracy,
      started: cards.length,
      known: cards.filter((c) => cardStatus(c.card) === "known").length,
      totalSeconds: days.reduce((sum, d) => sum + d.seconds, 0),
      totalQuestions: attempts.length,
    };
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Đang tải">
        <Skeleton className="h-14 w-1/2" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const kpis = [
    { value: computeStreak(data.days), label: "ngày liên tiếp" },
    { value: Math.round(data.totalSeconds / 60), label: "phút đã học" },
    { value: data.started, label: `từ đã học · ${data.known} đã thuộc` },
    { value: data.totalQuestions, label: "câu đã làm" },
  ];

  const firstMonday = addDays(startOfWeek(), -21);
  const today = dayKey();
  const dayMap = new Map(data.days.map((d) => [d.date, d]));

  return (
    <div>
      <PageHeader title="Tiến độ" />
      <dl className="grid grid-cols-2 gap-2.5">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <dd className="text-[28px] font-bold leading-tight tabular-nums">{k.value}</dd>
            <dt className="text-sm text-muted">{k.label}</dt>
          </Card>
        ))}
      </dl>

      <SectionTitle>Tỉ lệ đúng theo phần</SectionTitle>
      <Card className="flex flex-col gap-4">
        {ACCURACY_KINDS.map((k) => {
          const { right, total } = data.accuracy[k];
          const ratio = total ? right / total : 0;
          return (
            <div key={k} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <span>{KIND_LABELS[k]}</span>
                <b className="tabular-nums">{total ? `${Math.round(ratio * 100)}%` : "—"}</b>
              </div>
              <Meter value={ratio} tone={total && ratio < WEAK_ACCURACY ? "sun" : "brand"} label={`Tỉ lệ đúng ${KIND_LABELS[k]}`} />
              <span className="text-sm text-muted">{total ? `${right}/${total} câu đúng` : "Chưa làm câu nào"}</span>
            </div>
          );
        })}
      </Card>

      <SectionTitle>4 tuần gần đây</SectionTitle>
      <Card>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAY_SHORT.map((d) => (
            <span key={d} className="text-center text-sm text-muted">
              {d}
            </span>
          ))}
          {Array.from({ length: 28 }, (_, i) => {
            const date = addDays(firstMonday, i);
            const key = dayKey(date);
            const day = dayMap.get(key);
            const future = key > today;
            return (
              <i
                key={key}
                title={`${date.getDate()}/${date.getMonth() + 1}`}
                className={cn(
                  "aspect-square rounded-lg",
                  future ? "border border-dashed border-line" : day?.done ? "bg-brand" : day && day.seconds > 0 ? "bg-sun" : "bg-surface-2",
                  key === today && "ring-2 ring-sun ring-offset-1",
                )}
              />
            );
          })}
        </div>
        <div className="mt-3 flex gap-4 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <i className="size-2.5 rounded-full bg-brand" /> Xong buổi
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="size-2.5 rounded-full bg-sun" /> Học dở
          </span>
        </div>
      </Card>

      <SectionTitle>Cài đặt</SectionTitle>
      <SettingsCard settings={data.settings} />

      <SectionTitle>Dữ liệu</SectionTitle>
      <BackupCard />
    </div>
  );
}

function SettingsCard({ settings }: { settings: Settings }) {
  return (
    <Card className="divide-y divide-line py-1">
      {SETTING_ROWS.map(({ key, label, hint, format }) => {
        const { min, max, step } = SETTING_LIMITS[key];
        const value = settings[key];
        return (
          <div key={key} className="flex items-center justify-between gap-3 py-3.5">
            <div className="min-w-0">
              <b>{label}</b>
              <p className="text-sm text-muted">{hint}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-surface-2 p-1" role="group" aria-label={label}>
              <button
                type="button"
                aria-label={`Giảm ${label}`}
                disabled={value <= min}
                onClick={() => void updateSetting(key, value - step)}
                className="flex size-9 items-center justify-center rounded-full bg-surface disabled:opacity-40"
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <b className="min-w-9 text-center tabular-nums" aria-live="polite">
                {format ? format(value) : value}
              </b>
              <button
                type="button"
                aria-label={`Tăng ${label}`}
                disabled={value >= max}
                onClick={() => void updateSetting(key, value + step)}
                className="flex size-9 items-center justify-center rounded-full bg-surface disabled:opacity-40"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function BackupCard() {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  async function download() {
    const blob = new Blob([await exportBackup()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `toeic-xanh-${dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function restore(file: File) {
    if (!window.confirm("Nhập file này sẽ thay toàn bộ tiến độ hiện có trên máy. Tiếp tục?")) return;
    try {
      await importBackup(await file.text());
      toast("Đã nhập tiến độ.");
    } catch (e) {
      toast(e instanceof BackupError ? e.message : "Không đọc được file.");
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm text-muted">Tiến độ lưu trên trình duyệt này. Muốn chuyển sang máy khác thì xuất file rồi nhập ở máy kia.</p>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="secondary" size="md" onClick={download}>
          <Download className="size-5" aria-hidden /> Xuất file
        </Button>
        <Button variant="secondary" size="md" onClick={() => fileInput.current?.click()}>
          <Upload className="size-5" aria-hidden /> Nhập file
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void restore(file);
            e.target.value = "";
          }}
        />
      </div>
    </Card>
  );
}
