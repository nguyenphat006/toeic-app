"use client";

import { Snail } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, Chip } from "@/components/ui/primitives";
import { KIND_LABELS } from "@/content";
import { cn } from "@/lib/cn";
import { DICTATION_PASS, diffDictation, type DictationResult } from "@/lib/dictation";

import { FeedbackPanel } from "./answer-parts";
import { PlayButton } from "./play-button";
import { usePlayer } from "./use-player";

export function DictationItem({
  text,
  speechRate,
  onAnswer,
  onNext,
}: {
  text: string;
  speechRate: number;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}) {
  const inputId = useId();
  const player = usePlayer(speechRate);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<DictationResult | null>(null);
  const [error, setError] = useState("");
  const parts = useMemo(() => [{ text }], [text]);

  const { start } = player;
  useEffect(() => {
    const id = setTimeout(() => void start(parts), 400);
    return () => clearTimeout(id);
  }, [parts, start]);

  function check() {
    if (!typed.trim()) {
      setError("Gõ lại câu bạn nghe được trước đã.");
      return;
    }
    const r = diffDictation(text, typed);
    setResult(r);
    onAnswer(r.score >= DICTATION_PASS);
  }

  return (
    <div>
      <div className="mb-3.5">
        <Chip>{KIND_LABELS.dict}</Chip>
      </div>
      <Card className="mb-[18px] flex flex-col items-center gap-3 px-4 py-7">
        <PlayButton playing={player.playing} onClick={() => void player.start(parts)} label="Nghe lại" />
        <Button variant="ghost" size="md" onClick={() => void player.start([{ text, slow: true }])}>
          <Snail className="size-5" aria-hidden /> Nghe chậm
        </Button>
      </Card>

      <label htmlFor={inputId} className="mb-2 block font-semibold">
        Câu bạn nghe được
      </label>
      <textarea
        id={inputId}
        value={typed}
        disabled={!!result}
        onChange={(e) => {
          setTyped(e.target.value);
          setError("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !result) {
            e.preventDefault();
            check();
          }
        }}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        placeholder="Gõ lại câu tiếng Anh…"
        autoCapitalize="off"
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "min-h-[110px] w-full resize-y rounded-[var(--radius-tile)] border-[1.5px] bg-surface p-3.5 text-lg outline-none focus:border-brand disabled:opacity-70",
          error ? "border-danger" : "border-line",
        )}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}

      {result ? (
        <FeedbackPanel
          correct={result.score >= DICTATION_PASS}
          title={`${result.score >= DICTATION_PASS ? "Tốt lắm!" : "Còn sót vài từ"} · đúng ${Math.round(result.score * 100)}%`}
          onNext={onNext}
        >
          <p className="leading-loose">
            {result.tokens.map((t, i) => (
              <span
                key={i}
                className={cn("mr-1 rounded px-1", t.hit ? "bg-surface text-brand-strong" : "bg-surface text-danger underline decoration-wavy")}
              >
                {t.text}
              </span>
            ))}
          </p>
          <p className="text-sm text-muted">Chữ đỏ là chỗ nghe sót hoặc gõ sai. Nghe lại vài lần cho quen tai rồi đi tiếp.</p>
        </FeedbackPanel>
      ) : (
        <Button block className="mt-3.5" onClick={check}>
          Kiểm tra
        </Button>
      )}
    </div>
  );
}
