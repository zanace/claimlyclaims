import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
import { supabase } from "@/integrations/supabase/client";

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
  "I'm self-employed — what refunds do I miss?",
  "Help with rent and utility bills",
  "Show me matches with Islamic values guidance",
];

function ChatPage() {
  const [input, setInput] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [info, setInfo] = useState<UserInfo>(EMPTY_INFO);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    const details = infoToPrompt(info);
    void sendMessage({ text: value }, details ? { body: { userInfo: details } } : undefined);
    setInput("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-5 pb-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col">
        <Conversation className="flex-1">
          <ConversationContent className="gap-6 py-8">
            {messages.length === 0 ? (
              <div className="py-12 text-center">
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
                  what you're likely owed. No SSN, no account.
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
              messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {message.parts.map((part, i) =>
                      part.type === "text" ? (
                        <MessageResponse key={i}>{part.text}</MessageResponse>
                      ) : null,
                    )}
                  </MessageContent>
                </Message>
              ))
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
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            autoFocus
            placeholder="e.g. Single mom, two kids, about $2,400/month in Ohio"
            onChange={(event) => setInput(event.target.value)}
          />
          <PromptInputFooter className="justify-between">
            <span className="pl-1 text-xs text-muted-foreground">
              Estimates only — agencies make the final call.
            </span>
            <PromptInputSubmit status={status} disabled={!input.trim() && !busy} />
          </PromptInputFooter>
        </PromptInput>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start lg:py-8">
          <InfoPanel info={info} onChange={setInfo} />
        </div>
      </main>
    </div>
  );
}