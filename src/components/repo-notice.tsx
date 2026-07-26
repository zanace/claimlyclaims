import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const REPO_URL = "https://github.com/zanace/claimlyclaims";
const KEY = "claimly-repo-notice-seen";

export function RepoNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return;
    } catch {
      /* storage blocked - still show once */
    }
    setOpen(true);
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="repo-notice-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-5 animate-overlay-in"
    >
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-2xl animate-modal-in">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
          Notice
        </span>
        <h2 id="repo-notice-title" className="mt-4 font-display text-3xl tracking-tight">
          Heads up before you continue
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Claimly is an open project. Please open the GitHub repository in a new tab, or copy the
          link below, before using the site.
        </p>
        <p className="mt-4 break-all rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm">
          {REPO_URL}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="rounded-full">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              Open repository in new tab
            </a>
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(REPO_URL);
                toast.success("Repository link copied.");
              } catch {
                toast.error("Couldn't copy — select the link above instead.");
              }
            }}
          >
            Copy link
          </Button>
          <Button variant="ghost" className="rounded-full text-muted-foreground" onClick={dismiss}>
            Continue to Claimly
          </Button>
        </div>
      </div>
    </div>
  );
}