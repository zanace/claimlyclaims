import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, ArrowUpRight, Bookmark, BookmarkCheck, Lock, Search, Sparkles,
  Utensils, Baby, HeartPulse, Stethoscope, HandHeart, Home as HomeIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { ApplyModal } from "@/components/apply-modal";

const title = "Claimly - Find the help you're entitled to";
const description =
  "Tell Claimly your situation and ZIP. Our AI matches you to SNAP, WIC, Medicaid, community health, food pantries, and rental help in seconds.";

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

type ProgramCard = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  learnMore: string;
  estimate: string;
  Icon: ComponentType<{ className?: string }>;
  color: string;
};

const CARDS: ProgramCard[] = [
  { id: "snap", name: "SNAP", tagline: "Food benefits", description: "Monthly grocery benefits (avg $190/person) loaded onto an EBT card.", learnMore: "https://www.fns.usda.gov/snap/recipient/eligibility", estimate: "4 minutes", Icon: Utensils, color: "from-primary/10 to-primary/5" },
  { id: "wic", name: "WIC", tagline: "Moms & young kids", description: "Nutrition support, formula, and healthy food for pregnant women, new moms, and kids under 5.", learnMore: "https://www.fns.usda.gov/wic", estimate: "3 minutes", Icon: Baby, color: "from-primary/10 to-primary/5" },
  { id: "medicaid", name: "Medicaid", tagline: "Free/low-cost health coverage", description: "Comprehensive health coverage for low-income adults, kids, pregnant women, and people with disabilities.", learnMore: "https://www.medicaid.gov/medicaid/eligibility-policy/index.html", estimate: "5 minutes", Icon: HeartPulse, color: "from-primary/10 to-primary/5" },
  { id: "chc", name: "Community Health Centers", tagline: "Sliding-scale care", description: "See a doctor or dentist near you on a sliding fee scale, even without insurance.", learnMore: "https://findahealthcenter.hrsa.gov/", estimate: "2 minutes", Icon: Stethoscope, color: "from-primary/10 to-primary/5" },
  { id: "food_pantries", name: "Food Pantries", tagline: "Free groceries this week", description: "Local pantries and food banks provide free groceries and hot meals - no application needed.", learnMore: "https://www.feedingamerica.org/find-your-local-foodbank", estimate: "1 minute", Icon: HandHeart, color: "from-primary/10 to-primary/5" },
  { id: "rental_assistance", name: "Rental Assistance", tagline: "Rent & utility help", description: "Emergency rental help, HUD housing choice vouchers, and utility bill assistance in your area.", learnMore: "https://www.consumerfinance.gov/coronavirus/mortgage-and-housing-assistance/renter-protections/find-help-with-rent-and-utilities/", estimate: "5 minutes", Icon: HomeIcon, color: "from-primary/10 to-primary/5" },
];

const SEARCH_STEPS = [
  "Understanding your situation...",
  "Checking federal programs...",
  "Cross-referencing your ZIP code...",
  "Ranking your best matches...",
];

type Result = { id: string; why: string; fit: "strong" | "possible" | "worth_checking" };

function Index() {
  const [situation, setSituation] = useState("");
  const [zip, setZip] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "done">("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [results, setResults] = useState<Result[] | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [applyFor, setApplyFor] = useState<ProgramCard | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("claimly.saved");
      if (raw) setSaved(new Set(JSON.parse(raw) as string[]));
    } catch {}
  }, []);

  useEffect(() => {
    if (status !== "searching") return;
    setStepIdx(0);
    const t = setInterval(() => setStepIdx((i) => Math.min(i + 1, SEARCH_STEPS.length - 1)), 700);
    return () => clearInterval(t);
  }, [status]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!situation.trim()) return;
    setStatus("searching");
    setResults(null);
    try {
      const [data] = await Promise.all([
        fetch("/api/match", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ situation, zip }),
        }).then((r) => r.json()),
        new Promise((res) => setTimeout(res, 2400)),
      ]);
      setResults(data.results ?? []);
      setStatus("done");
    } catch {
      toast.error("Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  function toggleSave(id: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem("claimly.saved", JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  const cardsWithReasons = useMemo(() => {
    if (!results) return [];
    return CARDS.map((c) => ({ ...c, result: results.find((r) => r.id === c.id) }));
  }, [results]);

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-5 pb-24">
        {/* Hero + search */}
        <section className="pt-16 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1
              className="text-5xl font-semibold tracking-tight text-foreground md:text-7xl animate-blur-in"
              style={{ letterSpacing: "-0.03em" }}
            >
              Find the help you're <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">entitled</span> to.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              Describe your situation in one sentence. Claimly instantly matches you with food, healthcare, and housing programs in your area.
            </p>
          </div>

          {/* AI chat interface */}
          <form
            onSubmit={onSearch}
            className="mx-auto mt-10 max-w-2xl animate-fade-in-up"
            style={{ animationDelay: "500ms" }}
          >
            <div className="rounded-3xl border border-border/80 bg-white/80 p-2 shadow-[0_20px_60px_-30px_rgba(37,99,235,0.4)] backdrop-blur-xl dark:bg-card/60">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="flex flex-1 items-center gap-2 rounded-2xl px-4 py-3">
                  <Search className="size-5 shrink-0 text-muted-foreground" />
                  <input
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    placeholder="e.g. Single mom with 2 kids, part-time job..."
                    className="w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder="ZIP"
                    inputMode="numeric"
                    className="w-24 rounded-2xl border border-transparent bg-secondary/50 px-4 py-3 text-center text-base tracking-widest text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={status === "searching"}
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 disabled:opacity-60"
                  >
                    {status === "searching" ? "Searching..." : (<>Find help <ArrowRight className="size-4" /></>)}
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              <Lock className="mr-1 inline size-3" /> Private by default. No SSN. Always free.
            </p>
            <div className="mt-4 flex justify-center">
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur transition-all hover:border-primary/40 hover:shadow-md"
              >
                <Sparkles className="size-4 text-primary" />
                Ask the AI assistant for more verified information
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </form>
        </section>

        {/* Searching state */}
        {status === "searching" && (
          <section className="mx-auto mt-16 max-w-md animate-fade-in">
            <div className="rounded-3xl border border-border/80 bg-white/70 p-8 text-center shadow-sm backdrop-blur dark:bg-card/60">
              <div className="mx-auto mb-6 size-12 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              <p className="text-base font-medium text-foreground transition-opacity duration-300">
                {SEARCH_STEPS[stepIdx]}
              </p>
              <div className="mt-6 flex justify-center gap-1.5">
                {SEARCH_STEPS.map((_, i) => (
                  <div key={i} className={`h-1 w-8 rounded-full transition-colors ${i <= stepIdx ? "bg-primary" : "bg-border"}`} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Results */}
        {status === "done" && (
          <section className="mt-16 animate-fade-in-up">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>
                  Your matches
                </h2>
                <p className="mt-1 text-muted-foreground">Programs worth applying to based on what you shared.</p>
              </div>
              <Link to="/saved" className="text-sm font-medium text-primary hover:underline">
                View saved →
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {cardsWithReasons.map(({ Icon, color, result, ...c }, i) => (
                <article
                  key={c.id}
                  className="group relative overflow-hidden rounded-3xl border border-border/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(37,99,235,0.35)] dark:bg-card/60 animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${color}`} />
                  <div className="flex items-start justify-between">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <button
                      onClick={() => toggleSave(c.id)}
                      className="rounded-full border border-border/70 bg-white/80 p-2 text-muted-foreground transition hover:text-primary dark:bg-card/60"
                      aria-label={saved.has(c.id) ? "Unsave" : "Save"}
                    >
                      {saved.has(c.id)
                        ? <BookmarkCheck className="size-4 text-primary" />
                        : <Bookmark className="size-4" />}
                    </button>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">{c.name}</h3>
                  <p className="text-xs font-medium tracking-wide text-primary uppercase">{c.tagline}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
                  {result?.why && (
                    <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-3">
                      <p className="text-xs font-semibold tracking-wide text-primary uppercase">Why for you</p>
                      <p className="mt-1 text-sm text-foreground/85">{result.why}</p>
                    </div>
                  )}
                  <div className="mt-5 flex items-center gap-3">
                    <a
                      href={c.learnMore}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
                    >
                      Learn more <ArrowUpRight className="size-3.5" />
                    </a>
                    <button
                      onClick={() => setApplyFor(c as ProgramCard)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
                    >
                      Apply
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Empty state trust strip */}
        {status === "idle" && (
          <section className="mt-20 grid gap-5 md:grid-cols-3">
            {[
              { title: "Instant matches", body: "AI reads your situation and returns the exact programs you likely qualify for." },
              { title: "Real .gov links", body: "Every result points to the official government page - never a paid middleman." },
              { title: "Save & come back", body: "Bookmark programs and pick up where you left off. Nothing shared, ever." },
            ].map((f, i) => (
              <div
                key={f.title}
                className="rounded-3xl border border-border/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:bg-card/60 animate-fade-in-up"
                style={{ animationDelay: `${300 + i * 150}ms` }}
              >
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </section>
        )}
      </main>

      <ApplyModal
        open={!!applyFor}
        program={applyFor}
        onClose={() => setApplyFor(null)}
      />
    </div>
  );
}
