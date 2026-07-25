import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  FileText,
  Lock,
  MessagesSquare,
  Search,
  ShieldCheck,
} from "lucide-react";
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
    icon: MessagesSquare,
    title: "Talk it through",
    body: "A short chat about your household, work, and where you live. No forms, no jargon, no account needed.",
  },
  {
    icon: Search,
    title: "See your matches",
    body: "We line your answers up against federal and state programs and show what each one is roughly worth.",
  },
  {
    icon: FileText,
    title: "Get the next step",
    body: "Exactly what to file, where to file it, and what documents to have ready before you start.",
  },
];

const STATS = [
  { value: `${PROGRAMS.length}+`, label: "programs tracked" },
  { value: "4 min", label: "typical check" },
  { value: "$0", label: "cost, always" },
  { value: "Halal", label: "guidance optional" },
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
  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
          <div className="mx-auto max-w-3xl px-5 pt-20 pb-24 text-center md:pt-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <BadgeCheck className="size-3.5 text-accent" />
              Billions in benefits go unclaimed every single year
            </span>
            <h1 className="mt-7 font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
              The money is yours.
              <br />
              <em className="text-primary">Go collect it.</em>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Refunds, groceries, coverage, rent help — most people never find out what they
              qualify for. Have one short conversation and find out in minutes.
            </p>
            <div className="mt-9 flex flex-col items-center gap-4">
              <Link
                to="/chat"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-medium text-primary-foreground shadow-[var(--shadow-lift)] transition-transform hover:-translate-y-0.5"
              >
                Check what I qualify for
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
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="px-5 py-8 text-center">
                <div className="font-display text-4xl text-primary">{stat.value}</div>
                <div className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-24">
          <h2 className="font-display text-4xl md:text-5xl">How it works</h2>
          <p className="mt-3 max-w-lg text-muted-foreground">
            Three steps, built to be understandable by anyone — not just people who like paperwork.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-soft)]"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <step.icon className="size-5" />
                </div>
                <div className="mt-6 text-xs font-medium tracking-widest text-muted-foreground">
                  STEP {i + 1}
                </div>
                <h3 className="mt-1 font-display text-2xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-4xl md:text-5xl">What we look for</h2>
                <p className="mt-3 max-w-lg text-muted-foreground">
                  {PROGRAMS.length} federal and state programs across four parts of everyday life.
                </p>
              </div>
              <Link
                to="/programs"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Browse every program <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.key}
                  to="/programs"
                  className="group rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display text-2xl">{cat.key}</h3>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                      {PROGRAMS.filter((p) => p.category === cat.key).length}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{cat.blurb}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-12 px-5 py-24 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl md:text-5xl">Guidance that fits your values</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Ask the assistant for Islamic values guidance and it will mark each match as
              straightforward or worth a second look — for example, where a program routes through
              interest-bearing accounts. It's optional, and you can turn it on mid-conversation.
            </p>
          </div>
          <div className="space-y-4">
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
                className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
              >
                <blockquote className="font-display text-xl leading-snug">"{t.quote}"</blockquote>
                <figcaption className="mt-4 text-sm text-muted-foreground">
                  {t.name} · {t.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-card">
          <div className="mx-auto max-w-3xl px-5 py-24">
            <h2 className="font-display text-4xl md:text-5xl">Common questions</h2>
            <Accordion type="single" collapsible className="mt-8">
              {FAQS.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q}>
                  <AccordionTrigger className="text-left text-base">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="px-5 py-24">
          <div
            className="mx-auto max-w-5xl rounded-3xl px-8 py-16 text-center"
            style={{ background: "var(--gradient-deep)" }}
          >
            <h2 className="font-display text-4xl text-primary-foreground md:text-5xl">
              Find out in four minutes.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-primary-foreground/75">
              No account, no cost, no commitment. Just answers.
            </p>
            <Link
              to="/chat"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-7 py-3.5 text-base font-medium text-foreground transition-transform hover:-translate-y-0.5"
            >
              Start the conversation <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
