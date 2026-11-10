"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isSpeechSupported, play, stopSpeech, type SpeechPart } from "@/lib/tts";

/** Plays a list of speech parts, tracks "playing" for the UI, stops on unmount. */
export function usePlayer(rate: number) {
  const [playing, setPlaying] = useState(false);
  const run = useRef(0);

  const start = useCallback(
    async (parts: readonly SpeechPart[]) => {
      const mine = ++run.current;
      setPlaying(true);
      await play(parts, rate);
      // A newer playback may have started meanwhile; only the latest one clears the flag.
      if (mine === run.current) setPlaying(false);
    },
    [rate],
  );

  const stop = useCallback(() => {
    run.current++;
    stopSpeech();
    setPlaying(false);
  }, []);

  useEffect(() => () => stopSpeech(), []);

  return { playing, start, stop, supported: isSpeechSupported() };
}
