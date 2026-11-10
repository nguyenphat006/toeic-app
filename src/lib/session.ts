import { shuffle, type Rng } from "./random";

export type SessionMode = "daily" | "practice";

export type SessionItem =
  | { type: "card"; wordId: string; isNew: boolean; repeat?: boolean }
  | { type: "p5"; questionId: string; order: number[]; redo?: boolean }
  | { type: "p2"; questionId: string; order: number[]; redo?: boolean }
  | { type: "dict"; text: string };

export interface Session {
  id: "current";
  date: string;
  mode: SessionMode;
  queue: SessionItem[];
  index: number;
  seconds: number;
  right: number;
  wrong: number;
  cardsReviewed: number;
  finished: boolean;
}

export const MAX_REVIEWS_PER_SESSION = 20;
export const MAX_REDO_PER_SESSION = 3;
/** Share of the daily quiz given to Part 5; the rest is Part 2 listening. */
export const PART5_SHARE = 0.6;
/** Part 5 items above level 1 unlock once the learner has started this many words. */
export const LEVEL_2_WORD_THRESHOLD = 40;

export interface QuestionCandidate {
  id: string;
  level?: number;
}

/** Least-seen first, then easiest first; ties broken randomly so sessions vary. */
export function pickQuestions(
  candidates: readonly QuestionCandidate[],
  count: number,
  seen: Readonly<Record<string, number>>,
  { maxLevel, rng = Math.random, exclude }: { maxLevel?: number; rng?: Rng; exclude?: ReadonlySet<string> } = {},
): QuestionCandidate[] {
  return shuffle(candidates, rng)
    .filter((q) => (maxLevel === undefined || (q.level ?? 1) <= maxLevel) && !exclude?.has(q.id))
    .sort((a, b) => (seen[a.id] ?? 0) - (seen[b.id] ?? 0) || (a.level ?? 1) - (b.level ?? 1))
    .slice(0, Math.max(0, count));
}

export const optionOrder = (n: number, rng: Rng = Math.random) => shuffle(Array.from({ length: n }, (_, i) => i), rng);

export const questionItem = (id: string, rng: Rng = Math.random, redo = false): SessionItem =>
  id.startsWith("p5-")
    ? { type: "p5", questionId: id, order: optionOrder(4, rng), redo }
    : { type: "p2", questionId: id, order: optionOrder(3, rng), redo };

export interface DailyQueueInput {
  dueWordIds: readonly string[];
  unseenWordIds: readonly string[];
  part5: readonly QuestionCandidate[];
  part2: readonly QuestionCandidate[];
  seen: Readonly<Record<string, number>>;
  openMistakes: readonly { questionId: string; count: number }[];
  newPerDay: number;
  quizPerDay: number;
  maxLevel: number;
  rng?: Rng;
}

/** Daily order: due reviews → new words → Part 5 + Part 2 → redo of past mistakes. */
export function buildDailyQueue(input: DailyQueueInput): SessionItem[] {
  const rng = input.rng ?? Math.random;
  const queue: SessionItem[] = [];

  input.dueWordIds.slice(0, MAX_REVIEWS_PER_SESSION).forEach((wordId) => queue.push({ type: "card", wordId, isNew: false }));
  input.unseenWordIds.slice(0, input.newPerDay).forEach((wordId) => queue.push({ type: "card", wordId, isNew: true }));

  const p5Count = Math.round(input.quizPerDay * PART5_SHARE);
  const used = new Set<string>();
  for (const q of pickQuestions(input.part5, p5Count, input.seen, { maxLevel: input.maxLevel, rng })) {
    used.add(q.id);
    queue.push(questionItem(q.id, rng));
  }
  for (const q of pickQuestions(input.part2, input.quizPerDay - p5Count, input.seen, { rng })) {
    used.add(q.id);
    queue.push(questionItem(q.id, rng));
  }

  input.openMistakes
    .filter((m) => !used.has(m.questionId))
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_REDO_PER_SESSION)
    .forEach((m) => queue.push(questionItem(m.questionId, rng, true)));

  return queue;
}

/** Where a forgotten card is shown again within the same session. */
export const REPEAT_GAP = 4;

export function requeueForgotten(queue: readonly SessionItem[], index: number): SessionItem[] {
  const item = queue[index];
  if (!item || item.type !== "card" || item.repeat) return queue.slice();
  const next = queue.slice();
  next.splice(Math.min(index + REPEAT_GAP, next.length), 0, { ...item, isNew: false, repeat: true });
  return next;
}
