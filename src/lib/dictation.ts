export interface DiffToken {
  text: string;
  hit: boolean;
}

export interface DictationResult {
  tokens: DiffToken[];
  /** Share of target words the learner typed correctly, 0–1. */
  score: number;
}

/** A dictation attempt passes when at least this share of words is right. */
export const DICTATION_PASS = 0.8;

const normalize = (word: string) => word.toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z0-9']/g, "");

/**
 * Marks each word of `target` as typed or missed, using the longest common
 * subsequence so one missing word does not shift every word after it.
 * Punctuation is ignored for matching but kept in the returned tokens.
 */
export function diffDictation(target: string, typed: string): DictationResult {
  const display = target.split(/\s+/).filter(Boolean);
  const a = display.map(normalize);
  const b = typed.split(/\s+/).map(normalize).filter(Boolean);

  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i]![j] = a[i] === b[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }

  const hit = a.map((w) => w === "");
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === "") {
      i++;
    } else if (a[i] === b[j]) {
      hit[i] = true;
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      i++;
    } else {
      j++;
    }
  }

  const counted = a.filter((w) => w !== "").length;
  const correct = a.filter((w, k) => w !== "" && hit[k]).length;
  return {
    tokens: display.map((text, k) => ({ text, hit: hit[k] ?? false })),
    score: counted ? correct / counted : 0,
  };
}
