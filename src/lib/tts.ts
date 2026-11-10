"use client";

/**
 * Thin wrapper over the browser's speech synthesis. Every call to `play`
 * cancels whatever was playing, so stale audio never overlaps a new screen.
 */
export interface SpeechPart {
  text: string;
  /** 0 = main narrator, 1 = second voice (a different accent when available). */
  voice?: 0 | 1;
  slow?: boolean;
  /** Pause after this part, ms. */
  pauseAfter?: number;
}

let voices: SpeechSynthesisVoice[] = [];
let token = 0;

const supported = () => typeof window !== "undefined" && "speechSynthesis" in window;

function rankVoice(v: SpeechSynthesisVoice): number {
  const accent = /en[-_]US/i.test(v.lang) ? 0 : /en[-_]GB/i.test(v.lang) ? 1 : /en[-_]AU/i.test(v.lang) ? 2 : 3;
  const quality = /natural|online|google|premium|enhanced/i.test(v.name) ? -0.5 : 0;
  return accent + quality;
}

function loadVoices() {
  if (!supported()) return;
  voices = speechSynthesis
    .getVoices()
    .filter((v) => /^en[-_]/i.test(v.lang))
    .sort((a, b) => rankVoice(a) - rankVoice(b));
}

if (supported()) {
  loadVoices();
  speechSynthesis.addEventListener("voiceschanged", loadVoices);
}

function pickVoice(index: 0 | 1): SpeechSynthesisVoice | undefined {
  const main = voices[0];
  if (index === 0 || !main) return main;
  return voices.find((v) => v.lang !== main.lang) ?? voices[1] ?? main;
}

function speakOne(part: SpeechPart, rate: number): Promise<void> {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(part.text);
    const voice = pickVoice(part.voice ?? 0);
    u.lang = voice?.lang ?? "en-US";
    if (voice) u.voice = voice;
    u.rate = part.slow ? Math.min(rate, 0.7) : rate;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function isSpeechSupported(): boolean {
  return supported();
}

export function stopSpeech() {
  token++;
  if (supported()) speechSynthesis.cancel();
}

/** Plays parts in order. Resolves `true` if it finished, `false` if interrupted. */
export async function play(parts: readonly SpeechPart[], rate: number): Promise<boolean> {
  if (!supported()) return false;
  stopSpeech();
  const mine = token;
  for (const part of parts) {
    if (mine !== token) return false;
    await speakOne(part, rate);
    if (mine !== token) return false;
    await wait(part.pauseAfter ?? 400);
  }
  return mine === token;
}
