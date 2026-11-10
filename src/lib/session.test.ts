import { describe, expect, test } from "vitest";

import { seededRng } from "./random";
import {
  buildDailyQueue,
  MAX_REDO_PER_SESSION,
  MAX_REVIEWS_PER_SESSION,
  pickQuestions,
  REPEAT_GAP,
  requeueForgotten,
  type DailyQueueInput,
  type SessionItem,
} from "./session";

const ids = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${String(i + 1).padStart(2, "0")}`);

const base: DailyQueueInput = {
  dueWordIds: [],
  unseenWordIds: ids("w", 30),
  part5: ids("p5-", 20).map((id, i) => ({ id, level: i < 10 ? 1 : 2 })),
  part2: ids("p2-", 10).map((id) => ({ id })),
  seen: {},
  openMistakes: [],
  newPerDay: 8,
  quizPerDay: 10,
  maxLevel: 1,
  rng: seededRng(1),
};

const countType = (q: SessionItem[], t: SessionItem["type"]) => q.filter((i) => i.type === t).length;

describe("buildDailyQueue", () => {
  test("orders reviews, then new words, then Part 5, then Part 2", () => {
    const q = buildDailyQueue({ ...base, dueWordIds: ["old1", "old2"] });
    expect(q.map((i) => i.type)).toEqual([...Array(10).fill("card"), ...Array(6).fill("p5"), ...Array(4).fill("p2")]);
    expect(q.slice(0, 2).every((i) => i.type === "card" && !i.isNew)).toBe(true);
  });

  test("caps due reviews per session", () => {
    const q = buildDailyQueue({ ...base, dueWordIds: ids("d", 50), newPerDay: 0 });
    expect(countType(q, "card")).toBe(MAX_REVIEWS_PER_SESSION);
  });

  test("respects the Part 5 level gate", () => {
    const q = buildDailyQueue(base);
    const p5 = q.filter((i) => i.type === "p5").map((i) => (i.type === "p5" ? i.questionId : ""));
    expect(p5.every((id) => Number(id.slice(3)) <= 10)).toBe(true);
  });

  test("adds the most-missed open mistakes not already in today's quiz", () => {
    const q = buildDailyQueue({
      ...base,
      part5: [{ id: "p5-01", level: 1 }],
      quizPerDay: 1,
      part2: [],
      openMistakes: [
        { questionId: "p5-01", count: 9 },
        { questionId: "p2-03", count: 5 },
        { questionId: "p2-04", count: 1 },
        { questionId: "p2-05", count: 3 },
        { questionId: "p2-06", count: 4 },
      ],
    });
    const redo = q.filter((i) => (i.type === "p5" || i.type === "p2") && i.redo).map((i) => (i.type !== "card" && i.type !== "dict" ? i.questionId : ""));
    expect(redo).toEqual(["p2-03", "p2-06", "p2-05"]);
    expect(redo).toHaveLength(MAX_REDO_PER_SESSION);
  });

  test("shuffled option order is a permutation", () => {
    for (const item of buildDailyQueue(base)) {
      if (item.type === "p5") expect([...item.order].sort()).toEqual([0, 1, 2, 3]);
      if (item.type === "p2") expect([...item.order].sort()).toEqual([0, 1, 2]);
    }
  });

  test("no unseen words left → no new cards, quiz still built", () => {
    const q = buildDailyQueue({ ...base, unseenWordIds: [] });
    expect(countType(q, "card")).toBe(0);
    expect(q).toHaveLength(10);
  });
});

describe("pickQuestions", () => {
  test("prefers least-seen questions", () => {
    const picked = pickQuestions(
      [{ id: "a" }, { id: "b" }, { id: "c" }],
      2,
      { a: 3, b: 0, c: 1 },
      { rng: seededRng(7) },
    );
    expect(picked.map((p) => p.id)).toEqual(["b", "c"]);
  });

  test("never returns more than available", () => {
    expect(pickQuestions([{ id: "a" }], 5, {})).toHaveLength(1);
  });
});

describe("requeueForgotten", () => {
  const queue: SessionItem[] = ids("w", 6).map((wordId) => ({ type: "card", wordId, isNew: true }));

  test("shows a forgotten card again a few steps later", () => {
    const next = requeueForgotten(queue, 0);
    expect(next).toHaveLength(7);
    expect(next[REPEAT_GAP]).toMatchObject({ type: "card", wordId: "w01", repeat: true, isNew: false });
  });

  test("only repeats once per session", () => {
    const once = requeueForgotten(queue, 0);
    expect(requeueForgotten(once, REPEAT_GAP)).toHaveLength(7);
  });

  test("near the end it goes last", () => {
    const next = requeueForgotten(queue, 5);
    expect(next.at(-1)).toMatchObject({ wordId: "w06", repeat: true });
  });
});
