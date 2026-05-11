/**
 * Restart the local server. Spawns a detached launcher that waits for the
 * current process to die, then starts a fresh one. Browser is told to
 * poll-and-reload so the user just sees a quick flicker.
 *
 * Only works for native installs (the seo.cmd launcher must exist).
 * Docker users get a polite error pointing at `docker compose restart`.
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { existsSync } from "node:fs";

export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.RUNNING_IN_DOCKER === "1") {
    return Response.json(
      {
        ok: false,
        error:
          "Inside Docker — restart with `docker compose restart` on the host.",
      },
      { status: 400 },
    );
  }

  const cwd = process.cwd();
  const isWin = process.platform === "win32";
  const launcher = path.join(cwd, isWin ? "seo.cmd" : "seo.sh");

  if (!existsSync(launcher)) {
    return Response.json(
      {
        ok: false,
        error:
          "Launcher script not found. Update to the latest version, then try again.",
      },
      { status: 500 },
    );
  }

  // Fire-and-forget: kick off the detached relaunch on a delay long
  // enough for this response to flush, then exit ourselves.
  setTimeout(() => {
    try {
      const child = isWin
        ? spawn("cmd.exe", ["/c", "start", "", "/min", launcher], {
            cwd,
            detached: true,
            stdio: "ignore",
            windowsHide: true,
          })
        : spawn("sh", [launcher], {
            cwd,
            detached: true,
            stdio: "ignore",
          });
      child.unref();
    } catch {
      // ignore — process.exit still fires below
    }
    setTimeout(() => process.exit(0), 500);
  }, 250);

  return Response.json({
    ok: true,
    message:
      "Restarting. The page will reload itself in 8–15 seconds once the server is back.",
  });
}
