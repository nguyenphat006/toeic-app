"use client";

import { useEffect, useRef, useState } from "react";

import { addStudySeconds } from "@/lib/repo";

const FLUSH_EVERY = 5;

/**
 * Counts study seconds while the tab is visible and adds them to today's total
 * in small batches, so closing the tab loses at most a few seconds.
 */
export function useStudyClock(initialSeconds: number, running: boolean) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const pending = useRef(0);

  useEffect(() => {
    if (!running) return;
    const flush = () => {
      const n = pending.current;
      pending.current = 0;
      void addStudySeconds(n);
    };
    const id = setInterval(() => {
      if (document.hidden) return;
      setSeconds((s) => s + 1);
      pending.current++;
      if (pending.current >= FLUSH_EVERY) flush();
    }, 1000);
    const onHide = () => {
      if (document.hidden) flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [running]);

  return seconds;
}
