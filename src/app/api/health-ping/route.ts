/**
 * Tiny liveness probe. Used by the restart flow to poll for the server
 * coming back. Intentionally does nothing DB-related so it's instant.
 */

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, t: Date.now() });
}
