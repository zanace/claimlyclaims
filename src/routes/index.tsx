import { store } from "@/lib/store";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Bookmark, BookmarkCheck, Lock, Search, Sparkles,
  Utensils, Baby, HeartPulse, Stethoscope, HandHeart, Home as HomeIcon,
  Receipt, DollarSign, GraduationCap, Shield, Users, Zap, AlertTriangle,
  Wallet, Landmark,
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { ApplyWizard } from "@/components/apply-wizard";
import { PROGRAMS, type Program, type ProgramCategory } from "@/lib/programs";
import { logChatMessage } from "@/lib/tracker";

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

const CATEGORY_ICON: Record<ProgramCategory, ComponentType<{ className?: string }>> = {
  "Tax credits": Receipt,
  "Cash assistance": DollarSign,
  "Food": Utensils,
  "Healthcare": HeartPulse,
  "Housing & utilities": HomeIcon,
  "Child care & family": Baby,
  "Education & training": GraduationCap,
  "Veterans & military": Shield,
  "Seniors & disability": Users,
  "Disaster & legal": Zap,
  "Unclaimed money": Wallet,
  "Grants for organizations": Landmark,
};

function programToCard(p: Program): ProgramCard {
  return {
    id: p.id,
    name: p.name.replace(/\s*\([^)]*\)\s*/g, " ").trim(),
    tagline: p.category,
    description: p.summary,
    learnMore: "",
    estimate: p.estimate,
    Icon: CATEGORY_ICON[p.category] ?? Sparkles,
    color: "from-primary/10 to-primary/5",
  };
}

const PROGRAM_BY_ID = new Map(PROGRAMS.map((p) => [p.id, p]));

const SEARCH_STEPS = [
  "Understanding your situation...",
  "Checking federal programs...",
  "Cross-referencing your ZIP code...",
  "Ranking your best matches...",
];

const HEADLINES: Array<{ pre: string; accent: string; post: string }> = [
  { pre: "Helping Americans claim the money they ", accent: "don't know about", post: "." },
  { pre: "Find the help you're ", accent: "entitled", post: " to." },
  { pre: "Claim the benefits you've ", accent: "already earned", post: "." },
  { pre: "Unlock support that's ", accent: "waiting", post: " for you." },
  { pre: "Discover programs ", accent: "built", post: " for your situation." },
  { pre: "Get the assistance you ", accent: "qualify", post: " for." },
  { pre: "Turn eligibility into ", accent: "real support", post: "." },
  { pre: "Reclaim your ", accent: "hidden", post: " benefits." },
  { pre: "Match with programs ", accent: "made", post: " for you." },
  { pre: "Access the help ", accent: "designed", post: " for you." },
  { pre: "Find what you're ", accent: "owed", post: "." },
  { pre: "Uncover benefits you ", accent: "never knew", post: " existed." },
  { pre: "See what support is ", accent: "yours", post: " to claim." },
  { pre: "Get matched to help in ", accent: "seconds", post: "." },
  { pre: "Your benefits, ", accent: "finally", post: " within reach." },
  { pre: "Stop leaving money on the ", accent: "table", post: "." },
  { pre: "Claim what's ", accent: "rightfully", post: " yours." },
  { pre: "Real help, ", accent: "no", post: " runaround." },
  { pre: "Support you qualify for, ", accent: "made simple", post: "." },
  { pre: "The help you need is ", accent: "closer", post: " than you think." },
  { pre: "Find every program you ", accent: "deserve", post: "." },
  { pre: "Turn your situation into ", accent: "support", post: "." },
  { pre: "Benefits made ", accent: "effortless", post: "." },
  { pre: "Discover the aid you've been ", accent: "missing", post: "." },
  { pre: "One sentence away from ", accent: "real help", post: "." },
  { pre: "Help that's ", accent: "already", post: " yours." },
];

type Result = { id: string; why: string; fit: "strong" | "possible" | "worth_checking" };

const FIT_META: Record<Result["fit"], { label: string; className: string }> = {
  strong: { label: "Strong fit", className: "bg-primary/15 text-primary" },
  possible: { label: "Possible fit", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  worth_checking: { label: "Worth checking", className: "bg-muted text-muted-foreground" },
};

function Index() {
  const [situation, setSituation] = useState("");
  const [zip, setZip] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "done">("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [results, setResults] = useState<Result[] | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [applyFor, setApplyFor] = useState<ProgramCard | null>(null);
  const [headlineIdx, setHeadlineIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHeadlineIdx((i) => (i + 1) % HEADLINES.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      const raw = store.getItem("claimly.saved");
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
    logChatMessage({
      role: "user",
      content: zip ? `${situation.trim()} [ZIP ${zip}]` : situation.trim(),
    });
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
      try { store.setItem("claimly.saved", JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  const cardsWithReasons = useMemo(() => {
    if (!results) return [];
    return results
      .map((r) => {
        const program = PROGRAM_BY_ID.get(r.id);
        if (!program) return null;
        return { ...programToCard(program), result: r };
      })
      .filter((x): x is ProgramCard & { result: Result } => !!x);
  }, [results]);

  const assistantQuery = useMemo(
    () => (zip ? `${situation.trim()} (ZIP ${zip})` : situation.trim()),
    [situation, zip],
  );

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-5 pb-24">
        {/* Hero + search */}
        <section className="pt-16 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-5 text-xs font-semibold tracking-[0.18em] text-primary uppercase animate-fade-in">
              AI consultant and financial assistant
            </p>
            <h1
              className="text-5xl font-semibold tracking-tight text-foreground md:text-7xl animate-blur-in"
              style={{ letterSpacing: "-0.03em" }}
            >
              <span key={headlineIdx} className="inline-block animate-fade-in">
                {HEADLINES[headlineIdx].pre}
                <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                  {HEADLINES[headlineIdx].accent}
                </span>
                {HEADLINES[headlineIdx].post}
              </span>
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

            {cardsWithReasons.length === 0 && (
              <div className="rounded-3xl border border-border/70 bg-white/70 p-8 text-center dark:bg-card/60">
                <p className="text-sm text-muted-foreground">
                  We couldn't confidently match a program yet. Try the assistant for a full walkthrough.
                </p>
              </div>
            )}
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
                    <div className="flex items-center gap-2">
                      {result && (
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${FIT_META[result.fit].className}`}>
                          {FIT_META[result.fit].label}
                        </span>
                      )}
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
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">{c.name}</h3>
                  <p className="text-xs font-medium tracking-wide text-primary uppercase">{c.tagline}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
                  <p className="mt-2 text-xs font-medium text-foreground/70">Est. payout: {c.estimate}</p>
                  {result?.why && (
                    <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-3">
                      <p className="text-xs font-semibold tracking-wide text-primary uppercase">Why for you</p>
                      <p className="mt-1 text-sm text-foreground/85">{result.why}</p>
                    </div>
                  )}
                  <div className="mt-5 flex items-center gap-3">
                    {result?.fit !== "worth_checking" ? (
                      <button
                        onClick={() => setApplyFor({ ...c, Icon, color })}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
                      >
                        Apply here <ArrowRight className="size-3.5" />
                      </button>
                    ) : (
                      <div className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-dashed border-border px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        <AlertTriangle className="size-3.5" /> Might not be a fit
                      </div>
                    )}
                    <Link
                      to="/chat"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
                    >
                      Ask AI
                    </Link>
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
              { title: "Apply right here", body: "Finish your whole application inside Claimly - no confusing government websites." },
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

        {/* Mission and purpose */}
        {status === "idle" && (
          <section className="mt-8 rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 to-indigo-500/5 p-10 backdrop-blur animate-fade-in-up">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">Our mission</h2>
            <p className="mt-3 max-w-2xl text-lg font-medium text-foreground">
              Helping Americans claim the money they don't know about.
            </p>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              We believe every American should know exactly what help they're entitled to, and be able to claim it in
              minutes - not months. Claimly is built by a small team who's tired of watching families miss out on the
              support they've already earned.
            </p>
            <Link
              to="/chat"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow hover:brightness-110"
            >
              Try the assistant <ArrowRight className="size-4" />
            </Link>
          </section>
        )}
      </main>

      <ApplyWizard
        open={!!applyFor}
        program={applyFor}
        onClose={() => setApplyFor(null)}
      />
    </div>
  );
}
