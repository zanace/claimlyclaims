import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { PROGRAMS } from "@/lib/programs";
import type { Database } from "@/integrations/supabase/types";

const CATALOG = PROGRAMS.map(
  (p) => `- ${p.name} (${p.agency}) — ${p.category}; ${p.estimate}; ${p.summary} Who: ${p.who}`,
).join("\n");

const SYSTEM_PROMPT = `You are Claimly's benefits guide. You help people in the United States find public benefits and tax credits they may qualify for, then explain how to apply.

How you work:
- Warm, plain language. No government jargon. Short paragraphs, occasional bullet lists.
- Ask one or two questions at a time about household size, state, rough monthly income, kids, work situation, housing, and healthcare coverage. Never ask for an SSN, bank details, or full address.
- As soon as you have enough signal, name specific programs from the catalog below with a rough dollar estimate and the next concrete step. Prefer catalog programs; you may mention others you know of when clearly relevant.
- If someone asks for halal/Islamic-values guidance, flag programs that involve interest-bearing structures and note where a program is generally fine.
- Always be clear that estimates are approximate and final eligibility is decided by the agency.

Program catalog (${PROGRAMS.length} programs Claimly tracks):
${CATALOG}`;

// Pulls the signed-in user's saved profile + claims so the assistant can reason
// about their real situation instead of re-asking for everything.
async function loadUserContext(request: Request): Promise<string> {
  const auth = request.headers.get("authorization");
  const token = auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7) : null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return "";

  try {
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (!user) return "";

    const [{ data: profile }, { data: apps }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, state, household_size, monthly_income")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("applications")
        .select("program_name, status, estimated_amount, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

    const lines: string[] = [];
    if (profile) {
      lines.push(
        `Saved profile — name: ${profile.full_name ?? "unknown"}; state: ${profile.state ?? "unknown"}; household size: ${profile.household_size ?? "unknown"}; monthly income: ${profile.monthly_income ?? "unknown"}.`,
      );
    }
    if (apps?.length) {
      lines.push("Claims already tracked in their account:");
      for (const a of apps) {
        lines.push(`- ${a.program_name} — status: ${a.status}${a.estimated_amount ? `, est. ${a.estimated_amount}` : ""}`);
      }
    }
    if (!lines.length) return "";

    return `\n\nThis person is signed in. Here is their saved account data — use it instead of re-asking, confirm it briefly, and do not suggest programs they already have an active claim for (instead report that claim's status):\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return new Response("Missing OPENAI_API_KEY", { status: 500 });
        }

        const openai = createOpenAI({ apiKey });
        const userContext = await loadUserContext(request);

        const result = streamText({
          model: openai("gpt-4o-mini"),
          system: SYSTEM_PROMPT + userContext,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});