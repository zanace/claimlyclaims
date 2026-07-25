import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Our Team — Claimly" },
      { name: "description", content: "Meet the founders and team behind Claimly." },
      { property: "og:title", content: "Our Team — Claimly" },
      { property: "og:description", content: "Meet the founders and team behind Claimly." },
    ],
  }),
  component: TeamPage,
});

const TEAM = [
  { name: "Faiz", role: "CEO", blurb: "Sets the vision and steers the foundation." },
  { name: "Ali", role: "Secretary", blurb: "Keeps the foundation organized and on record." },
  { name: "Masroor", role: "Marketing", blurb: "Tells the story and grows the community." },
  { name: "Ahmad", role: "Treasury", blurb: "Watches the books and stewards the funds." },
  { name: "Yousuf", role: "Maintenance", blurb: "Keeps everything running behind the scenes." },
] as const;

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function TeamPage() {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
      <header className="max-w-2xl">
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          The foundation
        </p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
          The people behind Claimly.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          A small team of founders who started Claimly to help everyday families
          claim the benefits that are already theirs.
        </p>
      </header>

      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TEAM.map((m) => (
          <li
            key={m.name}
            className="group rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div
                className="grid size-14 shrink-0 place-items-center rounded-2xl font-display text-xl"
                style={{ background: "var(--gradient-deep)", color: "var(--on-deep)" }}
                aria-hidden
              >
                {initials(m.name)}
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-2xl leading-tight">{m.name}</h2>
                <p className="text-sm font-medium text-accent">{m.role}</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {m.blurb}
            </p>
          </li>
        ))}
        </ul>
      </div>
    </>
  );
}