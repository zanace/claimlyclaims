import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { PROGRAMS } from "@/lib/programs";

type MatchRequest = { situation?: string; zip?: string };

const CATALOG = PROGRAMS.map(
  (p) => `${p.id} | ${p.name} | ${p.category} | ${p.estimate} | ${p.who}`,
).join("\n");
const VALID_IDS = new Set(PROGRAMS.map((p) => p.id));

type MatchResult = { id: string; why: string; fit: "strong" | "possible" | "worth_checking" };

export const Route = createFileRoute("/api/match")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { situation = "", zip = "" } = (await request.json()) as MatchRequest;
        const key = process.env.OPENAI_API_KEY;
        if (!key) return new Response("Missing OPENAI_API_KEY", { status: 500 });

        const openai = createOpenAI({ apiKey: key });
        const prompt = `You are Claimly's matching engine. Pick the 5-8 programs from the catalog below that best fit this specific person. Personalize - do NOT just return the same food/health/housing basics every time. Mix categories: tax refunds, state credits, housing/utility help, unclaimed money, education, veterans, seniors, child care, disaster, etc., based on what fits.

CRITICAL rules:
- Screen by income. If the person clearly earns above ~250% Federal Poverty Level (roughly $75k+ for a household of 1-4, or $100k+ for any household), do NOT include SNAP, WIC, Medicaid, TANF, SSI, LIHEAP, Section 8, Lifeline, ACP, CHIP, or free lunch. Instead include tax credits (CTC, Saver's Credit, education/energy credits), unclaimed money, disaster aid, veterans, and other non-need-based programs.
- Screen by household. If the person has NO dependents / no children (household size = 1, or they said "no kids", "single", "no dependents"), do NOT include Child Tax Credit (CTC), Additional CTC, Child & Dependent Care Credit, WIC, CHIP, Head Start, free/reduced school lunch, TANF, child care subsidies, or any other child/family-only program. Never assume kids - only include child-related programs when the person clearly has dependents under 17 (or under 19 for some programs).
- Screen by other stated facts: don't recommend veterans programs unless they mention military/VA service; don't recommend senior programs (Medicare, SSI-aged, senior housing) unless age 60+; don't recommend student aid unless they mention school/college; don't recommend disability programs unless they mention a disability.
- Only mark "strong" when the person clearly meets the main rules (income, household, category). Use "possible" when likely but not confirmed. Use "worth_checking" for maybes.
- Do NOT return anything the person clearly doesn't qualify for. If a category doesn't fit, skip it.
- Prefer state-specific angles when the ZIP suggests a state (state EITC, state property-tax relief, state housing assistance).

Return STRICT JSON: { "results": [ { "id": "<exact catalog id>", "why": "1-2 sentences, plain English, tailored to them, no links", "fit": "strong" | "possible" | "worth_checking" } ] }
Only use ids from the catalog. Sort strongest fit first. 5-8 items total.

Catalog (id | name | category | estimate | who):
${CATALOG}

User situation: ${situation || "(not provided)"}
ZIP: ${zip || "(not provided)"}

Return ONLY the JSON, no code fences.`;

        try {
          const { text } = await generateText({
            model: openai("gpt-4o-mini"),
            prompt,
            temperature: 0.5,
          });
          const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
          const parsed = JSON.parse(cleaned) as { results?: MatchResult[] };
          const filtered = (parsed.results ?? [])
            .filter((r) => r && VALID_IDS.has(r.id))
            .slice(0, 8);
          return Response.json({ results: filtered });
        } catch (err) {
          return Response.json({
            results: ["eitc", "ctc", "snap", "medicaid", "liheap", "rental_assistance"]
              .filter((id) => VALID_IDS.has(id))
              .map((id) => ({
                id,
                why: "Based on what you shared, this program may be worth checking in your area.",
                fit: "worth_checking" as const,
              })),
            fallback: true,
          });
        }
      },
    },
  },
});