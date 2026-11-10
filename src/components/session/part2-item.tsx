"use client";

import { Eye } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, Chip } from "@/components/ui/primitives";
import { KIND_LABELS, PART2_BY_ID, TAG_LABELS } from "@/content";
import { cn } from "@/lib/cn";
import type { SpeechPart } from "@/lib/tts";

import { FeedbackPanel, OPTION_KEYS, OptionButton, optionState, Tip, useOptionKeys } from "./answer-parts";
import { PlayButton } from "./play-button";
import { usePlayer } from "./use-player";

export function Part2Item({
  questionId,
  order,
  redo,
  speechRate,
  onAnswer,
  onNext,
}: {
  questionId: string;
  order: number[];
  redo?: boolean;
  speechRate: number;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}) {
  const q = PART2_BY_ID.get(questionId);
  const [chosen, setChosen] = useState<number | null>(null);
  const [showText, setShowText] = useState(false);
  const player = usePlayer(speechRate);
  const rightIndex = q ? order.indexOf(q.answer) : -1;

  // Question in the main voice, answers in a second voice — like the real test.
  const parts = useMemo<SpeechPart[]>(
    () =>
      q
        ? [
            { text: q.prompt, voice: 0, pauseAfter: 800 },
            ...order.map((oi, k) => ({ text: `${OPTION_KEYS[k]}. ${q.options[oi]}`, voice: 1 as const, pauseAfter: 600 })),
          ]
        : [],
    [q, order],
  );

  const { start, stop } = player;
  useEffect(() => {
    const id = setTimeout(() => void start(parts), 400);
    return () => clearTimeout(id);
  }, [parts, start]);

  const pick = useCallback(
    (index: number) => {
      if (chosen !== null) return;
      stop();
      setChosen(index);
      onAnswer(index === rightIndex);
    },
    [chosen, onAnswer, stop, rightIndex],
  );
  useOptionKeys(3, chosen === null, pick);

  if (!q) return null;

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <Chip>{KIND_LABELS.p2}</Chip>
        {redo && <Chip tone="danger">Làm lại câu sai</Chip>}
      </div>

      <Card className="mb-[18px] flex flex-col items-center gap-3.5 px-4 py-7 text-center">
        <PlayButton playing={player.playing} onClick={() => void player.start(parts)} label="Nghe lại" />
        <div>
          <p className="font-bold">Nghe câu hỏi và 3 câu đáp</p>
          <p className="text-sm text-muted">Chọn câu đáp phù hợp nhất. Đề thật chỉ cho nghe một lần.</p>
        </div>
        {!player.supported && <p className="text-sm text-danger">Trình duyệt này không có giọng đọc — bật &quot;Hiện chữ&quot; để làm bài.</p>}
        {chosen === null &&
          (showText ? (
            <ul className="flex w-full flex-col gap-1.5 text-left">
              <li className="rounded-xl bg-surface-2 px-3 py-2 font-semibold">{q.prompt}</li>
              {order.map((oi, k) => (
                <li key={k} className="rounded-xl bg-surface-2 px-3 py-2">
                  ({OPTION_KEYS[k]}) {q.options[oi]}
                </li>
              ))}
            </ul>
          ) : (
            <Button variant="ghost" size="md" onClick={() => setShowText(true)}>
              <Eye className="size-5" aria-hidden /> Hiện chữ (gợi ý)
            </Button>
          ))}
      </Card>

      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((k) => (
          <OptionButton key={k} index={k} compact state={optionState(k, chosen, rightIndex)} disabled={chosen !== null} onClick={() => pick(k)} />
        ))}
      </div>

      {chosen !== null && (
        <FeedbackPanel
          correct={chosen === rightIndex}
          title={chosen === rightIndex ? "Chính xác!" : `Chưa đúng — đáp án (${OPTION_KEYS[rightIndex]})`}
          onNext={onNext}
        >
          <ul className="flex flex-col gap-1.5">
            <li className="rounded-xl bg-surface px-3 py-2">
              <b>{q.prompt}</b>
              <small className="block text-muted">{q.promptMeaning}</small>
            </li>
            {order.map((oi, k) => (
              <li key={k} className={cn("rounded-xl bg-surface px-3 py-2", oi === q.answer && "shadow-[inset_3px_0_0_var(--color-brand)]")}>
                <b>({OPTION_KEYS[k]})</b> {q.options[oi]}
                <small className="block text-muted">{q.optionMeanings[oi]}</small>
              </li>
            ))}
          </ul>
          <Tip label={TAG_LABELS[q.tag]}>{q.explanation}</Tip>
        </FeedbackPanel>
      )}
    </div>
  );
}
