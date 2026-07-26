import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { ExternalLink, FileText, Loader2, MapPin, X } from "lucide-react";
import type { ApplyGuide } from "@/routes/api/guide";
import { loadStoredInfo } from "@/components/info-panel";

export function OfficialGuide({
  program,
  open,
  onClose,
}: {
  program: { id: string; name: string } | null;
  open: boolean;
  onClose: () => void;
}) {
  const [guide, setGuide] = useState<ApplyGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState("");

  useEffect(() => {
    if (!open || !program) return;
    const userState = loadStoredInfo().state ?? "";
    setState(userState);
    setGuide(null);
    setLoading(true);
    fetch("/api/guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ program, state: userState }),
    })
      .then((r) => r.json())
      .then((d: ApplyGuide) => setGuide(d))
      .catch(() => setGuide(null))
      .finally(() => setLoading(false));
  }, [open, program]);

  if (!open || !program || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-3xl border border-border bg-card text-card-foreground shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              How to apply
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{program.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {state ? `Steps for ${state}` : "Add your state in Your info for state-specific steps"}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-secondary">
            <X className="size-4" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-3 p-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Looking up the exact steps{state ? ` for ${state}` : ""}...
          </div>
        )}

        {guide && !loading && (
          <div className="space-y-6 p-6">
            <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Where it's available
              </p>
              <p className="mt-2 text-sm leading-relaxed">{guide.availability}</p>
              {guide.agency && (
                <p className="mt-2 text-sm text-muted-foreground">Run by: {guide.agency}</p>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold">Step by step</p>
              <ol className="mt-3 space-y-3">
                {guide.steps.map((s, i) => (
                  <li key={s} className="flex gap-3 text-sm leading-relaxed">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 p-4">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <FileText className="size-3.5" /> Documents to have ready
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {guide.documents.map((d) => (
                    <li key={d}>• {d}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border/70 p-4">
                <p className="text-sm font-semibold">Timeline & tips</p>
                <p className="mt-2 text-sm text-muted-foreground">{guide.timeline}</p>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {(guide.tips ?? []).map((t) => (
                    <li key={t}>• {t}</li>
                  ))}
                </ul>
              </div>
            </div>

            <a
              href={guide.officialUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-primary-foreground transition hover:brightness-110"
            >
              <ExternalLink className="size-4" />
              Open {guide.officialLabel}
            </a>
            <p className="text-center text-xs text-muted-foreground">
              Official government page. Claimly never charges for an application.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
