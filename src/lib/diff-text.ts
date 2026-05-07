/**
 * Pure text diffing — safe for client components (no Node deps).
 */

export type DiffLine = { kind: "added" | "removed" | "context"; text: string };

export function diffSnapshots(prev: string, next: string): DiffLine[] {
  const prevLines = prev.split(/\r?\n/);
  const nextLines = next.split(/\r?\n/);
  const prevSet = new Set(prevLines);
  const nextSet = new Set(nextLines);

  const out: DiffLine[] = [];
  const all = Array.from(new Set([...prevLines, ...nextLines]));
  for (const line of all) {
    if (prevSet.has(line) && nextSet.has(line)) {
      out.push({ kind: "context", text: line });
    } else if (nextSet.has(line)) {
      out.push({ kind: "added", text: line });
    } else {
      out.push({ kind: "removed", text: line });
    }
  }
  return out;
}
