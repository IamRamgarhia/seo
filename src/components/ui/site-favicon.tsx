"use client";

/**
 * Renders a site's actual favicon as the client / site avatar. Falls
 * back to the gradient-circle-with-letter when the icon fails to load.
 *
 * Source: Google's public favicon service (s2/favicons). Works even
 * when the destination site blocks hotlinking, no API key required,
 * cached by Google's CDN globally. Default 32×32, scaled up via CSS.
 */

import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  url: string;
  /** Used for the letter fallback */
  name: string;
  /** Pixel size of the rendered tile (default 48) */
  size?: number;
  /** Optional extra classes for the container */
  className?: string;
};

function hostnameOf(url: string): string | null {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname;
  } catch {
    return null;
  }
}

export function SiteFavicon({ url, name, size = 48, className }: Props) {
  const [failed, setFailed] = useState(false);
  const host = hostnameOf(url);
  // Request 2× the rendered size for sharpness on hi-DPI screens.
  // s2 supports 16/32/64/128/256 — we ask for 128 and let CSS scale.
  const src = host
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`
    : null;

  // Letter fallback when no URL or image failed to load
  if (!src || failed) {
    return (
      <div
        style={{ width: size, height: size }}
        className={cn(
          "grid place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 font-semibold text-white ring-1 ring-inset ring-white/20",
          className,
        )}
      >
        {(name?.slice(0, 1) ?? "?").toUpperCase()}
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "grid place-items-center overflow-hidden rounded-xl border border-border bg-muted/40",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} favicon`}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ width: size * 0.7, height: size * 0.7 }}
        className="rounded"
      />
    </div>
  );
}
