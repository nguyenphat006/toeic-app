import Dexie, { type Table } from "dexie";
import type { Card } from "ts-fsrs";

import type { QuestionKind, QuestionTag } from "@/content";
import type { Session } from "./session";

export interface CardRow {
  wordId: string;
  card: Card;
  firstSeenAt: number;
}

export interface AttemptRow {
  id?: number;
  questionId: string;
  kind: QuestionKind | "dict";
  tag?: QuestionTag;
  correct: boolean;
  redo: boolean;
  at: number;
}

/** IndexedDB cannot index booleans, so open/closed is stored as 0 / 1. */
export interface MistakeRow {
  questionId: string;
  kind: QuestionKind;
  tag: QuestionTag;
  count: number;
  fixed: 0 | 1;
  lastAt: number;
}

export interface DayRow {
  date: string;
  seconds: number;
  newWords: number;
  questions: number;
  done: boolean;
}

export interface Settings {
  id: "settings";
  newPerDay: number;
  quizPerDay: number;
  goalMinutes: number;
  speechRate: number;
}

export const DEFAULT_SETTINGS: Settings = {
  id: "settings",
  newPerDay: 8,
  quizPerDay: 10,
  goalMinutes: 15,
  speechRate: 0.9,
};

export const SETTING_LIMITS = {
  newPerDay: { min: 3, max: 20, step: 1 },
  quizPerDay: { min: 4, max: 30, step: 2 },
  goalMinutes: { min: 5, max: 60, step: 5 },
  speechRate: { min: 0.5, max: 1.2, step: 0.1 },
} as const satisfies Record<Exclude<keyof Settings, "id">, { min: number; max: number; step: number }>;

export class StudyDatabase extends Dexie {
  cards!: Table<CardRow, string>;
  attempts!: Table<AttemptRow, number>;
  mistakes!: Table<MistakeRow, string>;
  days!: Table<DayRow, string>;
  settings!: Table<Settings, string>;
  sessions!: Table<Session, string>;

  constructor(name = "toeic-xanh") {
    super(name);
    this.version(1).stores({
      cards: "&wordId, card.due",
      attempts: "++id, questionId, kind, at",
      mistakes: "&questionId, fixed, tag",
      days: "&date",
      settings: "&id",
      sessions: "&id",
    });
  }
}

export const db = new StudyDatabase();
