import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, Bookmark, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Resources - Claimly" },
      { name: "description", content: "Your bookmarked benefit programs and resources on Claimly." },
      { property: "og:title", content: "Saved Resources - Claimly" },
      { property: "og:description", content: "Programs you've saved for later." },
    ],
  }),
  component: Saved,
});

const CATALOG: Record<string, { name: string; tagline: string; description: string; learnMore: string }> = {
  snap: { name: "SNAP", tagline: "Food benefits", description: "Monthly grocery benefits on an EBT card.", learnMore: "https://www.fns.usda.gov/snap/recipient/eligibility" },
  wic: { name: "WIC", tagline: "Moms & young kids", description: "Nutrition, formula, and food for young families.", learnMore: "https://www.fns.usda.gov/wic" },
  medicaid: { name: "Medicaid", tagline: "Health coverage", description: "Free/low-cost health coverage.", learnMore: "https://www.medicaid.gov/medicaid/eligibility-policy/index.html" },
  chc: { name: "Community Health Centers", tagline: "Sliding-scale care", description: "Care near you regardless of insurance.", learnMore: "https://findahealthcenter.hrsa.gov/" },
  food_pantries: { name: "Food Pantries", tagline: "Free groceries", description: "Local pantries and food banks near you.", learnMore: "https://www.feedingamerica.org/find-your-local-foodbank" },
  rental_assistance: { name: "Rental Assistance", tagline: "Rent & utilities", description: "Emergency rental and utility help.", learnMore: "https://www.consumerfinance.gov/coronavirus/mortgage-and-housing-assistance/renter-protections/find-help-with-rent-and-utilities/" },
};

function Saved() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("claimly.saved");
      if (raw) setIds(JSON.parse(raw));
    } catch {}
  }, []);

  function remove(id: string) {
    setIds((prev) => {
      const next = prev.filter((x) => x !== id);
      try { localStorage.setItem("claimly.saved", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-5 py-16">
        <div className="animate-fade-in-up">
          <p className="text-sm font-medium text-primary">Saved</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            Saved resources
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">Programs you bookmarked. They stay on this device.</p>
        </div>

        {ids.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-white/50 p-12 text-center backdrop-blur dark:bg-card/40 animate-fade-in-up">
            <Bookmark className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium text-foreground">Nothing saved yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Bookmark programs from the homepage and they'll show up here.</p>
            <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110">
              Find programs
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {ids.map((id, i) => {
              const c = CATALOG[id];
              if (!c) return null;
              return (
                <article
                  key={id}
                  className="rounded-3xl border border-border/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:bg-card/60 animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight text-foreground">{c.name}</h3>
                      <p className="text-xs font-medium tracking-wide text-primary uppercase">{c.tagline}</p>
                    </div>
                    <button onClick={() => remove(id)} className="rounded-full border border-border/70 p-2 text-muted-foreground hover:text-destructive" aria-label="Remove">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>
                  <a href={c.learnMore} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90">
                    Learn more <ArrowUpRight className="size-3.5" />
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}