import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import { CATEGORIES, PROGRAMS } from "@/lib/programs";

const title = "130+ benefit programs we track | Claimly";
const description =
  "Search every federal, state, and local program Claimly checks you against — tax credits, cash assistance, food, healthcare, housing, veterans, and unclaimed money, with rough dollar values.";

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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROGRAMS.filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      return `${p.name} ${p.agency} ${p.category} ${p.summary} ${p.who}`.toLowerCase().includes(q);
    });
  }, [query, category]);

  const grouped = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        ...cat,
        items: results.filter((p) => p.category === cat.key),
      })).filter((g) => g.items.length > 0),
    [results],
  );

  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <header className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Program directory</p>
          <h1 className="mt-3 font-display text-5xl tracking-tight md:text-6xl">
            Every program we check
          </h1>
          <p className="mt-4 text-muted-foreground">
            {PROGRAMS.length} programs across {CATEGORIES.length} categories. Estimates are typical
            ranges, not promises — eligibility depends on your state, household, and income.
          </p>
        </header>

        {/* Search + filters */}
        <div className="sticky top-0 z-10 -mx-5 mt-10 bg-background/90 px-5 py-4 backdrop-blur">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value.slice(0, 100))}
              placeholder="Search programs, agencies, or what you need help with..."
              aria-label="Search programs"
              className="h-12 rounded-full pl-11 pr-11 text-base"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <FilterChip active={category === null} onClick={() => setCategory(null)}>
              All {PROGRAMS.length}
            </FilterChip>
            {CATEGORIES.map((cat) => (
              <FilterChip
                key={cat.key}
                active={category === cat.key}
                onClick={() => setCategory(category === cat.key ? null : cat.key)}
              >
                {cat.key}
              </FilterChip>
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {results.length} {results.length === 1 ? "program" : "programs"}
          {category ? ` in ${category}` : ""}
          {query ? ` matching "${query.trim()}"` : ""}
        </p>

        {grouped.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-dashed border-border p-14 text-center">
            <h2 className="font-display text-2xl">Nothing matched that</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Try a broader word like "rent", "kids", or "medical" — or just describe your situation
              to the assistant and let it search for you.
            </p>
            <Link
              to="/chat"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Ask the assistant <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-12">
            {grouped.map((group) => (
              <section key={group.key}>
                <div className="flex flex-wrap items-baseline gap-3 border-b border-border pb-3">
                  <h2 className="font-display text-2xl">{group.key}</h2>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                    {group.items.length}
                  </span>
                  <p className="text-sm text-muted-foreground">{group.blurb}</p>
                </div>

                <ul className="divide-y divide-border/70">
                  {group.items.map((p) => (
                    <li
                      key={p.id}
                      className="group grid gap-2 py-5 transition-colors hover:bg-secondary/30 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-start sm:gap-6 sm:px-3"
                    >
                      <div className="min-w-0">
                        <h3 className="font-display text-lg leading-snug">{p.name}</h3>
                        <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground/70">
                          {p.agency}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {p.summary}
                        </p>
                        <p className="mt-1.5 text-xs text-muted-foreground/80">{p.who}</p>
                      </div>
                      <div className="sm:text-right">
                        <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                          {p.estimate}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

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

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
