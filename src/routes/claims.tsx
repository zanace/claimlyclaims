import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PROGRAMS } from "@/lib/programs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import {
  CLAIM_STATUSES,
  STATUS_TONE,
  loadClaims,
  saveClaims,
  type Claim,
  type ClaimStatus,
} from "@/lib/claims";

const title = "Track your benefit claims | Claimly";
const description =
  "A simple tracker for every benefit claim you file: status, estimated value, and what to do next. Stored privately in your browser.";

export const Route = createFileRoute("/claims")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Claims,
});

function Claims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [programId, setProgramId] = useState(PROGRAMS[0]?.id ?? "");
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function submitForReview(claim: Claim) {
    if (!user) return;
    setSubmitting(claim.id);
    const { error } = await supabase.from("applications").insert({
      user_id: user.id,
      program_id: claim.programId,
      program_name: claim.programName,
      estimated_amount: claim.amount,
      status: "Submitted",
    });
    setSubmitting(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStatus(claim.id, "Submitted");
    toast.success("Sent to the Claimly review team.");
  }

  useEffect(() => {
    setClaims(loadClaims());
  }, []);

  function update(next: Claim[]) {
    setClaims(next);
    saveClaims(next);
  }

  function addClaim() {
    const program = PROGRAMS.find((p) => p.id === programId);
    if (!program || claims.some((c) => c.programId === program.id)) return;
    update([
      ...claims,
      {
        id: `${program.id}-${Date.now()}`,
        programId: program.id,
        programName: program.name,
        status: "Not started",
        amount: program.estimate,
        updatedAt: new Date().toISOString(),
      },
    ]);
  }

  function setStatus(id: string, status: ClaimStatus) {
    update(
      claims.map((c) =>
        c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c,
      ),
    );
  }

  const open = claims.filter((c) => c.status !== "Approved" && c.status !== "Denied").length;
  const approved = claims.filter((c) => c.status === "Approved").length;

  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="font-display text-5xl tracking-tight md:text-6xl">Your claims</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Everything you are filing, in one place. Tracked on this device — and you can send any
          claim to our review team once you{"'"}re logged in.
        </p>
        {!user && (
          <p className="mt-3 text-sm text-muted-foreground">
            <Link to="/auth" className="text-primary underline underline-offset-4">
              Log in
            </Link>{" "}
            to submit a claim for review.
          </p>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total claims", value: claims.length },
            { label: "In progress", value: open },
            { label: "Approved", value: approved },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="h-10 rounded-full border border-border bg-background px-4 text-sm"
          >
            {PROGRAMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button className="rounded-full" onClick={addClaim}>
            Add claim
          </Button>
          <span className="text-sm text-muted-foreground">
            Not sure what to add?{" "}
            <Link to="/eligibility" className="text-primary underline underline-offset-4">
              Run the estimator
            </Link>
          </span>
        </div>

        <div className="mt-8 space-y-4">
          {claims.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
              No claims tracked yet.
            </div>
          ) : (
            claims.map((c) => (
              <article
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
              >
                <div>
                  <h2 className="font-display text-xl">{c.programName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {c.amount} · updated {new Date(c.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_TONE[c.status]}`}
                  >
                    {c.status}
                  </span>
                  <select
                    value={c.status}
                    onChange={(e) => setStatus(c.id, e.target.value as ClaimStatus)}
                    aria-label={`Status for ${c.programName}`}
                    className="h-9 rounded-full border border-border bg-background px-3 text-sm"
                  >
                    {CLAIM_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {user && (
                    <Button
                      variant="outline"
                      className="rounded-full"
                      disabled={submitting === c.id}
                      onClick={() => void submitForReview(c)}
                    >
                      Submit for review
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="rounded-full text-muted-foreground"
                    onClick={() => update(claims.filter((x) => x.id !== c.id))}
                  >
                    Remove
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}