import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const title = "How Claimly finds your money | Claimly";
const description =
  "A three-step look at how Claimly screens your household against federal and state benefit programs and helps you file the claim.";

export const Route = createFileRoute("/how-it-works")({
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
  component: HowItWorks,
});

const STEPS = [
  {
    n: "01",
    title: "Tell us a bit about you",
    body: "A short intake: your state, household size, income range, and filing status. No Social Security number, no bank details, no documents to upload.",
  },
  {
    n: "02",
    title: "We check what you qualify for",
    body: "Your answers are cross-referenced against federal and state programs - tax credits, SNAP, EITC, unclaimed property, utility and housing assistance - in one pass.",
  },
  {
    n: "03",
    title: "We help you claim it",
    body: "You get a plain-English checklist, the documents each program asks for, and step-by-step filing instructions, tracked in one place until the money lands.",
  },
];

const TRUST = [
  {
    heading: "We never sell your data",
    body: "Your answers are used to match you to programs. They are not sold, rented, or handed to advertisers.",
  },
  {
    heading: "Encrypted and minimal",
    body: "We ask for the least we can. Information is encrypted in transit, and the assistant never needs your SSN or account numbers.",
  },
  {
    heading: "Independent, not a government agency",
    body: "Every program we surface can be applied for directly and for free through the agency that runs it. We just make it findable.",
  },
];

const FAQ = [
  {
    q: "Is this legit, or is this a scam?",
    a: "Claimly is an independent tool that points you at real federal and state programs. We never ask for a share of what you receive, and we never ask for your bank login. Everything we describe can be verified on the agency's own site - and we tell you which agency runs each program.",
  },
  {
    q: "How long does it take to get my money?",
    a: "It depends entirely on the program. Food assistance decisions often come within 30 days, tax refunds follow the IRS processing calendar, and unclaimed property claims can take a few weeks to a few months. We show a realistic window for each one rather than a single promise.",
  },
  {
    q: "What if I don't qualify for anything?",
    a: "Then you know, in about four minutes, and you have not lost anything. Most households match at least one program, and eligibility changes with income, household size, and life events - so it's worth re-checking after a big change.",
  },
  {
    q: "Does this cost anything?",
    a: "Checking what you qualify for is free. Claimly never takes a percentage of a benefit or refund you receive.",
  },
];

function HowItWorks() {
  return (
    <div className="min-h-screen font-sans">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-3xl px-5 pt-20 pb-14 text-center">
          <h1 className="font-display text-5xl tracking-tight md:text-6xl">
            How Claimly finds your money
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Billions in benefits and refunds go unclaimed every year, mostly because the process is
            confusing and scattered across agencies. Claimly does the digging for you.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16">
          <div className="grid gap-5 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="rounded-2xl border border-border bg-card p-7">
                <span className="font-display text-3xl text-primary">{step.n}</span>
                <h2 className="mt-3 text-lg font-semibold">{step.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-16">
          <div className="rounded-2xl border border-border bg-secondary/40 p-8">
            <h2 className="font-display text-3xl tracking-tight">Why it's free to look</h2>
            <p className="mt-3 text-muted-foreground">
              Screening yourself against every program you might qualify for costs you nothing here,
              and we never take a cut of a benefit or refund you receive.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16">
          <h2 className="font-display text-4xl tracking-tight">Why you can trust this</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {TRUST.map((item) => (
              <div key={item.heading} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-semibold">{item.heading}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            {["Partner logo", "Partner logo", "Press logo", "Press logo"].map((label, i) => (
              <span key={i} className="rounded-lg bg-secondary px-5 py-3">
                {label}
              </span>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-16">
          <h2 className="font-display text-4xl tracking-tight">Common questions</h2>
          <Accordion type="single" collapsible className="mt-4">
            {FAQ.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="rounded-3xl bg-primary px-8 py-12 text-center text-primary-foreground">
            <h2 className="font-display text-4xl tracking-tight">See what you qualify for</h2>
            <p className="mt-3 opacity-90">About four minutes. No SSN, no documents.</p>
            <Link
              to="/eligibility"
              className="mt-6 inline-block rounded-full bg-background px-6 py-3 text-sm font-medium text-foreground"
            >
              Start the check
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
