"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { portalChat, type PortalChatMessage } from "./chat-actions";

const SUGGESTIONS = [
  "How are we doing this month?",
  "What's been completed lately?",
  "Which keywords are improving?",
  "What's still in progress?",
];

export function PortalChat({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<PortalChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pending]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    const next: PortalChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(next);
    setInput("");
    setError(null);
    startTransition(async () => {
      const r = await portalChat(token, next);
      if (r.ok) {
        setMessages([...next, { role: "assistant", content: r.reply }]);
      } else {
        setError(r.error);
      }
    });
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/40 ring-1 ring-inset ring-white/30 hover:brightness-110"
        >
          <MessageCircle className="size-4" />
          Ask about progress
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-40 flex h-[560px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/95 backdrop-blur-md shadow-2xl">
          <header className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                <Bot className="size-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">SEO assistant</div>
                <div className="text-[10px] text-muted-foreground">
                  Read-only · your site only
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm"
          >
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="rounded-xl bg-white/[0.03] p-3 text-muted-foreground ring-1 ring-inset ring-white/5">
                  Hi! I can summarize what we&apos;ve been doing on your site —
                  scores, keywords, recent fixes. Try one:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full bg-white/5 px-3 py-1 text-xs text-violet-200 ring-1 ring-inset ring-violet-500/20 hover:bg-violet-500/10"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-violet-500/15 px-3 py-2 text-violet-50 ring-1 ring-inset ring-violet-500/30"
                    : "max-w-[90%] rounded-2xl rounded-bl-md bg-white/[0.04] px-3 py-2 ring-1 ring-inset ring-white/5"
                }
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}

            {pending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Thinking…
              </div>
            )}

            {error && (
              <div className="rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-inset ring-rose-500/30">
                {error}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-white/10 bg-white/[0.02] p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your progress…"
              disabled={pending}
              className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="inline-flex h-9 items-center justify-center rounded-md bg-violet-500/20 px-3 text-violet-200 ring-1 ring-inset ring-violet-500/30 hover:bg-violet-500/30 disabled:opacity-40"
              aria-label="Send"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </form>
          <div className="border-t border-white/5 bg-white/[0.02] px-4 py-1.5 text-center text-[9px] text-muted-foreground">
            <Sparkles className="mr-1 inline size-2.5" />
            AI-generated · accuracy not guaranteed
          </div>
        </div>
      )}
    </>
  );
}
