import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { unlockSite } from "@/lib/gate.functions";

const title = "Enter passcode | Claimly";
const description = "Claimly is in private preview. Enter your passcode to continue.";

export const Route = createFileRoute("/unlock")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Unlock,
});

function Unlock() {
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const passcode = String(new FormData(event.currentTarget).get("passcode") ?? "");
    setBusy(true);
    const result = await unlock({ data: { passcode } });
    setBusy(false);
    if (result.ok) {
      await router.invalidate();
      await router.navigate({ to: "/" });
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 font-sans">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        <img src={logo} alt="Claimly logo" width={44} height={44} className="mx-auto size-11 rounded-xl" />
        <h1 className="mt-5 font-display text-3xl tracking-tight">Private preview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the passcode to get into Claimly.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            name="passcode"
            type="password"
            inputMode="numeric"
            autoFocus
            autoComplete="current-password"
            placeholder="Passcode"
            onChange={() => setError(false)}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-center text-lg tracking-[0.4em] outline-none focus:border-primary"
          />
          {error && <p className="text-sm text-destructive">That passcode isn't right.</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-60"
          >
            {busy ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
