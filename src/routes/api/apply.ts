import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { requireApiUser } from "@/lib/api-auth.server";

type Body = {
  action?: "plan" | "review";
  program?: { id?: string; name?: string };
  answers?: Record<string, string>;
};

const CANONICAL_FIELDS = `full_name, dob, zip, state, household_size, monthly_income, employment, housing, kids, kids_ages, pregnant, insurance, citizenship, disability, benefits_now, phone, email`;

function parseJson(text: string) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

const FALLBACK_QUESTIONS = [
  { id: "full_name", label: "What's your full name?", type: "text" },
  { id: "zip", label: "What's your ZIP code?", type: "zip" },
  { id: "household_size", label: "How many people live in your home, including you?", type: "number" },
  { id: "monthly_income", label: "Roughly how much does your household make each month, before taxes?", help: "A close guess is fine.", type: "money" },
  { id: "employment", label: "What best describes your work right now?", type: "choice", choices: ["Working full time", "Working part time", "Not working", "Retired", "Unable to work"] },
  { id: "housing", label: "Where are you living right now?", type: "choice", choices: ["Renting", "Own my home", "Staying with family or friends", "No stable housing"] },
  { id: "kids", label: "Do you have any children under 18 at home?", type: "yesno" },
];

export const Route = createFileRoute("/api/apply")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireApiUser(request);
        if ("response" in auth) return auth.response;

        const { action = "plan", program, answers = {} } = (await request.json()) as Body;
        const key = process.env.OPENAI_API_KEY;
        const programName = program?.name || "this benefit program";
        const known = Object.entries(answers)
          .filter(([, v]) => String(v ?? "").trim())
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n");

        if (!key) {
          return Response.json(
            action === "plan"
              ? { questions: FALLBACK_QUESTIONS.filter((q) => !answers[q.id]) }
              : fallbackReview(programName, answers),
          );
        }
        const openai = createOpenAI({ apiKey: key });

        if (action === "plan") {
          const prompt = `You are building an in-app application wizard for the U.S. benefit program "${programName}".

Return STRICT JSON: { "intro": string, "questions": [ ... ] }.
"intro" is one warm sentence (max 20 words) telling the person what this application covers.

Each question object:
{ "id": string, "label": string, "help": string (optional, max 12 words), "type": "text"|"number"|"zip"|"money"|"choice"|"yesno", "choices": string[] (only when type is "choice"), "optional": boolean }

Rules:
- Ask ONLY what this program actually requires to determine eligibility. 4 to 7 questions maximum.
- Reuse these canonical ids whenever the concept matches so answers carry across programs: ${CANONICAL_FIELDS}. Invent a new snake_case id only for a program-specific question.
- DO NOT ask anything already answered below.
- Never ask for SSN, bank account, or full street address.
- Write labels conversationally, at a 6th-grade reading level, one idea per question, as if speaking to an older or very busy person. Prefer "choice" or "yesno" over typing whenever possible.
- Choices must be short, plain, and mutually exclusive (max 5).

Already answered (do not ask again):
${known || "(nothing yet)"}

Return ONLY the JSON.`;
          try {
            const { text } = await generateText({ model: openai("gpt-4o-mini"), prompt, temperature: 0.4 });
            const parsed = parseJson(text);
            const questions = (parsed.questions ?? [])
              .filter((q: { id?: string }) => q?.id && !String(answers[q.id!] ?? "").trim())
              .slice(0, 8);
            return Response.json({ intro: parsed.intro ?? "", questions });
          } catch {
            return Response.json({
              intro: "",
              questions: FALLBACK_QUESTIONS.filter((q) => !String(answers[q.id] ?? "").trim()),
            });
          }
        }

        const prompt = `A person just completed an in-app application for the U.S. benefit program "${programName}" inside Claimly.

Their answers:
${known || "(none)"}

Return STRICT JSON:
{
  "eligibility": "likely" | "possible" | "unlikely",
  "eligibilityNote": string (1-2 plain sentences explaining the estimate, no jargon),
  "monthlyBenefit": string (e.g. "$180 - $290 / month" or "Varies by county" if truly unknown),
  "benefitNote": string (one short sentence about what the money or benefit covers),
  "sections": [ { "title": string, "fields": [ { "id": string, "label": string, "value": string } ] } ],
  "nextSteps": [ string, string, string ]
}

Rules:
- "sections" must present EVERY answer they gave, grouped sensibly (e.g. "About you", "Household", "Income"), with the same ids used in their answers, plus any field this program needs that Claimly auto-filled from what they told us. Never invent personal facts they didn't give: leave value as "" if unknown.
- Estimates are approximations. Do not include URLs or tell them to visit another website - the whole process happens inside Claimly.
- nextSteps describe what happens after they submit inside Claimly (review, documents, decision timeline). Plain language, max 15 words each.

Return ONLY the JSON.`;
        try {
          const { text } = await generateText({ model: openai("gpt-4o-mini"), prompt, temperature: 0.5 });
          return Response.json(parseJson(text));
        } catch {
          return Response.json(fallbackReview(programName, answers));
        }
      },
    },
  },
});

function fallbackReview(programName: string, answers: Record<string, string>) {
  return {
    eligibility: "possible",
    eligibilityNote: `Based on what you shared, ${programName} looks worth applying for. A caseworker makes the final decision.`,
    monthlyBenefit: "Varies by household",
    benefitNote: "Your exact amount depends on income and household size.",
    sections: [
      {
        title: "Your application",
        fields: Object.entries(answers).map(([id, value]) => ({
          id,
          label: id.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
          value,
        })),
      },
    ],
    nextSteps: [
      "Claimly reviews your answers for anything missing.",
      "You upload any documents that are needed.",
      "You get a decision update in your dashboard.",
    ],
  };
}
