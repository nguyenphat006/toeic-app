const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar day as `YYYY-MM-DD` — study days follow the learner's clock, not UTC. */
export function dayKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Monday of the week containing `date`. */
export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return addDays(d, -((d.getDay() + 6) % 7));
}

export const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)} phút`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.round(hours / 24);
  if (days < 31) return `${days} ngày`;
  const months = Math.round(days / 30);
  return `${months} tháng`;
}
