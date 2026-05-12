"use client";

/**
 * Reads the URL search params; when `?embed=1` is present, applies a
 * data attribute on <html> that the global stylesheet uses to hide
 * the shell chrome (main sidebar + top bar + ambient widgets) so the
 * page can be safely loaded inside an iframe without duplicate UI.
 *
 * Bound to `useSearchParams` so navigations within an embedded session
 * keep the chrome hidden / restored consistently.
 */

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function EmbedModeToggle() {
  const params = useSearchParams();
  useEffect(() => {
    const isEmbed = params?.get("embed") === "1";
    if (isEmbed) {
      document.documentElement.dataset.embed = "1";
    } else if (document.documentElement.dataset.embed) {
      delete document.documentElement.dataset.embed;
    }
  }, [params]);
  return null;
}
