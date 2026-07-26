import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { requireApiUser } from "@/lib/api-auth.server";

type Body = {
  docType?: string;
  fileName?: string;
  mimeType?: string;
  imageUrl?: string;
};

export type DocReview = {
  docType: string;
  quality: "good" | "needs work" | "unclear";
  summary: string;
  fixes: string[];
  checklist: string[];
};

const BASE: Record<string, string[]> = {
  "Tax Return": [
    "Include page 1 and 2 of the 1040 - both pages are usually required.",
    "Make sure your name, SSN box, and the tax year are readable.",
    "Send the signed copy, not a draft or a blank form.",
    "Add any schedules the agency asks for (Schedule 1, C, or EIC).",
  ],
  "Pay Stub": [
    "Send the most recent 30 days of stubs, not just one.",
    "The employer name, pay period dates, and gross pay must be visible.",
    "Do not crop off year-to-date totals at the bottom.",
    "If you are paid in cash, ask your employer for a signed letter instead.",
  ],
};

const GENERIC = [
  "Photograph the whole page - no cut-off edges.",
  "Use bright, even light and avoid glare or shadows.",
  "Hold the camera flat above the page so text is not skewed.",
  "Check that every number and date is sharp before you upload.",
];

function fallback(docType: string): DocReview {
  return {
    docType,
    quality: "unclear",
    summary: "Here is how to make this document work on the first try.",
    fixes: GENERIC,
    checklist: BASE[docType] ?? [
      "Make sure your full name and the date are visible.",
      "Send the most recent version you have.",
    ],
  };
}

function parseJson(text: string) {
  return JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim());
}

export const Route = createFileRoute("/api/doc-review")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireApiUser(request);
        if ("response" in auth) return auth.response;

        const { docType = "Document", imageUrl, mimeType, fileName } = (await request.json()) as Body;
        const key = process.env.OPENAI_API_KEY;
        if (!key) return Response.json(fallback(docType));

        const openai = createOpenAI({ apiKey: key });
        const guide = (BASE[docType] ?? []).join(" ");
        const instruction = `You review documents people upload for U.S. benefit applications.
Document type: ${docType}. File: ${fileName ?? "unknown"} (${mimeType ?? "unknown"}).
${guide ? `Known requirements: ${guide}` : ""}

${imageUrl ? "Look at the image and judge readability, cropping, glare, missing pages, and whether the required fields are visible." : "You cannot see the file contents, so give the best practical guidance for this document type."}

Return STRICT JSON only:
{
  "quality": "good" | "needs work" | "unclear",
  "summary": string,      // one friendly sentence, 6th-grade language
  "fixes": [string],      // 2-4 specific things to improve about THIS upload (re-take, uncrop, add page 2...)
  "checklist": [string]   // 3-5 things this document must show to be accepted
}
Plain language, max 18 words per item. Never mention SSN digits or other private numbers you see. Return ONLY the JSON.`;

        try {
          const { text } = await generateText({
            model: openai("gpt-4o-mini"),
            temperature: 0.2,
            messages: [
              {
                role: "user",
                content: imageUrl
                  ? [
                      { type: "text", text: instruction },
                      { type: "image", image: imageUrl },
                    ]
                  : [{ type: "text", text: instruction }],
              },
            ],
          });
          const parsed = parseJson(text);
          return Response.json({ ...fallback(docType), ...parsed, docType } satisfies DocReview);
        } catch {
          return Response.json(fallback(docType));
        }
      },
    },
  },
});
