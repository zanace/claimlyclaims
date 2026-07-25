import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Bookmark, MessageSquare, FileText, ClipboardList } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard - Claimly" },
      { name: "description", content: "Your Claimly dashboard: saved programs, active claims, and next steps." },
      { property: "og:title", content: "Dashboard - Claimly" },
      { property: "og:description", content: "Your saved programs, active claims, and next steps." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    try {
      const raw = store.getItem("claimly.saved");
      if (raw) setSavedCount((JSON.parse(raw) as string[]).length);
    } catch {}
  }, []);

  const stats = [
    { label: "Saved programs", value: savedCount, to: "/saved", Icon: Bookmark },
    { label: "Active claims", value: 0, to: "/claims", Icon: ClipboardList },
    { label: "Documents", value: 0, to: "/documents", Icon: FileText },
  ];

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-5 py-16">
        <div className="animate-fade-in-up">
          <p className="text-sm font-medium text-primary">Dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Here's a snapshot of your Claimly account. Pick up where you left off.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {stats.map((s, i) => (
            <Link
              key={s.label}
              to={s.to}
              className="group rounded-3xl border border-border/70 bg-white/70 p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg dark:bg-card/60 animate-fade-in-up"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <s.Icon className="size-5" />
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1" />
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </Link>
          ))}
        </div>

        <section className="mt-10 rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 to-indigo-500/5 p-8 backdrop-blur animate-fade-in-up">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Talk to your AI benefits guide</h2>
              <p className="mt-1 max-w-md text-muted-foreground">Ask anything, from EITC to Medicaid renewal. Real .gov links, no jargon.</p>
            </div>
            <Link to="/chat" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow hover:brightness-110">
              <MessageSquare className="size-4" /> Open assistant
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}