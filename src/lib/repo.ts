import { DICTATION_SENTENCES, PART2, PART5, WORDS, getQuestion, kindOf, type QuestionTag } from "@/content";

import { dayKey } from "./dates";
import { db, DEFAULT_SETTINGS, SETTING_LIMITS, type CardRow, type DayRow, type Settings } from "./db";
import { shuffle } from "./random";
import {
  buildDailyQueue,
  LEVEL_2_WORD_THRESHOLD,
  pickQuestions,
  questionItem,
  type Session,
  type SessionItem,
  type SessionMode,
} from "./session";
import { isDue, newCard, review, type Card, type Grade } from "./srs";

// ---------- settings ----------

export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await db.settings.get("settings")) };
}

export async function updateSetting(key: keyof typeof SETTING_LIMITS, value: number) {
  const { min, max } = SETTING_LIMITS[key];
  const clamped = Math.round(Math.min(max, Math.max(min, value)) * 10) / 10;
  await db.settings.put({ ...(await getSettings()), [key]: clamped });
}

// ---------- study days ----------

const emptyDay = (date: string): DayRow => ({ date, seconds: 0, newWords: 0, questions: 0, done: false });

async function bumpDay(change: (day: DayRow) => void, date = dayKey()) {
  await db.transaction("rw", db.days, async () => {
    const day = (await db.days.get(date)) ?? emptyDay(date);
    change(day);
    await db.days.put(day);
  });
}

/** Adds study time to today's total. The session's own clock is saved with the session. */
export async function addStudySeconds(seconds: number) {
  if (seconds <= 0) return;
  await bumpDay((d) => {
    d.seconds += seconds;
  });
}

// ---------- vocabulary ----------

export async function rateWord(wordId: string, grade: Grade) {
  await db.transaction("rw", db.cards, db.days, async () => {
    const existing = await db.cards.get(wordId);
    const now = new Date();
    const card = review(existing?.card ?? newCard(now), grade, now);
    await db.cards.put({ wordId, card, firstSeenAt: existing?.firstSeenAt ?? now.getTime() });
    if (!existing) {
      await bumpDay((d) => {
        d.newWords++;
      });
    }
  });
}

// ---------- answers ----------

export async function recordAnswer(questionId: string, correct: boolean, redo: boolean) {
  const question = getQuestion(questionId);
  if (!question) return;
  const kind = kindOf(questionId);
  const now = Date.now();
  await db.transaction("rw", db.attempts, db.mistakes, db.days, async () => {
    await db.attempts.add({ questionId, kind, tag: question.tag, correct, redo, at: now });
    const mistake = await db.mistakes.get(questionId);
    if (!correct) {
      await db.mistakes.put({ questionId, kind, tag: question.tag, count: (mistake?.count ?? 0) + 1, fixed: 0, lastAt: now });
    } else if (mistake && redo) {
      await db.mistakes.update(questionId, { fixed: 1 });
    }
    await bumpDay((d) => {
      d.questions++;
    });
  });
}

export async function recordDictation(correct: boolean) {
  await db.transaction("rw", db.attempts, db.days, async () => {
    await db.attempts.add({ questionId: "dict", kind: "dict", correct, redo: false, at: Date.now() });
    await bumpDay((d) => {
      d.questions++;
    });
  });
}

// ---------- sessions ----------

async function seenCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  await db.attempts.each((a) => {
    counts[a.questionId] = (counts[a.questionId] ?? 0) + 1;
  });
  return counts;
}

async function writeSession(queue: SessionItem[], mode: SessionMode) {
  const session: Session = {
    id: "current",
    date: dayKey(),
    mode,
    queue,
    index: 0,
    seconds: 0,
    right: 0,
    wrong: 0,
    cardsReviewed: 0,
    finished: false,
  };
  await db.sessions.put(session);
  return session;
}

export async function startDailySession() {
  const [settings, cards, mistakes, seen] = await Promise.all([
    getSettings(),
    db.cards.toArray(),
    db.mistakes.where("fixed").equals(0).toArray(),
    seenCounts(),
  ]);
  const started = new Set(cards.map((c) => c.wordId));
  const now = new Date();
  const queue = buildDailyQueue({
    dueWordIds: cards
      .filter((c) => isDue(c.card, now))
      .sort((a, b) => new Date(a.card.due).getTime() - new Date(b.card.due).getTime())
      .map((c) => c.wordId),
    unseenWordIds: WORDS.filter((w) => !started.has(w.id)).map((w) => w.id),
    part5: PART5.map((q) => ({ id: q.id, level: q.level })),
    part2: PART2.map((q) => ({ id: q.id })),
    seen,
    openMistakes: mistakes.map((m) => ({ questionId: m.questionId, count: m.count })),
    newPerDay: settings.newPerDay,
    quizPerDay: settings.quizPerDay,
    maxLevel: started.size >= LEVEL_2_WORD_THRESHOLD ? 2 : 1,
  });
  return writeSession(queue, "daily");
}

export type PracticeKind = "p5" | "p2" | "dict" | "cards";

export async function startPractice(kind: PracticeKind): Promise<Session | null> {
  let queue: SessionItem[] = [];
  if (kind === "p5" || kind === "p2") {
    const pool = kind === "p5" ? PART5.map((q) => ({ id: q.id, level: q.level })) : PART2.map((q) => ({ id: q.id }));
    queue = pickQuestions(pool, 10, await seenCounts()).map((q) => questionItem(q.id));
  } else if (kind === "dict") {
    queue = shuffle(DICTATION_SENTENCES).slice(0, 8).map((text) => ({ type: "dict", text }));
  } else {
    const cards = await db.cards.toArray();
    queue = cards
      .sort((a, b) => b.card.lapses - a.card.lapses || a.card.stability - b.card.stability)
      .slice(0, 15)
      .map((c) => ({ type: "card", wordId: c.wordId, isNew: false }));
  }
  return queue.length ? writeSession(queue, "practice") : null;
}

export async function startRedo(tag: QuestionTag): Promise<Session | null> {
  const open = await db.mistakes.where("fixed").equals(0).filter((m) => m.tag === tag).toArray();
  const queue = open
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((m) => questionItem(m.questionId, Math.random, true));
  return queue.length ? writeSession(queue, "practice") : null;
}

export async function saveSession(session: Session) {
  await db.transaction("rw", db.sessions, db.days, async () => {
    await db.sessions.put(session);
    if (session.finished && session.mode === "daily") {
      await bumpDay((d) => {
        d.done = true;
      }, session.date);
    }
  });
}

export async function clearSession() {
  await db.sessions.delete("current");
}

// ---------- backup ----------

const BACKUP_VERSION = 1;

export async function exportBackup(): Promise<string> {
  const [cards, attempts, mistakes, days, settings] = await Promise.all([
    db.cards.toArray(),
    db.attempts.toArray(),
    db.mistakes.toArray(),
    db.days.toArray(),
    db.settings.toArray(),
  ]);
  return JSON.stringify({ app: "toeic-xanh", version: BACKUP_VERSION, exportedAt: new Date().toISOString(), cards, attempts, mistakes, days, settings });
}

export class BackupError extends Error {}

const reviveCard = (card: Card): Card => ({
  ...card,
  due: new Date(card.due),
  last_review: card.last_review ? new Date(card.last_review) : undefined,
});

export async function importBackup(text: string) {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new BackupError("File không phải JSON hợp lệ.");
  }
  if (typeof data !== "object" || data === null || (data as { app?: unknown }).app !== "toeic-xanh") {
    throw new BackupError("File này không phải bản sao lưu của TOEIC Xanh.");
  }
  const b = data as {
    cards?: CardRow[];
    attempts?: never[];
    mistakes?: never[];
    days?: DayRow[];
    settings?: Settings[];
  };
  if (![b.cards, b.attempts, b.mistakes, b.days].every(Array.isArray)) {
    throw new BackupError("Bản sao lưu bị thiếu dữ liệu.");
  }
  await db.transaction("rw", [db.cards, db.attempts, db.mistakes, db.days, db.settings, db.sessions], async () => {
    await Promise.all([db.cards.clear(), db.attempts.clear(), db.mistakes.clear(), db.days.clear(), db.settings.clear(), db.sessions.clear()]);
    await db.cards.bulkPut((b.cards ?? []).map((r) => ({ ...r, card: reviveCard(r.card) })));
    await db.attempts.bulkPut(b.attempts ?? []);
    await db.mistakes.bulkPut(b.mistakes ?? []);
    await db.days.bulkPut(b.days ?? []);
    if (b.settings?.length) await db.settings.bulkPut(b.settings);
  });
}
