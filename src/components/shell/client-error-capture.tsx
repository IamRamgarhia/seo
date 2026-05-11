"use client";

import { useEffect } from "react";

/**
 * Captures uncaught JS errors + unhandled promise rejections in the
 * browser and posts them to /api/errors so they show up in the
 * Settings → Errors log. Mounted once in the root layout.
 *
 * Rate-limited: max 1 error per second per (message) pair, max 50 per
 * session — so an infinite-loop error doesn't spam the server.
 */
export function ClientErrorCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let sentInSession = 0;
    const recent = new Map<string, number>();
    const MAX_PER_SESSION = 50;
    const COOLDOWN_MS = 1000;

    function send(payload: {
      message: string;
      stack?: string;
      context: string;
    }) {
      if (sentInSession >= MAX_PER_SESSION) return;
      const key = payload.message;
      const last = recent.get(key) ?? 0;
      const now = Date.now();
      if (now - last < COOLDOWN_MS) return;
      recent.set(key, now);
      sentInSession += 1;

      void fetch("/api/errors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...payload,
          url: window.location.pathname + window.location.search,
          userAgent: window.navigator.userAgent.slice(0, 200),
        }),
      }).catch(() => {
        // Silent — never crash the error logger
      });
    }

    function onError(e: ErrorEvent) {
      send({
        message: e.message || "Unknown window error",
        stack: e.error?.stack,
        context: `window.onerror @ ${window.location.pathname}`,
      });
    }

    function onUnhandledRejection(e: PromiseRejectionEvent) {
      const reason = e.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : (() => {
                try {
                  return JSON.stringify(reason);
                } catch {
                  return "Unknown rejection reason";
                }
              })();
      send({
        message: message || "unhandledrejection",
        stack: reason instanceof Error ? reason.stack : undefined,
        context: `unhandledrejection @ ${window.location.pathname}`,
      });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
