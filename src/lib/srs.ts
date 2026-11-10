import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from "ts-fsrs";

/** Four self-ratings shown under a flipped card, in FSRS terms. */
export const GRADES = [
  { grade: Rating.Again, label: "Quên", tone: "danger" },
  { grade: Rating.Hard, label: "Khó", tone: "sun" },
  { grade: Rating.Good, label: "Nhớ", tone: "brand" },
  { grade: Rating.Easy, label: "Dễ", tone: "brand" },
] as const satisfies readonly { grade: Grade; label: string; tone: string }[];

/** A card counts as "known" once its memory is expected to last three weeks. */
export const KNOWN_STABILITY_DAYS = 21;

const scheduler = fsrs(generatorParameters({ enable_fuzz: true, request_retention: 0.9 }));

export function newCard(now: Date = new Date()): Card {
  return createEmptyCard(now);
}

export function review(card: Card, grade: Grade, now: Date = new Date()): Card {
  return scheduler.next(card, now, grade).card;
}

/** Time until the next review for each grade, used to label the buttons. */
export function previewIntervals(card: Card, now: Date = new Date()): Record<Grade, number> {
  const preview = scheduler.repeat(card, now);
  const out = {} as Record<Grade, number>;
  for (const { grade } of GRADES) out[grade] = preview[grade].card.due.getTime() - now.getTime();
  return out;
}

export type CardStatus = "new" | "learning" | "known";

export function cardStatus(card: Card | undefined): CardStatus {
  if (!card || card.state === State.New) return "new";
  return card.state === State.Review && card.stability >= KNOWN_STABILITY_DAYS ? "known" : "learning";
}

export function isDue(card: Card, now: Date = new Date()): boolean {
  return new Date(card.due).getTime() <= now.getTime();
}

export { Rating };
export type { Card, Grade };
