import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";

type MatchRequest = { situation?: string; zip?: string };

const PROGRAM_IDS = [
  "snap",
  "wic",
  "medicaid",
  "chc",
  "food_pantries",
  "rental_assistance",
] as const;

export const Route = createFileRoute("/api/match")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { situation = "", zip = "" } = (await request.json()) as MatchRequest;
        const key = process.env.OPENAI_API_KEY;
        if (!key) return new Response("Missing OPENAI_API_KEY", { status: 500 });

        const openai = createOpenAI({ apiKey: key });
        const prompt = `A user described their situation and ZIP code. Return STRICT JSON with a "results" array of exactly six objects, one per program id in this order: ${PROGRAM_IDS.join(", ")}.
Each object: { "id": string, "why": string (1-2 sentences tailored to their situation, plain English, no jargon, no links), "fit": "strong" | "possible" | "worth_checking" }.

User situation: ${situation || "(not provided)"}
ZIP: ${zip || "(not provided)"}

Return ONLY the JSON, no code fences.`;

        try {
          const { text } = await generateText({
            model: openai("gpt-4o-mini"),
            prompt,
            temperature: 0.6,
          });
          const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
          const parsed = JSON.parse(cleaned);
          return Response.json(parsed);
        } catch (err) {
          return Response.json({
            results: PROGRAM_IDS.map((id) => ({
              id,
              why: "Based on what you shared, this program is worth checking in your area.",
              fit: "worth_checking",
            })),
            fallback: true,
          });
        }
      },
    },
  },
});