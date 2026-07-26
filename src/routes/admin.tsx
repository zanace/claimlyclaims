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
  const { user, loading, isAdmin } = useAuth();
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

  const load = useCallback(async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("applications")
      .select("id, user_id, program_name, state, created_at")
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
    if (isAdmin && gate === "open") void load();
  }, [isAdmin, gate, load]);

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
          apps.map((a) => (
            <article
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
            >
              <div>
                <p className="font-display text-lg">{a.program_name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {emails[a.user_id] ?? "Unknown applicant"}
                  {a.state ? ` · ${a.state}` : ""}
                </p>
              </div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {new Date(a.created_at).toLocaleDateString()}
              </p>
            </article>
          ))
        )}
      </div>
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