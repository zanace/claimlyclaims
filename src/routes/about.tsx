import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Heart, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Claimly - Benefits, without the bureaucracy" },
      { name: "description", content: "Claimly is an AI-powered guide that connects Americans with the government benefits they qualify for - free, private, and fast." },
      { property: "og:title", content: "About Claimly" },
      { property: "og:description", content: "Benefits, without the bureaucracy." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-5 py-20">
        <section className="animate-fade-in-up">
          <p className="text-sm font-medium text-primary">About Claimly</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-tight text-foreground md:text-6xl" style={{ letterSpacing: "-0.03em" }}>
            Benefits, without the <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">bureaucracy</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Every year, more than $140 billion in government benefits goes unclaimed - not because people don't qualify, but because the process is confusing, fragmented, and full of jargon. Claimly changes that.
          </p>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-3">
          {[
            { Icon: Sparkles, title: "AI-first", body: "Our AI reads your situation in plain English and maps you to the right programs in seconds." },
            { Icon: Heart, title: "Human-friendly", body: "No forms, no jargon, no upsell. We meet people where they are." },
            { Icon: ShieldCheck, title: "Privacy by default", body: "We don't ask for your SSN. Nothing is shared with third parties." },
          ].map((f, i) => (
            <div key={f.title} className="rounded-3xl border border-border/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:bg-card/60 animate-fade-in-up" style={{ animationDelay: `${i * 120}ms` }}>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <f.Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}