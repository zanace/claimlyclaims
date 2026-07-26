import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Clock, Copy, Download, FileText, Gauge, Layers, RefreshCw, ShieldCheck, Sparkles, Trash2,
} from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ApplyWizard } from "@/components/apply-wizard";
import { openApplicationPdf } from "@/lib/application-pdf";
import {
  loadApplications, mergeIntoProfile, saveApplications, smartMetrics,
  type SavedApplication,
} from "@/lib/smart-profile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

const title = "My Applications - Claimly";
const description =
  "Every application you've completed with Claimly: status, application ID, PDFs, and one-tap reuse of your saved information.";

export const Route = createFileRoute("/applications")({
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
  component: Applications,
});

function Applications() {
  const [apps, setApps] = useState<SavedApplication[]>([]);
  const [wizard, setWizard] = useState<{ id: string; name: string } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    setApps(loadApplications());
  }, []);

  // Pull any applications saved from other devices, merge with local, keep both in sync.
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    void supabase
      .from("applications")
      .select("id, program_id, program_name, estimated_amount, status, created_at, notes")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active || !data) return;
        const remote: SavedApplication[] = data.map((r) => {
          let parsed: Partial<SavedApplication> = {};
          try {
            if (r.notes) parsed = JSON.parse(r.notes) as Partial<SavedApplication>;
          } catch {}
          return {
            id: parsed.id ?? r.id,
            programId: parsed.programId ?? r.program_id,
            programName: parsed.programName ?? r.program_name,
            submittedAt: parsed.submittedAt ?? r.created_at,
            status: parsed.status ?? r.status ?? "Submitted",
            estimate: parsed.estimate ?? r.estimated_amount ?? undefined,
            answers: parsed.answers ?? {},
            autoFilled: parsed.autoFilled ?? 0,
            asked: parsed.asked ?? 0,
            documentsReused: parsed.documentsReused ?? 0,
          };
        });
        const local = loadApplications();
        const byId = new Map<string, SavedApplication>();
        for (const a of [...remote, ...local]) byId.set(a.id, a);
        const merged = Array.from(byId.values()).sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
        );
        saveApplications(merged);
        setApps(merged);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const metrics = useMemo(() => smartMetrics(apps), [apps]);

  function openPdf(app: SavedApplication, print: boolean) {
    if (!openApplicationPdf(app, print)) toast.error("Allow pop-ups to view your PDF.");
  }

  function reuse(app: SavedApplication) {
    mergeIntoProfile(app.answers);
    toast.success("Information copied into your Smart Profile", {
      description: "Your next application will be pre-filled with it.",
    });
  }

  function remove(id: string) {
    const next = apps.filter((a) => a.id !== id);
    setApps(next);
    saveApplications(next);
  }

  const cards = [
    { label: "Applications completed", value: metrics.applications, Icon: Layers },
    { label: "Fields auto-filled", value: metrics.fieldsAutoFilled, Icon: Sparkles },
    { label: "Documents reused", value: metrics.documentsReused, Icon: FileText },
    { label: "Estimated hours saved", value: metrics.hoursSaved, Icon: Clock },
  ];

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-16">
        <div className="animate-fade-in-up">
          <p className="text-sm font-medium text-primary">My Applications</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Everything you've filed with Claimly.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Reopen any application, reuse its information, or download a copy for your records.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <div
              key={c.label}
              className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-sm backdrop-blur animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <c.Icon className="size-4" />
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{c.value}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur animate-fade-in-up">
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2 font-medium text-foreground">
              <Gauge className="size-4 text-primary" /> Profile completion
            </span>
            <span className="font-semibold text-primary">{metrics.completion}%</span>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000"
              style={{ width: `${metrics.completion}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            The more complete your profile, the less each new application asks you.{" "}
            <Link to="/settings" className="text-primary hover:underline">
              Review your saved info
            </Link>
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {apps.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center">
              <p className="text-muted-foreground">
                No applications yet. Start one from the{" "}
                <Link to="/programs" className="text-primary hover:underline">
                  programs directory
                </Link>{" "}
                and it will appear here automatically.
              </p>
            </div>
          ) : (
            apps.map((a, i) => (
              <article
                key={a.id}
                className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{a.programName}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(a.submittedAt).toLocaleDateString()} &middot; ID {a.id}
                      {a.estimate ? ` · ${a.estimate}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {a.status}
                  </span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {a.autoFilled} fields auto-filled from your Smart Profile, {a.asked} asked.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => openPdf(a, false)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                  >
                    <FileText className="size-3.5" /> View PDF
                  </button>
                  <button
                    onClick={() => openPdf(a, true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                  >
                    <Download className="size-3.5" /> Download PDF
                  </button>
                  <button
                    onClick={() => reuse(a)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                  >
                    <RefreshCw className="size-3.5" /> Reuse information
                  </button>
                  <button
                    onClick={() => {
                      reuse(a);
                      setWizard({ id: a.programId, name: a.programName });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
                  >
                    <Copy className="size-3.5" /> Duplicate application
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    aria-label="Delete record"
                    className="ml-auto rounded-full border border-border p-1.5 text-muted-foreground transition hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="mt-10 flex items-start gap-3 rounded-3xl border border-primary/20 bg-primary/5 p-5 text-sm text-foreground/85">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p>
            Your information is encrypted and stored securely. Claimly only reuses your information
            with your permission, and you can edit or delete your saved profile and documents at any
            time.
          </p>
        </div>
      </main>
      <SiteFooter />
      <ApplyWizard
        program={wizard}
        open={!!wizard}
        onClose={() => {
          setWizard(null);
          setApps(loadApplications());
        }}
      />
    </div>
  );
}
