import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, X, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = input.trim();
    if (!value || busy) return;
    void sendMessage({ text: value });
    setInput("");
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          aria-label="Open financial assistant"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 left-5 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-lift)] transition-transform hover:-translate-y-0.5"
        >
          <MessageCircle className="size-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 left-5 z-50 flex h-[520px] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-[var(--shadow-lift)]">
          <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <p className="text-sm font-semibold">Ask Claimly</p>
              <p className="text-xs opacity-80">Anything financial - refunds, benefits, taxes.</p>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-black/10"
            >
              <X className="size-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
            {messages.length === 0 && (
              <p className="text-muted-foreground">
                Hi! Ask me anything about tax credits, benefits, or your money situation.
              </p>
            )}
            {messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              return (
                <div
                  key={m.id}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-primary-foreground"
                      : "mr-auto max-w-[90%] whitespace-pre-wrap text-card-foreground"
                  }
                >
                  {text}
                </div>
              );
            })}
            {busy && <p className="text-xs text-muted-foreground">Thinking…</p>}
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-border bg-card px-3 py-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your finances…"
              className="flex-1 rounded-full border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              aria-label="Send"
              className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}