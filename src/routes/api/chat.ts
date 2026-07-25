import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { PROGRAMS } from "@/lib/programs";

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

        const result = streamText({
          model: openai("gpt-4o-mini"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});