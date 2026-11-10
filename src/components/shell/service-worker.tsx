"use client";

import { useEffect } from "react";

/** Registers the offline cache in production builds only; in dev it would serve stale bundles. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is a progressive enhancement; the app works without it.
    });
  }, []);
  return null;
}
