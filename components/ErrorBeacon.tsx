"use client";

import { useEffect } from "react";

// Invisible mount in the root layout: forwards uncaught browser errors and
// unhandled promise rejections to /api/client-errors, where the server
// console.error's them into the host logs. Best-effort by design — reporting
// must never itself throw or add load, so every path swallows failures.

// Same message not re-sent within a minute (a render-loop error would
// otherwise fire hundreds of beacons).
const DEDUPE_WINDOW_MS = 60 * 1000;
const lastSent = new Map<string, number>();

function report(message: string, url: string, line?: number) {
  const now = Date.now();
  const sentAt = lastSent.get(message);
  if (sentAt && now - sentAt < DEDUPE_WINDOW_MS) return;
  lastSent.set(message, now);

  const payload = JSON.stringify({
    message: message.slice(0, 500),
    url: url.slice(0, 500),
    line,
    userAgent: navigator.userAgent.slice(0, 300),
  });
  try {
    // sendBeacon survives page unloads; keepalive fetch is the fallback.
    if (!navigator.sendBeacon?.("/api/client-errors", new Blob([payload], { type: "application/json" }))) {
      void fetch("/api/client-errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Reporting is best-effort; never let it surface.
  }
}

export default function ErrorBeacon() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      report(event.message || "Unknown error", event.filename || location.href, event.lineno);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      report(`Unhandled rejection: ${message}`, location.href);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
