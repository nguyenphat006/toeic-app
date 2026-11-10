import { PART2 } from "./part2";
import { PART5 } from "./part5";
import type { Part2Question, Part5Question, Question, QuestionKind } from "./types";
import { TOPICS, WORDS } from "./vocab";

export { PART2, PART5, TOPICS, WORDS };
export { TAG_LABELS } from "./tags";
export type * from "./types";

export const WORD_BY_ID = new Map(WORDS.map((w) => [w.id, w]));
export const PART5_BY_ID = new Map<string, Part5Question>(PART5.map((q) => [q.id, q]));
export const PART2_BY_ID = new Map<string, Part2Question>(PART2.map((q) => [q.id, q]));

export function kindOf(questionId: string): QuestionKind {
  return questionId.startsWith("p5-") ? "p5" : "p2";
}

export function getQuestion(questionId: string): Question | undefined {
  return kindOf(questionId) === "p5" ? PART5_BY_ID.get(questionId) : PART2_BY_ID.get(questionId);
}

/** Short, natural sentences that work well for dictation drills. */
export const DICTATION_SENTENCES: readonly string[] = [
  ...WORDS.map((w) => w.example),
  ...PART2.map((q) => q.prompt),
];

export const KIND_LABELS: Record<QuestionKind | "dict", string> = {
  p5: "Part 5 · Điền vào chỗ trống",
  p2: "Part 2 · Hỏi – đáp",
  dict: "Nghe chép chính tả",
};
