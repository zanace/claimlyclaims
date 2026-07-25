import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Lock, ShieldCheck, FileText, MessageSquare, Sparkles } from "lucide-react";
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

function Index() {
  const [headline, setHeadline] = useState(HEADLINES[0]);

  // Rotate the hero headline on each visit (client-side to avoid SSR mismatch).
  useEffect(() => {
    setHeadline(HEADLINES[Math.floor(Math.random() * HEADLINES.length)]);
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col font-sans selection:bg-accent selection:text-accent-foreground"
      style={{ backgroundImage: "var(--gradient-page)" }}
    >
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl px-5">
        <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 text-center">
        <span
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs font-medium tracking-widest text-muted-foreground uppercase animate-fade-in-up"
          style={{ animationDelay: "0ms" }}
        >
          <BadgeCheck className="size-3.5 text-accent" />
            Billions go unclaimed every year
          </span>
        <h1
          className="mx-auto max-w-4xl font-display text-5xl leading-[1.02] tracking-tight md:text-7xl animate-blur-in"
          style={{ animationDelay: "120ms" }}
        >
            {headline.pre}
            <em className="text-accent">{headline.em}</em>
            {headline.post}
          </h1>
        <p
          className="mx-auto max-w-xl text-lg leading-relaxed font-light text-muted-foreground animate-fade-in-up"
          style={{ animationDelay: "240ms" }}
        >
            We track over {PROGRAMS.length} government programs to find refunds, credits, and
            support you didn't know existed. Fast, private, and entirely risk-free.
          </p>
        <div className="space-y-5 animate-fade-in-up" style={{ animationDelay: "360ms" }}>
            <Link
              to="/chat"
            className="group inline-flex items-center gap-2 rounded-full bg-accent px-9 py-4 font-semibold text-accent-foreground shadow-[var(--shadow-lift)] transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
            >
              Start your free chat
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
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

        <section className="grid gap-6 py-24 md:grid-cols-3">
          {[
            { icon: MessageSquare, title: "Chat in plain English", body: "No jargon, no forms. Just answer a few questions about your household." },
            { icon: Sparkles, title: "AI maps your matches", body: `We compare your situation against ${PROGRAMS.length}+ federal and state programs.` },
            { icon: FileText, title: "File with confidence", body: "Get direct .gov links, checklists, and step-by-step guidance." },
          ].map(({ icon: Icon, title: t, body }, i) => (
            <div
              key={t}
              className="group rounded-2xl border border-border bg-card/40 p-6 text-foreground backdrop-blur hover-lift reveal-on-scroll animate-fade-in-up"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <Icon className="mb-4 size-6 text-accent transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" />
              <h3 className="font-display text-2xl text-foreground">{t}</h3>
              <p className="mt-2 text-sm text-foreground/80">{body}</p>
            </div>
          ))}
        </section>

        <section className="mb-24 rounded-3xl border border-border bg-card/40 p-10 text-center text-foreground backdrop-blur reveal-on-scroll animate-fade-in-up">
          <h2 className="font-display text-4xl text-foreground md:text-5xl">Ready to see what's yours?</h2>
          <p className="mx-auto mt-3 max-w-lg text-foreground/80">
            Free, private, and takes under 3 minutes.
          </p>
          <Link
            to="/chat"
            className="group mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3 font-semibold text-accent-foreground shadow-[var(--shadow-lift)] transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            Start your free chat <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </section>
      </main>
    </div>
  );
}
