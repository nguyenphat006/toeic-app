import { addDays, dayKey } from "./dates";

export interface DayLike {
  date: string;
  done: boolean;
}

/**
 * Consecutive finished days ending today — or ending yesterday when today's
 * session is not done yet, so the streak does not read 0 every morning.
 */
export function computeStreak(days: readonly DayLike[], today: Date = new Date()): number {
  const done = new Set(days.filter((d) => d.done).map((d) => d.date));
  let cursor = done.has(dayKey(today)) ? today : addDays(today, -1);
  let count = 0;
  while (done.has(dayKey(cursor))) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}
