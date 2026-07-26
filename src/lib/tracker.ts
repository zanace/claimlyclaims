import { supabase } from "@/integrations/supabase/client";
import type { Signals } from "@/lib/eligibility";

type ContradictionArgs = {
  programId: string;
  programName: string;
  aiConfidence: string;
  engineVerdict: string;
  reason?: string;
  signals?: Signals;
  messageExcerpt?: string;
};

/** Fire-and-forget: logs when the eligibility engine overrides the AI's verdict. */
export function logContradiction(args: ContradictionArgs) {
  try {
    const route = typeof window !== "undefined" ? window.location.pathname : null;
    void supabase.auth.getUser().then(({ data }) => {
      void supabase
        .from("assistant_events" as never)
        .insert({
          user_id: data.user?.id ?? null,
          event_type: "contradiction",
          program_id: args.programId,
          program_name: args.programName,
          ai_confidence: args.aiConfidence,
          engine_verdict: args.engineVerdict,
          reason: args.reason ?? null,
          signals: args.signals ? (args.signals as unknown as Record<string, unknown>) : null,
          message_excerpt: args.messageExcerpt?.slice(0, 500) ?? null,
          route,
        } as never)
        .then(() => {});
    });
  } catch {
    /* swallow: analytics should never break the UI */
  }
}

type ChatLogArgs = {
  role: "user" | "assistant";
  content: string;
  signals?: Signals;
};

/** Fire-and-forget: logs chat messages for admin review. */
export function logChatMessage(args: ChatLogArgs) {
  try {
    const route = typeof window !== "undefined" ? window.location.pathname : null;
    void supabase.auth.getUser().then(({ data }) => {
      void supabase
        .from("chat_answers" as never)
        .insert({
          user_id: data.user?.id ?? null,
          role: args.role,
          content: args.content.slice(0, 4000),
          signals: args.signals ? (args.signals as unknown as Record<string, unknown>) : null,
          route,
        } as never)
        .then(() => {});
    });
  } catch {
    /* swallow */
  }
}