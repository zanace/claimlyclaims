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
    setFetching(false);
  }, []);

  useEffect(() => {
    if (isAdmin && gate === "open") void load();
  }, [isAdmin, gate, load]);

  const visible = useMemo(
    () => (filter === "All" ? apps : apps.filter((a) => a.status === filter)),
    [apps, filter],
  );

  async function update(id: string, patch: Partial<Application>) {
    const { error } = await supabase.from("applications").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
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
            toast("Email not sent — connect Resend in Lovable settings.");
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
