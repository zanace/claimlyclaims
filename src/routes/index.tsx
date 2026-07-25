import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Lock, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CATEGORIES, PROGRAMS } from "@/lib/programs";

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
    <div className="min-h-screen bg-background font-sans selection:bg-accent selection:text-accent-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-7xl space-y-28 px-5 py-20 md:space-y-32 lg:px-12">
        {/* Hero */}
        <section className="space-y-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            <BadgeCheck className="size-3.5 text-accent" />
            Billions go unclaimed every year
          </span>
          <h1 className="mx-auto max-w-4xl font-display text-6xl leading-[1.02] tracking-tight md:text-8xl">
            Reclaiming your <em className="text-accent">hidden</em> benefits.
          </h1>
          <p className="mx-auto max-w-xl text-xl leading-relaxed font-light text-muted-foreground">
            We track over {PROGRAMS.length} government programs to find refunds, credits, and
            support you didn't know existed. Fast, private, and entirely risk-free.
          </p>
          <div className="space-y-6 pt-2">
            <Link
              to="/chat"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-10 py-5 font-semibold text-accent-foreground shadow-[var(--shadow-lift)] transition-transform duration-300 hover:scale-105 active:scale-95"
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
        </section>

        {/* Stats */}
        <section className="grid gap-6 md:grid-cols-3">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[2rem] border border-border bg-card/60 p-10 text-center backdrop-blur-sm"
            >
              <span className="block font-display text-5xl text-accent">{stat.value}</span>
              <span className="mt-2 block text-sm tracking-widest text-muted-foreground uppercase">
                {stat.label}
              </span>
            </div>
          ))}
        </section>

        {/* Process */}
        <section className="space-y-16">
          <h2 className="text-center font-display text-5xl italic">How it works</h2>
          <div className="grid gap-12 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="group space-y-4">
                <div className="flex size-12 items-center justify-center rounded-full border border-accent text-accent transition-all duration-500 group-hover:bg-accent group-hover:text-accent-foreground">
                  {i + 1}
                </div>
                <h3 className="text-2xl font-medium">{step.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Category bento */}
        <section className="space-y-12">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 className="font-display text-5xl">Find what's yours</h2>
            <p className="max-w-xs text-muted-foreground">
              {CATEGORIES.length} categories covering {PROGRAMS.length} federal, state, and local
              programs.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {CATEGORIES.map((cat, i) => {
              const count = PROGRAMS.filter((p) => p.category === cat.key).length;
              const featured = i === 0;
              return (
                <Link
                  key={cat.key}
                  to="/programs"
                  className={`group relative flex flex-col justify-end overflow-hidden rounded-3xl border border-border p-6 transition-colors hover:border-accent/60 ${
                    featured ? "bg-secondary/60 p-8" : "bg-card/40"
                  } ${SPANS[i] ?? "min-h-[10rem]"}`}
                >
                  {featured && (
                    <div className="absolute -top-16 -right-16 size-32 rounded-full bg-accent/10 transition-transform duration-700 group-hover:scale-150" />
                  )}
                  <span
                    className={
                      featured
                        ? "font-display text-4xl italic"
                        : "text-lg leading-snug font-medium"
                    }
                  >
                    {cat.key}
                  </span>
                  <p
                    className={`mt-2 text-sm text-muted-foreground ${featured ? "" : "line-clamp-2"}`}
                  >
                    {featured ? cat.blurb : `${count} programs`}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Testimonials */}
        <section className="grid gap-6 md:grid-cols-2">
          {[
            {
              quote:
                "I assumed freelancers got nothing. Turned out there was a credit I'd been skipping for three years.",
              name: "Maria S.",
              role: "Independent contractor",
            },
            {
              quote:
                "It felt less like an application and more like asking a friend who actually knows the rules.",
              name: "David L.",
              role: "Father of two",
            },
          ].map((t) => (
            <figure
              key={t.name}
              className="rounded-[2.5rem] border border-border bg-card/50 p-10 backdrop-blur-sm"
            >
              <blockquote className="font-display text-2xl leading-snug italic">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-8 text-sm tracking-widest text-muted-foreground uppercase">
                {t.name} · {t.role}
              </figcaption>
            </figure>
          ))}
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-5xl">Frequently asked</h2>
          <Accordion type="single" collapsible className="mt-10">
            {FAQS.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q} className="border-border">
                <AccordionTrigger className="py-6 text-left text-lg font-medium">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Closing CTA */}
        <section
          className="relative space-y-8 overflow-hidden rounded-[3rem] p-12 text-center md:p-16"
          style={{ background: "var(--gradient-deep)" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/15 to-transparent" />
          <h2 className="relative z-10 font-display text-5xl text-on-deep">
            Don't leave your money behind.
          </h2>
          <div className="relative z-10">
            <Link
              to="/eligibility"
              className="inline-flex items-center gap-2 rounded-full bg-background px-12 py-5 text-lg font-bold text-foreground transition-transform hover:-translate-y-0.5"
            >
              Check eligibility now <ArrowRight className="size-4" />
            </Link>
          </div>
          <p className="relative z-10 text-sm text-on-deep/70">
            No account, no cost, no SSN required.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
