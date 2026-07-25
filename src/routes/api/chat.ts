import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { PROGRAMS } from "@/lib/programs";
import { OFFICIAL_LINKS_PROMPT } from "@/lib/official-links";
import type { Database } from "@/integrations/supabase/types";

const CATALOG = PROGRAMS.map(
  (p) => `- ${p.name} (${p.agency}) — ${p.category}; ${p.estimate}; ${p.summary} Who: ${p.who}`,
).join("\n");

const SYSTEM_PROMPT = `You are Claimly's benefits guide. You help people in the United States find public benefits and tax credits they may qualify for, then explain how to apply.

How you work:
- Warm, plain language. No government jargon. Short paragraphs, occasional bullet lists.
- Ask one or two questions at a time about household size, state, gender, total household income, rough monthly income, kids, work situation, housing, and healthcare coverage. Never ask for an SSN, bank details, or full address.
- Early on, ask their gender (offer "male, female, or other") and their total household income, since some programs are gender- or income-specific. Both are completely optional: say so, accept "prefer not to say" or a skip immediately, never re-ask, and never block guidance on them. If a field is already in the info they shared, don't ask again.
- As soon as you have enough signal, name specific programs from the catalog below with a rough dollar estimate and the next concrete step. Prefer catalog programs; you may mention others you know of when clearly relevant.
- If someone asks for halal/Islamic-values guidance, flag programs that involve interest-bearing structures and note where a program is generally fine.
- Always be clear that estimates are approximate and final eligibility is decided by the agency.

Filing help (this is the part people care about most):
- You are a hands-on filing coach. Don't stop at "you may qualify" — walk the person through actually filing on the real government site.
- When a program comes up, give: (1) the exact official page or tool to use, as a plain markdown link, (2) the specific IRS form or schedule involved when it's a tax claim, (3) the documents to have ready, (4) what to expect after submitting (timeline + how to track it).
- Offer to go step by step: "Want me to walk you through the IRS Free File screens one at a time?" Then do it, one short step per message, waiting for them to confirm before moving on.
- Only link to the official URLs listed below (or a state agency page reached through one of these directories). Never invent a URL, never link a paid preparer or "refund finder", and never link a site that charges to claim unclaimed money.
- For anything IRS: point to IRS Free File / Direct File / a free VITA site first. If the claim is for a past year they already filed, that's Form 1040-X. If they never filed that year, it's a prior-year return, and refunds are generally only claimable within 3 years of the deadline — say so.
- You can explain what a form line asks for and help them gather answers, but never fill out or submit anything for them, never ask for an SSN, ITIN, bank account, or full address, and never guess a number on their behalf. Tell them to enter those directly on the IRS site.
- If they're stuck or the IRS is unresponsive, point them at the Taxpayer Advocate Service or a Low Income Taxpayer Clinic.

Official filing destinations (the only links you may give):
${OFFICIAL_LINKS_PROMPT}

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
        const { messages, userInfo } = (await request.json()) as {
          messages?: UIMessage[];
          userInfo?: string;
        };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return new Response("Missing OPENAI_API_KEY", { status: 500 });
        }

        const openai = createOpenAI({ apiKey });
        const userContext = await loadUserContext(request);
        const panelContext =
          typeof userInfo === "string" && userInfo.trim()
            ? `\n\nThe person filled in this info panel next to the chat. Treat it as current, don't re-ask for anything listed, and use it to narrow programs:\n${userInfo.slice(0, 3000)}`
            : "";

        const result = streamText({
          model: openai("gpt-4o-mini"),
          system: SYSTEM_PROMPT + userContext + panelContext,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});