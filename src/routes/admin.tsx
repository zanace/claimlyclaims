import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { isUnlocked, unlockSite } from "@/lib/gate.functions";

type Application = {
  id: string;
  user_id: string;
  program_name: string;
  state: string | null;
  created_at: string;
  status: string | null;
  reviewed_at: string | null;
};

const title = "Admin submissions | Claimly";
const description = "Internal Claimly console showing submitted benefit applications.";

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
  const { user, loading } = useAuth();
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
  const [fetching, setFetching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("applications")
      .select("id, user_id, program_name, state, created_at, status, reviewed_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setApps((data as Application[]) ?? []);
    const { data: profiles } = await supabase.from("profiles").select("id, email, full_name");
    const map: Record<string, string> = {};
    for (const p of profiles ?? [])
      map[p.id] = p.full_name ? `${p.full_name} · ${p.email}` : (p.email ?? p.id);
    setEmails(map);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (user && gate === "open") void load();
  }, [user, gate, load]);

  const decide = useCallback(
    async (app: Application, status: "Approved" | "Declined") => {
      setBusyId(app.id);
      const { error } = await supabase
        .from("applications")
        .update({
          status,
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", app.id);
      setBusyId(null);
      if (error) {
        toast.error(error.message);
        return;
      }
      setApps((prev) =>
        prev.map((a) =>
          a.id === app.id ? { ...a, status, reviewed_at: new Date().toISOString() } : a,
        ),
      );
      if (status === "Approved") {
        setCelebrate(app.program_name);
        setTimeout(() => setCelebrate(null), 2200);
      } else {
        toast.success("Application declined.");
      }
    },
    [user?.id],
  );

  if (loading || gate === "checking") {
    return <Shell><p className="text-muted-foreground">Loading…</p></Shell>;
  }

  if (gate === "locked") {
    return (
      <Shell>
        <h1 className="font-display text-4xl">Admin passcode</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Enter the admin passcode to open the console.
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
        <Link
          to="/auth"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Log in
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight">Submissions</h1>
          <p className="mt-3 text-muted-foreground">
            {apps.length.toLocaleString()} total submission{apps.length === 1 ? "" : "s"} worldwide.
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => void load()}
          disabled={fetching}
        >
          Refresh
        </Button>
      </div>

      <div className="mt-10 space-y-3">
        {apps.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No submissions yet.
          </div>
        ) : (
          apps.map((a) => {
            const approved = a.status === "Approved";
            const declined = a.status === "Declined";
            return (
              <article
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
              >
                <div>
                  <p className="flex items-center gap-2 font-display text-lg">
                    {a.program_name}
                    {approved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-3">
                          <path d="M4 12.5l5 5L20 6.5" />
                        </svg>
                        Accepted
                      </span>
                    )}
                    {declined && (
                      <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                        Declined
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {emails[a.user_id] ?? "Unknown applicant"}
                    {a.state ? ` · ${a.state}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </p>
                  {!approved && (
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={busyId === a.id}
                      onClick={() => void decide(a, "Approved")}
                    >
                      {busyId === a.id ? "Saving…" : "Accept"}
                    </Button>
                  )}
                  {!declined && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={busyId === a.id}
                      onClick={() => void decide(a, "Declined")}
                    >
                      Decline
                    </Button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {celebrate && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-6 animate-overlay-in">
          <div className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-card px-12 py-10 text-center shadow-2xl animate-modal-in">
            <div className="flex size-24 items-center justify-center rounded-full bg-primary/10 animate-check-pop">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-12 text-primary"
              >
                <path d="M4 12.5l5 5L20 6.5" className="animate-check-draw" />
              </svg>
            </div>
            <div>
              <p className="font-display text-3xl">Application accepted</p>
              <p className="mt-2 text-sm text-muted-foreground">{celebrate}</p>
            </div>
          </div>
        </div>
      )}
    </Shell>
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