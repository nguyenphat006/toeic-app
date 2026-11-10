import { describe, expect, test } from "vitest";

import { computeStreak } from "./streak";

const today = new Date(2026, 10, 10, 9, 0);

describe("computeStreak", () => {
  test("no days → 0", () => {
    expect(computeStreak([], today)).toBe(0);
  });

  test("counts back from today when today is done", () => {
    const days = ["2026-11-08", "2026-11-09", "2026-11-10"].map((date) => ({ date, done: true }));
    expect(computeStreak(days, today)).toBe(3);
  });

  test("today not done yet keeps yesterday's streak", () => {
    const days = [
      { date: "2026-11-09", done: true },
      { date: "2026-11-10", done: false },
    ];
    expect(computeStreak(days, today)).toBe(1);
  });

  test("a gap breaks the streak", () => {
    const days = ["2026-11-06", "2026-11-07", "2026-11-09", "2026-11-10"].map((date) => ({ date, done: true }));
    expect(computeStreak(days, today)).toBe(2);
  });

  test("crosses month boundaries", () => {
    const d = new Date(2026, 11, 1, 8);
    const days = ["2026-11-29", "2026-11-30", "2026-12-01"].map((date) => ({ date, done: true }));
    expect(computeStreak(days, d)).toBe(3);
  });
});
