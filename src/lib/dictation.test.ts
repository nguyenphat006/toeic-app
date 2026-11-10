import { describe, expect, test } from "vitest";

import { DICTATION_PASS, diffDictation } from "./dictation";

describe("diffDictation", () => {
  test("exact match ignoring case and punctuation scores 1", () => {
    const r = diffDictation("Please keep your receipt.", "please keep your receipt");
    expect(r.score).toBe(1);
    expect(r.tokens.every((t) => t.hit)).toBe(true);
  });

  test("one missing word only marks that word, not the rest", () => {
    const r = diffDictation("Please return the keys to the front desk.", "please return keys to the front desk");
    expect(r.tokens.filter((t) => !t.hit).map((t) => t.text)).toEqual(["the"]);
    expect(r.score).toBeCloseTo(7 / 8);
    expect(r.score >= DICTATION_PASS).toBe(true);
  });

  test("keeps original punctuation in the returned tokens", () => {
    expect(diffDictation("I'd like a ticket.", "id like a ticket").tokens.map((t) => t.text)).toEqual(["I'd", "like", "a", "ticket."]);
  });

  test("apostrophe variants match", () => {
    expect(diffDictation("It's ready.", "it’s ready").score).toBe(1);
  });

  test("empty input scores 0", () => {
    expect(diffDictation("Our office is on the fifth floor.", "   ").score).toBe(0);
  });

  test("symbol-only tokens do not count against the learner", () => {
    const r = diffDictation("Sales went up - a lot.", "sales went up a lot");
    expect(r.score).toBe(1);
  });
});
