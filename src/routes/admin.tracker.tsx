import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { isUnlocked, unlockSite } from "@/lib/gate.functions";

type Contradiction = {
  id: string;
  created_at: string;
  user_id: string | null;
  program_id: string;
  program_name: string;
  ai_confidence: string;
  engine_verdict: string;
  reason: string | null;
  message_excerpt: string | null;
  signals: Record<string, unknown> | null;
  route: string | null;
};

type ChatAnswer = {
  id: string;
  created_at: string;
  user_id: string | null;
  role: string;
  content: string;
  signals: Record<string, unknown> | null;
  route: string | null;
};

const title = "Assistant tracker | Claimly admin";
const description = "Internal admin view of chat answers and eligibility contradictions.";

export const Route = createFileRoute("/admin/tracker")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Tracker,
});

function Tracker() {
  const { user, loading, isAdmin } = useAuth();
  const [gate, setGate] = useState<"checking" | "locked" | "open">("checking");
  const [passcode, setPasscode] = useState("");
  const [gateError, setGateError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [tab, setTab] = useState<"contradictions" | "answers">("contradictions");
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [answers, setAnswers] = useState<ChatAnswer[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    isUnlocked()
      .then(({ unlocked }) => setGate(unlocked ? "open" : "locked"))
      .catch(() => setGate("locked"));
  }, []);

  const load = useCallback(async () => {
    setFetching(true);
    const [c, a] = await Promise.all([
      supabase
        .from("assistant_events" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("chat_answers" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    setContradictions(((c.data as unknown) as Contradiction[]) ?? []);
    setAnswers(((a.data as unknown) as ChatAnswer[]) ?? []);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (isAdmin && gate === "open") void load();
  }, [isAdmin, gate, load]);

  // Aggregate contradiction counts to surface recurring failure patterns.
  const patterns = (() => {
    const map = new Map<string, { name: string; count: number; lastReason?: string }>();
    for (const c of contradictions) {
      const cur = map.get(c.program_id) ?? { name: c.program_name, count: 0 };
      cur.count += 1;
      cur.lastReason = c.reason ?? cur.lastReason;
      map.set(c.program_id, cur);
    }
    return [...map.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  })();

  // Homescreen prompt poll: what people are typing into the AI on "/".
  const homescreenPoll = (() => {
    const homeMsgs = answers.filter(
      (a) => a.role === "user" && (a.route === "/" || a.route === null),
    );
    const map = new Map<string, { label: string; count: number; last: string }>();
    for (const a of homeMsgs) {
      const key = a.content.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 140);
      if (!key) continue;
      const cur = map.get(key) ?? { label: a.content.trim(), count: 0, last: a.created_at };
      cur.count += 1;
      if (new Date(a.created_at) > new Date(cur.last)) cur.last = a.created_at;
      map.set(key, cur);
    }
    const entries = [...map.values()].sort((a, b) => b.count - a.count);
    return { entries: entries.slice(0, 15), total: homeMsgs.length };
  })();

  if (loading || gate === "checking") {
    return <Shell><p className="text-muted-foreground">Loading…</p></Shell>;
  }

  if (gate === "locked") {
    return (
      <Shell>
        <h1 className="font-display text-4xl">Admin passcode</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Enter the admin passcode to open the tracker.
        </p>
        <form
          className="mt-6 flex max-w-sm flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            setGateError(false);
            try {
              const { ok } = await unlockSite({ data: { passcode } });
              if (ok) setGate("open");
              else setGateError(true);
            } catch {
              setGateError(true);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
            aria-label="Admin passcode"
            className="h-11 rounded-full border border-border bg-background px-5 text-sm"
          />
          {gateError && <p className="text-sm text-destructive">Incorrect passcode.</p>}
          <Button type="submit" disabled={submitting || !passcode} className="rounded-full">
            {submitting ? "Checking…" : "Unlock admin"}
          </Button>
        </form>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <h1 className="font-display text-4xl">Tracker</h1>
        <p className="mt-3 text-muted-foreground">You need to be logged in to view this page.</p>
        <Link to="/auth" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
          Log in
        </Link>
      </Shell>
    );
  }

  if (!isAdmin) {
    return (
      <Shell>
        <h1 className="font-display text-4xl">Tracker</h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Admin role required.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight">Assistant tracker</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Monitoring for AI vs. eligibility-engine mismatches, plus a raw feed of what people are
            typing into the chat. For internal testing only.
          </p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => void load()} disabled={fetching}>
          Refresh
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Contradictions logged" value={contradictions.length} />
        <Stat label="Chat messages logged" value={answers.length} />
        <Stat label="Unique users" value={new Set(answers.map((a) => a.user_id ?? "anon")).size} />
      </div>

      {patterns.length > 0 && (
        <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-2xl">Top contradiction patterns</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Programs the AI keeps recommending that the engine had to demote. Fix these first.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {patterns.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-4 rounded-xl border border-border/60 p-3">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  {p.lastReason && (
                    <p className="mt-0.5 text-xs text-muted-foreground">Last reason: {p.lastReason}</p>
                  )}
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                  {p.count}×
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">Homescreen prompt poll</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              What visitors are typing into the AI search on the homepage. Great for demos.
            </p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
            {homescreenPoll.total} total
          </span>
        </div>
        {homescreenPoll.entries.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No homepage prompts yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {homescreenPoll.entries.map((e) => {
              const pct = homescreenPoll.total ? (e.count / homescreenPoll.total) * 100 : 0;
              return (
                <li key={e.label} className="rounded-xl border border-border/60 p-3">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm">{e.label}</p>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {e.count}× · {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Last: {new Date(e.last).toLocaleString()}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-10 flex gap-2">
        {(["contradictions", "answers"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === t ? "bg-primary text-primary-foreground" : "border border-border bg-background"
            }`}
          >
            {t === "contradictions" ? "Contradictions" : "Chat answers"}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {tab === "contradictions" ? (
          contradictions.length === 0 ? (
            <Empty>No contradictions logged yet.</Empty>
          ) : (
            contradictions.map((c) => (
              <article key={c.id} className="rounded-2xl border border-border bg-card p-5 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{c.program_name}</p>
                    <p className="text-xs text-muted-foreground">
                      AI said <b>{c.ai_confidence}</b> · engine said <b>{c.engine_verdict}</b> ·{" "}
                      {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    demoted
                  </span>
                </div>
                {c.reason && <p className="mt-2 text-muted-foreground">Reason: {c.reason}</p>}
                {c.message_excerpt && (
                  <p className="mt-2 rounded-xl bg-secondary/50 p-3 text-xs whitespace-pre-wrap">
                    {c.message_excerpt}
                  </p>
                )}
                {c.signals && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Signals</summary>
                    <pre className="mt-1 overflow-x-auto rounded-lg bg-secondary/50 p-2">
                      {JSON.stringify(c.signals, null, 2)}
                    </pre>
                  </details>
                )}
              </article>
            ))
          )
        ) : answers.length === 0 ? (
          <Empty>No chat messages logged yet.</Empty>
        ) : (
          answers.map((a) => (
            <article key={a.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
              <p className="text-xs text-muted-foreground">
                <b>{a.role}</b> · {a.user_id ? a.user_id.slice(0, 8) : "anon"} ·{" "}
                {a.route ?? "-"} · {new Date(a.created_at).toLocaleString()}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{a.content}</p>
              {a.signals && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Signals</summary>
                  <pre className="mt-1 overflow-x-auto rounded-lg bg-secondary/50 p-2">
                    {JSON.stringify(a.signals, null, 2)}
                  </pre>
                </details>
              )}
            </article>
          ))
        )}
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
      {children}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-16">{children}</main>
      <SiteFooter />
    </div>
  );
}