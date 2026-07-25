import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Lock, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { PROGRAMS } from "@/lib/programs";

const title = "Claimly — Find the benefits and refunds you already qualify for";
const description =
  "Answer a few plain-English questions and Claimly's AI guide maps your household to tax credits, food, healthcare, and housing programs — free, private, no SSN.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

const STEPS = [
  {
    title: "Brief chat",
    body: "Answer plain-English questions about your household, work, and state. No forms, no jargon, no account needed.",
  },
  {
    title: "Deep scan",
    body: `Our engine cross-references your answers against ${PROGRAMS.length}+ federal, state, and local programs in seconds.`,
  },
  {
    title: "Claim funds",
    body: "Get a tailored report: what you qualify for, roughly what it's worth, and exactly where to file it.",
  },
];

const STATS = [
  { value: `${PROGRAMS.length}+`, label: "Programs tracked" },
  { value: "4 mins", label: "Average check time" },
  { value: "$0 cost", label: "Risk-free search" },
];

// Bento spans keyed by position so the category grid reads as a varied mosaic.
const SPANS = [
  "col-span-2 row-span-2 min-h-[19rem]",
  "min-h-[10rem]",
  "min-h-[10rem]",
  "col-span-2 min-h-[10rem]",
  "min-h-[10rem]",
  "min-h-[10rem]",
  "col-span-2 min-h-[10rem]",
  "min-h-[10rem]",
  "min-h-[10rem]",
  "min-h-[10rem]",
  "min-h-[10rem]",
  "col-span-2 min-h-[10rem]",
];

// Hero headline variants — one is picked at random on each visit.
const HEADLINES = [
  { pre: "Reclaiming your ", em: "hidden", post: " benefits." },
  { pre: "Money you're owed, ", em: "found", post: " fast." },
  { pre: "Uncover the aid you ", em: "already", post: " qualify for." },
  { pre: "Your ", em: "unclaimed", post: " benefits, claimed." },
  { pre: "Find what the system ", em: "never", post: " told you about." },
  { pre: "Benefits hiding in ", em: "plain", post: " sight." },
  { pre: "Claim what's ", em: "already", post: " yours." },
  { pre: "Turn overlooked programs into ", em: "real", post: " money." },
  { pre: "Every credit you ", em: "missed", post: ", in one place." },
  { pre: "Get back the support you're ", em: "entitled", post: " to." },
];

const FAQS = [
  {
    q: "Does Claimly cost anything?",
    a: "No. There is no fee, no upsell, and no premium tier. Every program we point you toward is free to apply for directly.",
  },
  {
    q: "Do you need my Social Security number?",
    a: "Never. The assistant only asks the broad details it needs — household size, state, rough income — to narrow down programs.",
  },
  {
    q: "Is this a government site?",
    a: "No. Claimly is independent. We explain public programs and hand you off to the official agency that runs each one.",
  },
  {
    q: "What if I'm not a citizen?",
    a: "Some programs are open to lawful permanent residents and certain visa holders, and children may qualify even when parents don't. The assistant will tell you which of your matches have status requirements.",
  },
  {
    q: "What is the Islamic values guidance?",
    a: "An optional lens. Ask for it and the assistant flags anything that leans on interest-bearing structures, and notes where a program is generally uncontroversial.",
  },
];

function Index() {
  const [headline, setHeadline] = useState(HEADLINES[0]);

  // Rotate the hero headline on each visit (client-side to avoid SSR mismatch).
  useEffect(() => {
    setHeadline(HEADLINES[Math.floor(Math.random() * HEADLINES.length)]);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background font-sans selection:bg-accent selection:text-accent-foreground">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-5 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs font-medium tracking-widest text-muted-foreground uppercase">
          <BadgeCheck className="size-3.5 text-accent" />
            Billions go unclaimed every year
          </span>
        <h1 className="mx-auto max-w-4xl font-display text-5xl leading-[1.02] tracking-tight md:text-7xl">
            {headline.pre}
            <em className="text-accent">{headline.em}</em>
            {headline.post}
          </h1>
        <p className="mx-auto max-w-xl text-lg leading-relaxed font-light text-muted-foreground">
            We track over {PROGRAMS.length} government programs to find refunds, credits, and
            support you didn't know existed. Fast, private, and entirely risk-free.
          </p>
        <div className="space-y-5">
            <Link
              to="/chat"
            className="group inline-flex items-center gap-2 rounded-full bg-accent px-9 py-4 font-semibold text-accent-foreground shadow-[var(--shadow-lift)] transition-transform duration-300 hover:scale-105 active:scale-95"
            >
              Start your free chat
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="size-3.5" /> Always free
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="size-3.5" /> Private by default
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" /> No SSN required
              </span>
            </div>
          </div>
      </main>
    </div>
  );
}
