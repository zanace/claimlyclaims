import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { requireApiUser } from "@/lib/api-auth.server";
import { officialSourceFor } from "@/lib/official-links";

type Body = { program?: { id?: string; name?: string }; state?: string };

export type ApplyGuide = {
  program: string;
  state: string;
  availability: string;
  agency: string;
  officialUrl: string;
  officialLabel: string;
  steps: string[];
  documents: string[];
  timeline: string;
  tips: string[];
};

function parseJson(text: string) {
  return JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim());
}

function fallback(programName: string, state: string): ApplyGuide {
  const src = officialSourceFor(programName);
  return {
    program: programName,
    state: state || "your state",
    availability: "Available in all 50 states, though the rules and the office you apply through are set by each state.",
    agency: "Your state agency",
    officialUrl: src.url,
    officialLabel: src.label,
    steps: [
      `Open the official page and pick ${state || "your state"} from the list.`,
      "Create an account on your state's benefits portal (or download the paper form).",
      "Fill in household size, income, and address exactly as they appear on your documents.",
      "Upload or mail copies of the documents listed below.",
      "Submit, then watch for an interview call or letter within about two weeks.",
    ],
    documents: src.docs,
    timeline: "Most decisions take 7 to 30 days after your documents are in.",
    tips: ["Apply even if you are unsure - the agency decides.", "Keep a copy of everything you send."],
  };
}

export const Route = createFileRoute("/api/guide")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireApiUser(request);
        if ("response" in auth) return auth.response;

        const { program, state = "" } = (await request.json()) as Body;
        const programName = program?.name || "this benefit program";
        const src = officialSourceFor(`${program?.id ?? ""} ${programName}`);
        const key = process.env.OPENAI_API_KEY;
        if (!key) return Response.json(fallback(programName, state));

        const openai = createOpenAI({ apiKey: key });
        const where = state.trim() || "the United States generally";
        const prompt = `Write an accurate, step-by-step guide for applying to the U.S. benefit program "${programName}" for someone living in ${where}.

The official national page is: ${src.label} - ${src.url}

Return STRICT JSON only:
{
  "availability": string,   // Which states this is available in. Be specific: "All 50 states and DC" or name the states. If ${where} is NOT eligible, say so plainly first.
  "agency": string,         // The exact agency in ${where} that runs it (e.g. "Ohio Department of Job and Family Services"). If unsure, name the type of agency.
  "officialUrl": string,    // The best real official URL for ${where}: the state agency's application page if you are confident it exists, otherwise ${src.url}. Must be a real .gov or official state URL.
  "officialLabel": string,  // Short name of that page
  "steps": [string],        // 5 to 8 numbered steps, in order, specific to ${where}. Say exactly where to click, what to select, and what happens after. Plain 6th-grade language, max 25 words each.
  "documents": [string],    // Exact documents that application asks for
  "timeline": string,       // How long a decision takes in ${where}
  "tips": [string]          // 2 or 3 short practical tips (deadlines, interviews, expedited rules)
}

Rules: never invent a URL you are not confident is real - fall back to ${src.url}. Use the short everyday program name. No jargon. Return ONLY the JSON.`;

        try {
          const { text } = await generateText({ model: openai("gpt-4o-mini"), prompt, temperature: 0.3 });
          const parsed = parseJson(text);
          const url = typeof parsed.officialUrl === "string" && /^https?:\/\//.test(parsed.officialUrl)
            ? parsed.officialUrl
            : src.url;
          return Response.json({
            ...fallback(programName, state),
            ...parsed,
            officialUrl: url,
            officialLabel: parsed.officialLabel || src.label,
            program: programName,
            state: state || "your state",
          } satisfies ApplyGuide);
        } catch {
          return Response.json(fallback(programName, state));
        }
      },
    },
  },
});
