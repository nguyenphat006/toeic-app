import { describe, expect, test } from "vitest";

import { PART2, PART5, TAG_LABELS, TOPICS, WORDS } from "./index";

describe("content integrity", () => {
  test("word ids are unique and every word belongs to a known topic", () => {
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length);
    const topics = new Set(TOPICS.map((t) => t.id));
    expect(WORDS.every((w) => topics.has(w.topic))).toBe(true);
  });

  test("question ids are unique", () => {
    const all = [...PART5, ...PART2].map((q) => q.id);
    expect(new Set(all).size).toBe(all.length);
  });

  test("every Part 5 sentence has exactly one blank and distinct options", () => {
    for (const q of PART5) {
      expect(q.sentence.split("___"), q.id).toHaveLength(2);
      expect(new Set(q.options).size, q.id).toBe(4);
    }
  });

  test("every Part 2 item has distinct options and a meaning for each", () => {
    for (const q of PART2) {
      expect(new Set(q.options).size, q.id).toBe(3);
      expect(q.optionMeanings, q.id).toHaveLength(3);
    }
  });

  test("every tag has a Vietnamese label", () => {
    for (const q of [...PART5, ...PART2]) expect(TAG_LABELS[q.tag], q.id).toBeTruthy();
  });

  test("Part 5 answers are not all in the same slot of the source data", () => {
    expect(new Set(PART5.map((q) => q.answer)).size).toBeGreaterThan(2);
  });
});
