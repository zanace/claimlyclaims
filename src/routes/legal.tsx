import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const title = "Privacy, terms & disclaimers | Claimly";
const description =
  "How Claimly handles your data, what our benefit estimates mean, and the limits of the guidance our AI assistant provides.";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Legal,
});

const SECTIONS = [
  {
    heading: "Not a government agency",
    body: "Claimly is an independent tool. We are not affiliated with the IRS, SSA, USDA, HUD, or any state benefits office, and we never charge a share of what you receive. Every program we describe can be applied for directly and for free through the agency that runs it.",
  },
  {
    heading: "Estimates are estimates",
    body: "Dollar figures shown across the site are typical ranges drawn from public program rules. They are not offers, guarantees, or determinations. Only the agency handling your application can approve a claim or set an amount.",
  },
  {
    heading: "What the assistant is (and isn't)",
    body: "The chat assistant is an AI model. It explains programs, asks screening questions, and drafts checklists. It is not a lawyer, tax preparer, or accredited caseworker, and it can be wrong. Verify anything consequential against the official agency source before you file.",
  },
  {
    heading: "Your data",
    body: "Your eligibility answers, document checklist, and claim tracker are stored in your own browser's local storage - not on our servers. Clearing site data deletes them permanently. Chat messages are sent to our AI provider to generate a response and are not used to build a profile of you.",
  },
  {
    heading: "Sensitive information",
    body: "Please do not paste Social Security numbers, bank account numbers, or full document images into the chat. The assistant never needs them to screen you for a program.",
  },
  {
    heading: "Acceptable use",
    body: "Use Claimly to understand and pursue benefits you may genuinely qualify for. Do not use it to prepare false claims, scrape the service, or resell its output as professional advice.",
  },
  {
    heading: "Changes and contact",
    body: "We update these terms as the product changes; the version on this page is always the current one. Questions or corrections about a program description are welcome at hello@claimly.example.",
  },
];

function Legal() {
  return (
    <div className="min-h-screen font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-display text-5xl tracking-tight md:text-6xl">Privacy &amp; terms</h1>
        <p className="mt-4 text-muted-foreground">
          Plain language, because benefits paperwork is confusing enough.
        </p>
        <div className="mt-12 space-y-10">
          {SECTIONS.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-2xl">{s.heading}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}