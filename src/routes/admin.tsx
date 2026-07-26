import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { isUnlocked, unlockSite } from "@/lib/gate.functions";
import { sendStatusEmail } from "@/lib/notify.functions";
import { useServerFn } from "@tanstack/react-start";

const REVIEW_STATUSES = ["Submitted", "In review", "Needs info", "Approved", "Denied"] as const;

type Application = {
  id: string;
  user_id: string;
  program_name: string;
  estimated_amount: string | null;
  household_size: number | null;
  monthly_income: number | null;
  state: string | null;
  notes: string | null;
  status: string;
  reviewer_note: string | null;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

type ContradictionRow = {
  id: string;
  created_at: string;
  user_id: string | null;
  program_id: string;
  program_name: string;
  ai_confidence: string;
  engine_verdict: string;
  reason: string | null;
  message_excerpt: string | null;
  route: string | null;
};

type ChatAnswerRow = {
  id: string;
  created_at: string;
  user_id: string | null;
  role: string;
  content: string;
  route: string | null;
};

const title = "Admin review queue | Claimly";
const description = "Internal Claimly console for reviewing submitted benefit applications.";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { user, loading, isAdmin } = useAuth();
  const notify = useServerFn(sendStatusEmail);
  const [gate, setGate] = useState<"checking" | "locked" | "open">("checking");
  const [passcode, setPasscode] = useState("");
  const [gateError, setGateError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    isUnlocked()
      .then(({ unlocked }) => setGate(unlocked ? "open" : "locked"))
      .catch(() => setGate("locked"));
  }, []);

  const [apps, setApps] = useState<Application[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>("All");
  const [fetching, setFetching] = useState(false);
  const [contradictions, setContradictions] = useState<ContradictionRow[]>([]);
  const [chatAnswers, setChatAnswers] = useState<ChatAnswerRow[]>([]);
  const [trackerTab, setTrackerTab] = useState<"contradictions" | "answers">("contradictions");

  const load = useCallback(async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setApps((data as Application[]) ?? []);
    const { data: profiles } = await supabase.from("profiles").select("id, email, full_name");
    const map: Record<string, string> = {};
    for (const p of profiles ?? []) map[p.id] = p.full_name ? `${p.full_name} · ${p.email}` : (p.email ?? p.id);
    setEmails(map);
    const [c, a] = await Promise.all([
      supabase.from("assistant_events" as never).select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("chat_answers" as never).select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setContradictions(((c.data as unknown) as ContradictionRow[]) ?? []);
    setChatAnswers(((a.data as unknown) as ChatAnswerRow[]) ?? []);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (isAdmin && gate === "open") void load();
  }, [isAdmin, gate, load]);

  const visible = useMemo(
    () => (filter === "All" ? apps : apps.filter((a) => a.status === filter)),
    [apps, filter],
  );

  const reviewerPoll = useMemo(() => {
    const map = new Map<string, { label: string; count: number; last: string | null }>();
    for (const a of apps) {
      if (!a.reviewed_by) continue;
      const label = emails[a.reviewed_by] ?? a.reviewed_by.slice(0, 8);
      const cur = map.get(a.reviewed_by) ?? { label, count: 0, last: a.reviewed_at };
      cur.count += 1;
      if (a.reviewed_at && (!cur.last || new Date(a.reviewed_at) > new Date(cur.last))) {
        cur.last = a.reviewed_at;
      }
      map.set(a.reviewed_by, cur);
    }
    const entries = [...map.values()].sort((a, b) => b.count - a.count);
    const total = entries.reduce((s, e) => s + e.count, 0);
    return { entries, total, unreviewed: apps.filter((a) => !a.reviewed_by).length };
  }, [apps, emails]);

  const applicationsPoll = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const a of apps) {
      const key = a.program_name.trim();
      if (!key) continue;
      const cur = map.get(key) ?? { label: key, count: 0 };
      cur.count += 1;
      map.set(key, cur);
    }
    const entries = [...map.values()].sort((a, b) => b.count - a.count).slice(0, 15);
    return { entries, total: apps.length };
  }, [apps]);

  const patterns = useMemo(() => {
    const map = new Map<string, { name: string; count: number; lastReason?: string }>();
    for (const c of contradictions) {
      const cur = map.get(c.program_id) ?? { name: c.program_name, count: 0 };
      cur.count += 1;
      cur.lastReason = c.reason ?? cur.lastReason;
      map.set(c.program_id, cur);
    }
    return [...map.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [contradictions]);

  const homescreenPoll = useMemo(() => {
    const homeMsgs = chatAnswers.filter((a) => a.role === "user" && (a.route === "/" || a.route === null));
    const map = new Map<string, { label: string; count: number }>();
    for (const a of homeMsgs) {
      const key = a.content.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 140);
      if (!key) continue;
      const cur = map.get(key) ?? { label: a.content.trim(), count: 0 };
      cur.count += 1;
      map.set(key, cur);
    }
    const entries = [...map.values()].sort((a, b) => b.count - a.count).slice(0, 15);
    return { entries, total: homeMsgs.length };
  }, [chatAnswers]);

  async function update(id: string, patch: Partial<Application>) {
    const stamped = { ...patch, reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() };
    const { error } = await supabase.from("applications").update(stamped).eq("id", id);
    if (error) return toast.error(error.message);
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, ...stamped } : a)));
    toast.success("Application updated");
    if (patch.status) {
      const app = apps.find((a) => a.id === id);
      const email = emails[app?.user_id ?? ""]?.split("·").pop()?.trim();
      if (app && email && /.+@.+\..+/.test(email)) {
        try {
          const result = await notify({
            data: {
              to: email,
              programName: app.program_name,
              status: patch.status,
              reviewerNote: patch.reviewer_note ?? app.reviewer_note ?? undefined,
            },
          });
          if (result?.ok) toast.success(`Emailed applicant: ${email}`);
          else if (result?.reason === "email_not_configured")
            toast("Status saved. Applicant email not sent - email sending is not connected yet.");
          else toast.error("Couldn't send status email.");
        } catch {
          toast.error("Couldn't send status email.");
        }
      }
    }
  }

  if (loading || gate === "checking") {
    return <Shell><p className="text-muted-foreground">Loading…</p></Shell>;
  }

  if (gate === "locked") {
    return (
      <Shell>
        <h1 className="font-display text-4xl">Admin passcode</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Enter the admin passcode to open the review console.
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
        <h1 className="font-display text-4xl">Admin</h1>
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
        <h1 className="font-display text-4xl">Admin</h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          This account doesn't have reviewer access. Ask a Claimly administrator to grant your
          account the admin role.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight">Review queue</h1>
          <p className="mt-3 text-muted-foreground">
            {apps.length} submitted application{apps.length === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 rounded-full border border-border bg-background px-4 text-sm"
            aria-label="Filter by status"
          >
            {["All", ...REVIEW_STATUSES].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Button variant="outline" className="rounded-full" onClick={() => void load()} disabled={fetching}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="mt-10 space-y-4">
        {reviewerPoll.entries.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl">Reviewer activity</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Which admins are handling the most (and least) applications. {reviewerPoll.unreviewed} still unreviewed.
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                {reviewerPoll.total} reviews
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {reviewerPoll.entries.map((e, i) => {
                const pct = reviewerPoll.total ? (e.count / reviewerPoll.total) * 100 : 0;
                const isTop = i === 0;
                const isBottom = i === reviewerPoll.entries.length - 1 && reviewerPoll.entries.length > 1;
                return (
                  <li key={e.label} className="rounded-xl border border-border/60 p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{e.label}</p>
                        {isTop && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                            Most active
                          </span>
                        )}
                        {isBottom && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                            Least active
                          </span>
                        )}
                      </div>
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
                    {e.last && (
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        Last review: {new Date(e.last).toLocaleString()}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Nothing in this queue yet.
          </div>
        ) : (
          visible.map((a) => (
            <article key={a.id} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl">{a.program_name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {emails[a.user_id] ?? a.user_id} · submitted{" "}
                    {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>
                <select
                  value={a.status}
                  onChange={(e) => void update(a.id, { status: e.target.value })}
                  aria-label={`Status for ${a.program_name}`}
                  className="h-9 rounded-full border border-border bg-background px-3 text-sm"
                >
                  {REVIEW_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                <Field label="Estimated" value={a.estimated_amount ?? "-"} />
                <Field label="Household" value={a.household_size ? String(a.household_size) : "-"} />
                <Field label="Monthly income" value={a.monthly_income != null ? `$${a.monthly_income}` : "-"} />
                <Field label="State" value={a.state ?? "-"} />
              </dl>

              {a.notes && <p className="mt-4 rounded-xl bg-secondary/50 p-4 text-sm">{a.notes}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <input
                  defaultValue={a.reviewer_note ?? ""}
                  placeholder="Reviewer note"
                  maxLength={500}
                  onBlur={(e) => {
                    if (e.target.value !== (a.reviewer_note ?? "")) {
                      void update(a.id, { reviewer_note: e.target.value });
                    }
                  }}
                  className="h-10 min-w-64 flex-1 rounded-full border border-border bg-background px-4 text-sm"
                  aria-label={`Reviewer note for ${a.program_name}`}
                />
              </div>
            </article>
          ))
        )}
      </div>

      <section className="mt-14 border-t border-border pt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Confidential</p>
            <h2 className="mt-1 font-display text-3xl tracking-tight">Assistant tracker</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Internal-only: AI vs. eligibility-engine mismatches, most-applied programs, and a
              raw feed of what people are typing into the chat.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded-full bg-secondary px-3 py-1 font-semibold">
              {contradictions.length} contradictions
            </span>
            <span className="rounded-full bg-secondary px-3 py-1 font-semibold">
              {chatAnswers.length} chat msgs
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl">Most-applied programs</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                What people are actually submitting applications for.
              </p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
              {applicationsPoll.total} total
            </span>
          </div>
          {applicationsPoll.entries.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {applicationsPoll.entries.map((e) => {
                const pct = applicationsPoll.total ? (e.count / applicationsPoll.total) * 100 : 0;
                return (
                  <li key={e.label} className="rounded-xl border border-border/60 p-3">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-medium">{e.label}</p>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {e.count}× · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, pct)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {patterns.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h3 className="font-display text-2xl">Top contradiction patterns</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Programs the AI keeps recommending that the engine had to demote.
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
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{p.count}×</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl">Homescreen prompt poll</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                What visitors are typing into the AI search on the homepage.
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
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, pct)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-8 flex gap-2">
          {(["contradictions", "answers"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrackerTab(t)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                trackerTab === t ? "bg-primary text-primary-foreground" : "border border-border bg-background"
              }`}
            >
              {t === "contradictions" ? "Contradictions" : "Chat answers"}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {trackerTab === "contradictions" ? (
            contradictions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
                No contradictions logged yet.
              </div>
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
                </article>
              ))
            )
          ) : chatAnswers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
              No chat messages logged yet.
            </div>
          ) : (
            chatAnswers.map((a) => (
              <article key={a.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
                <p className="text-xs text-muted-foreground">
                  <b>{a.role}</b> · {a.user_id ? a.user_id.slice(0, 8) : "anon"} ·{" "}
                  {a.route ?? "-"} · {new Date(a.created_at).toLocaleString()}
                </p>
                <p className="mt-2 whitespace-pre-wrap">{a.content}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </Shell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 p-3">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value}</dd>
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
