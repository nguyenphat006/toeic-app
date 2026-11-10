"use client";

import { useCallback, useState } from "react";

import { Chip } from "@/components/ui/primitives";
import { KIND_LABELS, PART5_BY_ID, TAG_LABELS } from "@/content";

import { FeedbackPanel, OPTION_KEYS, OptionButton, optionState, Tip, useOptionKeys } from "./answer-parts";

export function Part5Item({
  questionId,
  order,
  redo,
  onAnswer,
  onNext,
}: {
  questionId: string;
  order: number[];
  redo?: boolean;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}) {
  const q = PART5_BY_ID.get(questionId);
  const [chosen, setChosen] = useState<number | null>(null);
  const rightIndex = q ? order.indexOf(q.answer) : -1;

  const pick = useCallback(
    (index: number) => {
      if (chosen !== null) return;
      setChosen(index);
      onAnswer(index === rightIndex);
    },
    [chosen, onAnswer, rightIndex],
  );
  useOptionKeys(order.length, chosen === null, pick);

  if (!q) return null;
  const [before, after] = q.sentence.split("___");

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <Chip>{KIND_LABELS.p5}</Chip>
        {redo && <Chip tone="danger">Làm lại câu sai</Chip>}
      </div>
      <p className="mb-5 mt-1 text-[21px] font-semibold leading-relaxed">
        {before}
        <span className="mx-1 inline-block min-w-[72px] border-b-[3px] border-brand align-baseline" aria-label="chỗ trống" />
        {after}
      </p>
      <div className="flex flex-col gap-2.5">
        {order.map((optionIndex, k) => (
          <OptionButton key={k} index={k} state={optionState(k, chosen, rightIndex)} disabled={chosen !== null} onClick={() => pick(k)}>
            {q.options[optionIndex]}
          </OptionButton>
        ))}
      </div>
      {chosen !== null && (
        <FeedbackPanel
          correct={chosen === rightIndex}
          title={chosen === rightIndex ? "Chính xác!" : `Chưa đúng — đáp án (${OPTION_KEYS[rightIndex]})`}
          onNext={onNext}
        >
          <p>
            <b>Dịch:</b> {q.translation}
          </p>
          <Tip label={TAG_LABELS[q.tag]}>{q.explanation}</Tip>
        </FeedbackPanel>
      )}
    </div>
  );
}
