import "fake-indexeddb/auto";

import { beforeEach, describe, expect, test } from "vitest";

import { dayKey } from "./dates";
import { db, DEFAULT_SETTINGS } from "./db";
import {
  BackupError,
  exportBackup,
  getSettings,
  importBackup,
  rateWord,
  recordAnswer,
  saveSession,
  startDailySession,
  updateSetting,
} from "./repo";
import { Rating } from "./srs";

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe("rateWord", () => {
  test("first rating creates the card and counts a new word for today", async () => {
    await rateWord("office", Rating.Good);
    const row = await db.cards.get("office");
    expect(row?.card.reps).toBe(1);
    expect(row!.card.due.getTime()).toBeGreaterThan(Date.now());
    expect((await db.days.get(dayKey()))?.newWords).toBe(1);
  });

  test("rating again does not count the word as new twice", async () => {
    await rateWord("office", Rating.Good);
    await rateWord("office", Rating.Good);
    expect((await db.days.get(dayKey()))?.newWords).toBe(1);
  });
});

describe("recordAnswer", () => {
  test("a wrong answer opens a mistake, a correct redo closes it", async () => {
    await recordAnswer("p5-02", false, false);
    expect(await db.mistakes.get("p5-02")).toMatchObject({ count: 1, fixed: 0, tag: "word_form", kind: "p5" });

    await recordAnswer("p5-02", true, true);
    expect((await db.mistakes.get("p5-02"))?.fixed).toBe(1);
    expect(await db.attempts.count()).toBe(2);
    expect((await db.days.get(dayKey()))?.questions).toBe(2);
  });

  test("a correct answer outside redo leaves an open mistake open", async () => {
    await recordAnswer("p2-01", false, false);
    await recordAnswer("p2-01", true, false);
    expect((await db.mistakes.get("p2-01"))?.fixed).toBe(0);
  });

  test("unknown question ids are ignored", async () => {
    await recordAnswer("p5-999", false, false);
    expect(await db.attempts.count()).toBe(0);
  });
});

describe("daily session", () => {
  test("first session has new words then 10 questions", async () => {
    const s = await startDailySession();
    expect(s.queue.filter((i) => i.type === "card")).toHaveLength(DEFAULT_SETTINGS.newPerDay);
    expect(s.queue.filter((i) => i.type !== "card")).toHaveLength(DEFAULT_SETTINGS.quizPerDay);
  });

  test("finishing a daily session marks the day done", async () => {
    const s = await startDailySession();
    await saveSession({ ...s, index: s.queue.length, finished: true });
    expect((await db.days.get(dayKey()))?.done).toBe(true);
  });
});

describe("settings", () => {
  test("values are clamped to their limits", async () => {
    await updateSetting("newPerDay", 999);
    await updateSetting("speechRate", 0.1);
    const s = await getSettings();
    expect(s.newPerDay).toBe(20);
    expect(s.speechRate).toBe(0.5);
  });
});

describe("backup", () => {
  test("export → import round-trips cards with real dates", async () => {
    await rateWord("budget", Rating.Good);
    await recordAnswer("p5-03", false, false);
    const json = await exportBackup();

    await Promise.all(db.tables.map((t) => t.clear()));
    await importBackup(json);

    const row = await db.cards.get("budget");
    expect(row?.card.due).toBeInstanceOf(Date);
    expect(await db.mistakes.count()).toBe(1);
  });

  test("rejects files that are not a backup", async () => {
    await expect(importBackup("{}")).rejects.toBeInstanceOf(BackupError);
    await expect(importBackup("not json")).rejects.toBeInstanceOf(BackupError);
  });
});
