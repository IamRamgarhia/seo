/**
 * Client-side error sink. The browser's global error trap (in
 * <ClientErrorCapture />) POSTs here when window.onerror or
 * unhandledrejection fires. Dedupes via the same (source, context,
 * message) tuple as server errors.
 */

import { logError } from "@/lib/error-log";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: {
    message?: string;
    stack?: string;
    url?: string;
    userAgent?: string;
    context?: string;
  } | null = null;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  if (!body?.message) {
    return Response.json({ ok: false, error: "no message" }, { status: 400 });
  }
  // Synthesize an Error so the helper extracts cleanly
  const synthetic = new Error(body.message);
  if (body.stack) synthetic.stack = body.stack;
  await logError({
    source: "client",
    context: body.context?.slice(0, 200) ?? "browser",
    error: synthetic,
    url: body.url ?? null,
    userAgent: body.userAgent ?? null,
  });
  return Response.json({ ok: true });
}
