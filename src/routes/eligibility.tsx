import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PROGRAMS } from "@/lib/programs";
import { loadClaims, saveClaims, type Claim } from "@/lib/claims";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const title = "Free eligibility estimator | Claimly";
const description =
  "Answer five quick questions about your household and see which tax credits, food, healthcare, and housing claims you are likely eligible to file.";

export const Route = createFileRoute("/eligibility")({
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
  component: Eligibility,
});

function Eligibility() {
  const [household, setHousehold] = useState(2);
  const [children, setChildren] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState(2200);
  const [rent, setRent] = useState(1100);
  const [insured, setInsured] = useState(false);
  const [student, setStudent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const matches = useMemo(() => {
    const fpl = (12880 + 4540 * (household - 1)) / 12;
    const ratio = monthlyIncome / fpl;
    const ids: string[] = [];
    if (monthlyIncome > 0 && ratio < 2.6) ids.push("eitc");
    if (children > 0) ids.push("ctc", "actc", "cdcc");
    if (children > 0 && ratio < 1.85) ids.push("school-meals", "summer-ebt", "ccdf");
    if (ratio < 1.3) ids.push("snap", "tanf", "acp-lifeline");
    if (children > 0 && ratio < 1.85) ids.push("wic");
    if (!insured && ratio < 1.38) ids.push("medicaid");
    if (children > 0 && !insured && ratio < 2.5) ids.push("chip");
    if (!insured && ratio >= 1.38) ids.push("marketplace", "ptc");
    if (rent / Math.max(monthlyIncome, 1) > 0.3) ids.push("section8", "era");
    if (ratio < 1.5) ids.push("liheap", "wap", "lihwap");
    if (student) ids.push("aotc", "pell", "llc");
    ids.push("back-refunds", "state-unclaimed");
    return PROGRAMS.filter((p) => ids.includes(p.id));
  }, [household, children, monthlyIncome, rent, insured, student]);

  function trackAll() {
    const existing = loadClaims();
    const next: Claim[] = [...existing];
    for (const p of matches) {
      if (next.some((c) => c.programId === p.id)) continue;
      next.push({
        id: `${p.id}-${Date.now()}`,
        programId: p.id,
        programName: p.name,
        status: "Not started",
        amount: p.estimate,
        updatedAt: new Date().toISOString(),
      });
    }
    saveClaims(next);
    toast.success(`${next.length - existing.length} claim(s) added to your tracker`);
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="font-display text-5xl tracking-tight md:text-6xl">Eligibility estimator</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          A rough screen, not a decision. It takes about a minute and nothing leaves your browser.
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-[380px_1fr]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="space-y-5 rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-soft)]"
          >
            <div className="space-y-2">
              <Label htmlFor="household">People in household</Label>
              <Input
                id="household"
                type="number"
                min={1}
                value={household}
                onChange={(e) => setHousehold(Number(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="children">Children under 18</Label>
              <Input
                id="children"
                type="number"
                min={0}
                value={children}
                onChange={(e) => setChildren(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income">Household income before taxes (per month)</Label>
              <Input
                id="income"
                type="number"
                min={0}
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent">Rent or mortgage (per month)</Label>
              <Input
                id="rent"
                type="number"
                min={0}
                value={rent}
                onChange={(e) => setRent(Number(e.target.value) || 0)}
              />
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={insured}
                onChange={(e) => setInsured(e.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              Everyone already has health coverage
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={student}
                onChange={(e) => setStudent(e.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              Someone paid tuition this year
            </label>
            <Button type="submit" className="w-full rounded-full">
              See likely claims
            </Button>
          </form>

          <section>
            {submitted ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="font-display text-3xl">
                    {matches.length} claim{matches.length === 1 ? "" : "s"} worth filing
                  </h2>
                  <Button variant="outline" className="rounded-full" onClick={trackAll}>
                    Add all to tracker
                  </Button>
                </div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {matches.map((p) => (
                    <article
                      key={p.id}
                      className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
                    >
                      <h3 className="font-display text-xl">{p.name}</h3>
                      <div className="mt-2 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                        {p.estimate}
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {p.summary}
                      </p>
                    </article>
                  ))}
                </div>
                <p className="mt-8 text-sm text-muted-foreground">
                  Want a real answer for your state?{" "}
                  <Link to="/chat" className="text-primary underline underline-offset-4">
                    Walk through it with the assistant
                  </Link>
                  .
                </p>
              </>
            ) : (
              <div className="flex h-full min-h-64 items-center justify-center rounded-3xl border border-dashed border-border bg-secondary/40 p-10 text-center text-muted-foreground">
                Fill in the form and your likely claims appear here.
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}