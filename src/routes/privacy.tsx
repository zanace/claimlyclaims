import { createFileRoute } from "@tanstack/react-router";
import { Lock, ShieldCheck, EyeOff, Server } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & Trust - Claimly" },
      { name: "description", content: "How Claimly protects your information: no SSN required, encrypted in transit, and nothing sold or shared." },
      { property: "og:title", content: "Privacy & Trust - Claimly" },
      { property: "og:description", content: "How Claimly protects your information." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  const pillars = [
    { Icon: ShieldCheck, title: "No SSN required", body: "Claimly never asks for your Social Security number, bank account, or full address." },
    { Icon: Lock, title: "Encrypted in transit", body: "All traffic to Claimly is served over HTTPS. Your session with the AI is protected at the transport layer." },
    { Icon: EyeOff, title: "Nothing sold, ever", body: "We do not sell, rent, or share your information with advertisers, data brokers, or paid preparers." },
    { Icon: Server, title: "You control your data", body: "You can delete your account and saved bookmarks at any time from your profile settings." },
  ];

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-5 py-20">
        <section className="animate-fade-in-up">
          <p className="text-sm font-medium text-primary">Privacy & Trust</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-tight text-foreground md:text-6xl" style={{ letterSpacing: "-0.03em" }}>
            Your data, your rules.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Claimly is built around one belief: helping you access benefits should never come at the cost of your privacy. Here's how we keep our word.
          </p>
        </section>

        <section className="mt-14 grid gap-5 md:grid-cols-2">
          {pillars.map((p, i) => (
            <div key={p.title} className="rounded-3xl border border-border/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:bg-card/60 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <p.Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-14 space-y-6 text-sm leading-relaxed text-muted-foreground animate-fade-in-up">
          <div>
            <h2 className="text-xl font-semibold text-foreground">We don't ask for your PII</h2>
            <p className="mt-2">
              Personally Identifiable Information (PII) is any data that can identify a specific person, either by itself or when mixed with other details. It covers direct identifiers like your full name, Social Security number, and driver's license or other ID numbers; sensitive records like financial, bank, and medical data; and indirect background details like date of birth, exact address, or employer that can single you out when combined with something else.
            </p>
            <p className="mt-2">
              Claimly does not ask for any of it. Screening works from broad, non-identifying facts - your ZIP or state, household size, and a rough income range - and the assistant will never request an SSN, bank account, or ID number.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">What we collect</h2>
            <p className="mt-2">
              Only what you tell the assistant (situation, ZIP, household basics) and, if you sign in, your email address. We use this to personalize the programs we surface - nothing more.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">How we use it</h2>
            <p className="mt-2">
              Your conversation is sent to our AI provider to generate a response and to our secure Lovable Cloud backend so you can pick up where you left off. It is not used to train third-party models.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Delete anytime</h2>
            <p className="mt-2">
              Email <a className="text-primary hover:underline" href="mailto:hello@claimly.claims">hello@claimly.claims</a> to delete your account and every record tied to it, no questions asked.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}