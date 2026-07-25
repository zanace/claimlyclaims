import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CATEGORIES, PROGRAMS } from "@/lib/programs";

const title = "130+ benefit programs we track | Claimly";
const description =
  "Tax credits, cash assistance, food, healthcare, housing, veterans, and unclaimed money — every federal, state, and local program Claimly checks you against, with rough dollar values.";

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Programs,
});

function Programs() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="font-display text-5xl tracking-tight md:text-6xl">Programs we check</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          {PROGRAMS.length} programs across {CATEGORIES.length} categories.{" "}
          Estimates below are typical ranges, not promises. Eligibility depends on your state,
          household, and income — the assistant sorts that out with you.
        </p>

        <div className="mt-14 space-y-14">
          {CATEGORIES.map((cat) => (
            <section key={cat.key}>
              <div className="flex flex-wrap items-baseline gap-3 border-b border-border pb-3">
                <h2 className="font-display text-3xl">{cat.key}</h2>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                  {PROGRAMS.filter((p) => p.category === cat.key).length}
                </span>
                <p className="text-sm text-muted-foreground">{cat.blurb}</p>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {PROGRAMS.filter((p) => p.category === cat.key).map((p) => (
                  <article
                    key={p.id}
                    className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
                  >
                    <h3 className="font-display text-xl">{p.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground/70">
                      {p.agency}
                    </p>
                    <div className="mt-2 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                      {p.estimate}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.summary}</p>
                    <p className="mt-3 text-xs text-muted-foreground/80">{p.who}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-20 rounded-3xl border border-border bg-secondary/50 p-10 text-center">
          <h2 className="font-display text-3xl">Not sure which of these apply to you?</h2>
          <Link
            to="/chat"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
          >
            Ask the assistant <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}