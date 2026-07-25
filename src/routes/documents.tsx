import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DOC_GROUPS } from "@/lib/claims";

const title = "Document checklist for benefit claims | Claimly";
const description =
  "The paperwork caseworkers actually ask for: ID, income, housing, and medical records. Tick items off as you collect them.";

const KEY = "claimly.docs.v1";

export const Route = createFileRoute("/documents")({
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
  component: Documents,
});

function Documents() {
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setDone(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  function toggle(item: string) {
    const next = done.includes(item) ? done.filter((d) => d !== item) : [...done, item];
    setDone(next);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }

  const total = DOC_GROUPS.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-16">
        <h1 className="font-display text-5xl tracking-tight md:text-6xl">Document checklist</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Most denials are paperwork problems, not eligibility problems. Collect these once and
          almost every claim gets easier.
        </p>
        <p className="mt-6 text-sm font-medium text-primary">
          {done.length} of {total} collected
        </p>

        <div className="mt-12 space-y-10">
          {DOC_GROUPS.map((g) => (
            <section
              key={g.key}
              className="rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-soft)]"
            >
              <h2 className="font-display text-2xl">{g.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{g.blurb}</p>
              <ul className="mt-5 space-y-3">
                {g.items.map((item) => (
                  <li key={item}>
                    <label className="flex cursor-pointer items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={done.includes(item)}
                        onChange={() => toggle(item)}
                        className="mt-0.5 size-4 accent-[var(--primary)]"
                      />
                      <span
                        className={
                          done.includes(item) ? "text-muted-foreground line-through" : undefined
                        }
                      >
                        {item}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-border bg-secondary/50 p-9 text-center">
          <h2 className="font-display text-3xl">Missing something?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            The assistant can tell you exactly which documents your specific claims need, and how to
            replace ones you lost.
          </p>
          <Link
            to="/chat"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
          >
            Ask the assistant
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}