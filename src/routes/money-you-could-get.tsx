import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Receipt, Carrot, Home, Search, Baby, Stethoscope } from "lucide-react";

const title = "How much you could get | Claimly";
const description =
  "The categories of money Claimly checks for: tax credits, food assistance, housing and utility help, unclaimed property, family benefits, and healthcare.";

export const Route = createFileRoute("/money-you-could-get")({
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
  component: MoneyPage,
});

const CATEGORIES = [
  {
    icon: Receipt,
    name: "Tax refunds & credits",
    body: "EITC, the Child Tax Credit, education credits, and recovery-rebate-type credits — including years you never filed. Often the largest single amount we find. [VERIFY CURRENT FIGURE]",
  },
  {
    icon: Carrot,
    name: "Food assistance",
    body: "SNAP for households and WIC for pregnant people and young children. Monthly, ongoing support rather than a one-time payment. [VERIFY CURRENT FIGURE]",
  },
  {
    icon: Home,
    name: "Utility & housing assistance",
    body: "LIHEAP for heating and cooling bills, emergency rental assistance, weatherization, and state-run crisis funds. [VERIFY CURRENT FIGURE]",
  },
  {
    icon: Search,
    name: "Unclaimed property",
    body: "Old bank accounts, uncashed paychecks, security deposits, and insurance payouts sitting with your state. Free to search, free to claim.",
  },
  {
    icon: Baby,
    name: "Family & child benefits",
    body: "Child care subsidies, school meal programs, diaper and formula assistance, and state-specific family credits. [VERIFY CURRENT FIGURE]",
  },
  {
    icon: Stethoscope,
    name: "Healthcare assistance",
    body: "Medicaid, CHIP for kids, and marketplace premium subsidies that many households assume they earn too much for. [VERIFY CURRENT FIGURE]",
  },
];

function MoneyPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-3xl px-5 pt-20 pb-12 text-center">
          <h1 className="font-display text-5xl tracking-tight md:text-6xl">
            Here's the kind of money people are missing
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Every situation is different — this is what Claimly checks for.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-14">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="rounded-2xl border border-border bg-card p-7">
                <cat.icon className="size-6 text-primary" aria-hidden />
                <h2 className="mt-3 text-lg font-semibold">{cat.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{cat.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 pb-14">
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              Average unclaimed amount found
            </p>
            <p className="mt-3 font-display text-4xl tracking-tight">[INSERT REAL STAT OR REMOVE]</p>
            <p className="mt-3 text-sm text-muted-foreground">
              We don't publish a number until we can stand behind it. Amounts depend entirely on
              your household, income, and state.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="rounded-3xl bg-primary px-8 py-12 text-center text-primary-foreground">
            <h2 className="font-display text-4xl tracking-tight">
              Find out what you qualify for
            </h2>
            <p className="mt-3 opacity-90">Free to check. About four minutes.</p>
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
