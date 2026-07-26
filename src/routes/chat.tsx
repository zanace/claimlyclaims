import { useChat } from "@ai-sdk/react";
import { memorySummary } from "@/lib/smart-profile";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Paperclip, Mic, X } from "lucide-react";
import logo from "@/assets/logo.png";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { EMPTY_INFO, InfoPanel, infoToPrompt, loadStoredInfo, type UserInfo } from "@/components/info-panel";
import { SiteHeader } from "@/components/site-header";
import { ApplyWizard } from "@/components/apply-wizard";
import { ChatApplyActions, type ApplyTarget } from "@/components/chat-apply-actions";
import { ChatArticleLinks } from "@/components/chat-article-links";
import { useSpeechInput } from "@/lib/use-speech-input";
import { readAttachments, type Attachment } from "@/lib/attachments";
import { supabase } from "@/integrations/supabase/client";
import { extractSignals, signalsFromInfo } from "@/lib/eligibility";
import { logChatMessage } from "@/lib/tracker";

const title = "Benefits assistant | Claimly";
const description =
  "Chat with Claimly's AI benefits guide about your household and get matched to tax credits, food, healthcare, and housing programs in minutes.";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "I work part-time and have two kids in Texas",
  "I'm self-employed - what refunds do I miss?",
  "Help with rent and utility bills",
  "Show me matches with Islamic values guidance",
];

function ChatPage() {
  const [input, setInput] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [info, setInfo] = useState<UserInfo>(EMPTY_INFO);
  const [wizard, setWizard] = useState<ApplyTarget | null>(null);
  const [files, setFiles] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { listening, supported: micSupported, toggle: toggleMic, stop: stopMic } = useSpeechInput(
    (text) => setInput((prev) => (prev ? `${prev} ${text}` : text)),
  );

  useEffect(() => {
    setInfo(loadStoredInfo());
  }, []);

  // Pass the session token so the assistant can read the user's saved profile and claims.
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
  }, []);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
    onError: (error) => toast.error(error.message || "The assistant is unavailable right now."),
  });

  const busy = status === "submitted" || status === "streaming";

  // Combine structured info-panel data with anything the user typed
  // in the conversation so we can hard-screen program cards.
  const signals = useMemo(() => {
    const base = signalsFromInfo(info);
    const userText = messages
      .filter((m) => m.role === "user")
      .map((m) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join(" "))
      .join(" \n ");
    return extractSignals(userText, base);
  }, [info, messages]);

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy]);

  const send = (text: string) => {
    const value = text.trim();
    if ((!value && files.length === 0) || busy) return;
    stopMic();
    const details = [infoToPrompt(info), memorySummary()].filter(Boolean).join("\n\n");
    logChatMessage({ role: "user", content: value, signals });
    void sendMessage(
      { text: value || "Here's a screenshot - what does it mean and what should I do?", files },
      details ? { body: { userInfo: details } } : undefined,
    );
    setInput("");
    setFiles([]);
  };

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-5 pb-8 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col">
        <Conversation className="flex-none overflow-visible">
          <ConversationContent className="gap-6 py-4">
            {messages.length === 0 ? (
              <div className="py-6 text-center">
                <img
                  src={logo}
                  alt="Claimly"
                  width={56}
                  height={56}
                  className="mx-auto size-14 rounded-2xl"
                />
                <h1 className="mt-6 font-display text-4xl">What's going on in your household?</h1>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                  Tell me your state, roughly what you earn, and who lives with you. I'll work out
                  what you're likely owed. No SSN needed.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const text = message.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join("");
                return (
                  <Message key={message.id} from={message.role}>
                    <MessageContent>
                      {message.parts.map((part, i) =>
                        part.type === "text" ? (
                          <MessageResponse key={i}>{part.text}</MessageResponse>
                        ) : part.type === "file" ? (
                          <img
                            key={i}
                            src={part.url}
                            alt={part.filename ?? "Attachment"}
                            className="mt-2 max-h-56 rounded-xl border border-border object-contain"
                          />
                        ) : null,
                      )}
                      {message.role === "assistant" && (
                        <>
                          <ChatApplyActions text={text} onApply={setWizard} signals={signals} />
                          <ChatArticleLinks text={text} />
                        </>
                      )}
                    </MessageContent>
                  </Message>
                );
              })
            )}
            {status === "submitted" && <Shimmer>Looking through the programs...</Shimmer>}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput
          onSubmit={(_, event) => {
            event.preventDefault();
            send(input);
          }}
        >
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pt-3">
              {files.map((f, i) => (
                <div key={f.url} className="relative">
                  <img
                    src={f.url}
                    alt={f.filename}
                    className="size-16 rounded-xl border border-border object-cover"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${f.filename}`}
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-foreground p-0.5 text-background"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            autoFocus
            placeholder="e.g. Single mom, two kids, about $2,400/month in Ohio"
            onChange={(event) => setInput(event.target.value)}
          />
          <PromptInputFooter className="justify-between">
            <div className="flex items-center gap-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (event) => {
                  const picked = await readAttachments(event.target.files);
                  if (picked.length) setFiles((prev) => [...prev, ...picked].slice(0, 4));
                  event.target.value = "";
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
              <span className="pl-1 text-xs text-muted-foreground">
                {listening ? "Listening…" : "Estimates only - agencies make the final call."}
              </span>
            </div>
            <PromptInputSubmit
              status={status}
              disabled={!input.trim() && files.length === 0 && !busy}
            />
          </PromptInputFooter>
        </PromptInput>
        </div>

        <div className="py-4 lg:self-start">
          <InfoPanel
            info={info}
            onChange={setInfo}
            onSubmit={(next) => {
              const details = [infoToPrompt(next), memorySummary()].filter(Boolean).join("\n\n");
              if (!details || busy) return;
              void sendMessage(
                { text: "Here's my info - use it for everything from now on. What do I likely qualify for?" },
                { body: { userInfo: details } },
              );
            }}
          />
        </div>
      </main>
      <ApplyWizard program={wizard} open={!!wizard} onClose={() => setWizard(null)} />
    </div>
  );
}