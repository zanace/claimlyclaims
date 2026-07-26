import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  CheckCircle2, FileText, Lightbulb, Loader2, RefreshCw, ShieldCheck, Trash2, Upload,
} from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { authFetch } from "@/lib/api-client";
import type { DocReview } from "@/routes/api/doc-review";
import { useAuth } from "@/lib/use-auth";

const title = "Document library - Claimly Smart Profile";
const description =
  "A secure vault for your tax returns, pay stubs, leases, utility bills, and IDs, ready to reuse on your next benefits application.";

export const Route = createFileRoute("/vault")({
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
  component: Vault,
});

export const DOC_TYPES = [
  { key: "Tax Return", blurb: "Most recent 1040 or state return" },
  { key: "Pay Stub", blurb: "Last 30 days of income" },
  { key: "Lease", blurb: "Signed rental agreement" },
  { key: "Utility Bill", blurb: "Electric, gas, or water" },
  { key: "Insurance Card", blurb: "Health or dental coverage" },
  { key: "Birth Certificate", blurb: "For children you claim" },
  { key: "Driver License", blurb: "Or any government photo ID" },
];

type Row = {
  id: string;
  item: string;
  path: string;
  file_name: string | null;
  mime_type: string | null;
  created_at: string;
};

export function daysAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}

function Vault() {
  const { user } = useAuth();
  const userId = user?.id;
  const [rows, setRows] = useState<Row[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<string, DocReview>>({});
  const [reviewing, setReviewing] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    if (!userId) return setRows([]);
    const { data } = await supabase
      .from("document_uploads")
      .select("id, item, path, file_name, mime_type, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setRows((data as Row[]) ?? []);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const paths = rows.map((r) => r.path);
    if (!paths.length) return setUrls({});
    let active = true;
    void supabase.storage
      .from("claim-docs")
      .createSignedUrls(paths, 3600)
      .then(({ data }) => {
        if (!active || !data) return;
        const next: Record<string, string> = {};
        data.forEach((d) => d.path && d.signedUrl && (next[d.path] = d.signedUrl));
        setUrls(next);
      });
    return () => {
      active = false;
    };
  }, [rows]);

  async function upload(type: string, file: File) {
    if (!userId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", { description: "Please keep uploads under 10 MB." });
      return;
    }
    setBusy(type);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("claim-docs")
      .upload(path, file, { contentType: file.type || undefined });
    if (upErr) {
      setBusy(null);
      toast.error("Upload failed", { description: upErr.message });
      return;
    }
    const { error } = await supabase.from("document_uploads").insert({
      user_id: userId,
      item: type,
      path,
      file_name: file.name.slice(0, 160),
      mime_type: file.type || null,
    });
    setBusy(null);
    if (error) return toast.error("Could not save", { description: error.message });
    toast.success(`${type} saved to your library`);
    void load();
    void review(type, file);
  }

  async function review(type: string, file: File) {
    setReviewing(type);
    setReviews((r) => {
      const next = { ...r };
      delete next[type];
      return next;
    });
    let imageUrl: string | undefined;
    if (file.type.startsWith("image/") && file.size <= 4 * 1024 * 1024) {
      imageUrl = await new Promise<string | undefined>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      });
    }
    try {
      const res = await authFetch("/api/doc-review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          docType: type,
          fileName: file.name,
          mimeType: file.type,
          imageUrl,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as DocReview;
        setReviews((r) => ({ ...r, [type]: data }));
      }
    } catch {
      /* review is optional */
    }
    setReviewing(null);
  }

  async function remove(row: Row) {
    setBusy(row.item);
    await supabase.storage.from("claim-docs").remove([row.path]);
    const { error } = await supabase.from("document_uploads").delete().eq("id", row.id);
    setBusy(null);
    if (error) return toast.error("Could not delete", { description: error.message });
    void load();
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-16">
        <div className="animate-fade-in-up">
          <p className="text-sm font-medium text-primary">Document library</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Upload once. Reuse forever.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Every document you store here is offered back to you automatically the next time an
            application asks for it.
          </p>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-3xl border border-primary/20 bg-primary/5 p-5 text-sm text-foreground/85 animate-fade-in-up">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p>
            Your information is encrypted and stored securely. Claimly only reuses your documents
            with your permission, and you can replace or delete anything at any time.
          </p>
        </div>

        {!userId ? (
          <div className="mt-10 rounded-3xl border border-border bg-card p-8">
            <p className="text-muted-foreground">Sign in to open your secure document library.</p>
            <Link
              to="/auth"
              className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Log in or sign up
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-4">
            {DOC_TYPES.map((t, i) => {
              const mine = rows.filter((r) => r.item === t.key);
              const latest = mine[0];
              return (
                <section
                  key={t.key}
                  className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur transition hover:shadow-md animate-fade-in-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <FileText className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{t.key}</p>
                        <p className="text-xs text-muted-foreground">
                          {latest
                            ? `Uploaded ${daysAgo(latest.created_at)} - ${latest.file_name ?? "file"}`
                            : t.blurb}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {latest && urls[latest.path] && (
                        <a
                          href={urls[latest.path]}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                        >
                          View
                        </a>
                      )}
                      <input
                        ref={(el) => {
                          inputs.current[t.key] = el;
                        }}
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (f) void upload(t.key, f);
                        }}
                      />
                      <button
                        type="button"
                        disabled={busy === t.key}
                        onClick={() => inputs.current[t.key]?.click()}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
                      >
                        {busy === t.key ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : latest ? (
                          <RefreshCw className="size-3.5" />
                        ) : (
                          <Upload className="size-3.5" />
                        )}
                        {latest ? "Replace" : "Upload"}
                      </button>
                      {latest && (
                        <button
                          type="button"
                          onClick={() => remove(latest)}
                          aria-label={`Delete ${t.key}`}
                          className="rounded-full border border-border p-1.5 text-muted-foreground transition hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {mine.length > 1 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {mine.length} versions stored. The newest is used first.
                    </p>
                  )}
                  {reviewing === t.key && (
                    <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      Checking your {t.key.toLowerCase()} for anything that could hold it up...
                    </p>
                  )}
                  {reviews[t.key] && (
                    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 animate-fade-in-up">
                      <div className="flex items-center gap-2">
                        {reviews[t.key].quality === "good" ? (
                          <CheckCircle2 className="size-4 text-primary" />
                        ) : (
                          <Lightbulb className="size-4 text-primary" />
                        )}
                        <p className="text-sm font-semibold text-foreground">
                          {reviews[t.key].quality === "good"
                            ? "Looks good"
                            : "How to make this stronger"}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-foreground/85">{reviews[t.key].summary}</p>
                      {reviews[t.key].fixes?.length > 0 && (
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foreground/80">
                          {reviews[t.key].fixes.map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                      )}
                      {reviews[t.key].checklist?.length > 0 && (
                        <>
                          <p className="mt-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Must show
                          </p>
                          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground/80">
                            {reviews[t.key].checklist.map((c) => (
                              <li key={c}>{c}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
