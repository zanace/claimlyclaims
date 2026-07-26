import { useChat } from "@ai-sdk/react";
import { memorySummary } from "@/lib/smart-profile";
import { DefaultChatTransport } from "ai";
import { MessageCircle, X, Send, Paperclip, Mic } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApplyWizard } from "@/components/apply-wizard";
import { ChatApplyActions, type ApplyTarget } from "@/components/chat-apply-actions";
import { ChatArticleLinks } from "@/components/chat-article-links";
import { useSpeechInput } from "@/lib/use-speech-input";
import { readAttachments, type Attachment } from "@/lib/attachments";
import { extractSignals, signalsFromInfo } from "@/lib/eligibility";
import { loadStoredInfo } from "@/components/info-panel";
import { logChatMessage } from "@/lib/tracker";
import { supabase } from "@/integrations/supabase/client";

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [wizard, setWizard] = useState<ApplyTarget | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [files, setFiles] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { listening, supported: micSupported, toggle: toggleMic, stop: stopMic } = useSpeechInput(
    (text) => setInput((prev) => (prev ? `${prev} ${text}` : text)),
  );

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setToken(session?.access_token ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
  });

  const signals = useMemo(() => {
    const base = signalsFromInfo(loadStoredInfo());
    const userText = messages
      .filter((m) => m.role === "user")
      .map((m) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join(" "))
      .join(" \n ");
    return extractSignals(userText, base);
  }, [messages]);

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = input.trim();
    if ((!value && files.length === 0) || busy) return;
    stopMic();
    const memory = memorySummary();
    logChatMessage({ role: "user", content: value, signals });
    void sendMessage(
      { text: value || "Here's a screenshot - what does it mean and what should I do?", files },
      memory ? { body: { userInfo: memory } } : undefined,
    );
    setInput("");
    setFiles([]);
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
              const images = m.parts.filter((p) => p.type === "file");
              return (
                <div
                  key={m.id}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-primary-foreground"
                      : "mr-auto max-w-[90%] whitespace-pre-wrap text-card-foreground"
                  }
                >
                  {images.map((p, i) => (
                    <img
                      key={i}
                      src={(p as { url: string }).url}
                      alt="Attachment"
                      className="mb-2 max-h-40 rounded-xl border border-border object-contain"
                    />
                  ))}
                  {text}
                  {m.role === "assistant" && (
                    <>
                      <ChatApplyActions text={text} onApply={setWizard} compact signals={signals} />
                      <ChatArticleLinks text={text} compact />
                    </>
                  )}
                </div>
              );
            })}
            {busy && <p className="text-xs text-muted-foreground">Thinking…</p>}
          </div>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-border px-3 pt-2">
              {files.map((f, i) => (
                <div key={f.url} className="relative">
                  <img src={f.url} alt={f.filename} className="size-12 rounded-lg object-cover" />
                  <button
                    type="button"
                    aria-label={`Remove ${f.filename}`}
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -right-1 -top-1 rounded-full bg-foreground p-0.5 text-background"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="flex items-center gap-1 border-t border-border bg-card px-3 py-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const picked = await readAttachments(e.target.files);
                if (picked.length) setFiles((prev) => [...prev, ...picked].slice(0, 4));
                e.target.value = "";
              }}
            />
            <button
              type="button"
              aria-label="Attach a screenshot or photo"
              onClick={() => fileRef.current?.click()}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Paperclip className="size-4" />
            </button>
            {micSupported && (
              <button
                type="button"
                aria-label={listening ? "Stop recording" : "Speak your question"}
                aria-pressed={listening}
                onClick={toggleMic}
                className={`rounded-full p-2 transition-colors ${
                  listening
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Mic className="size-4" />
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? "Listening…" : "Ask about your finances…"}
              className="flex-1 rounded-full border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={(!input.trim() && files.length === 0) || busy}
              aria-label="Send"
              className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
      <ApplyWizard program={wizard} open={!!wizard} onClose={() => setWizard(null)} />
    </>
  );
}