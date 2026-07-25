import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Trash2, Save, LogOut, User as UserIcon, Bookmark, ListChecks } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import {
  FIELD_LABELS, labelFor, loadAnswers, saveAnswers, type Answers,
} from "@/lib/applicant-profile";

const title = "Settings - Your saved Claimly info";
const description =
  "One place to view, edit, and delete every detail Claimly has saved for you: profile, application answers, and bookmarked programs.";

export const Route = createFileRoute("/settings")({
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
  component: SettingsPage,
});

type ProfileForm = {
  full_name: string;
  email: string;
  phone: string;
  state: string;
  household_size: string;
  monthly_income: string;
};

const EMPTY: ProfileForm = {
  full_name: "", email: "", phone: "", state: "", household_size: "", monthly_income: "",
};

const SAVED_KEY = "claimly.saved";

function SettingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileForm>(EMPTY);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    setAnswers(loadAnswers());
    try {
      const raw = store.getItem(SAVED_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) { setFetching(false); return; }
    let active = true;
    setFetching(true);
    supabase
      .from("profiles")
      .select("full_name, email, phone, state, household_size, monthly_income")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) toast.error(error.message);
        setForm({
          full_name: data?.full_name ?? (user.user_metadata?.full_name as string) ?? "",
          email: data?.email ?? user.email ?? "",
          phone: data?.phone ?? "",
          state: data?.state ?? "",
          household_size: data?.household_size != null ? String(data.household_size) : "",
          monthly_income: data?.monthly_income != null ? String(data.monthly_income) : "",
        });
        setFetching(false);
      });
    return () => { active = false; };
  }, [user]);

  const answerEntries = useMemo(
    () => Object.entries(answers).filter(([, v]) => String(v ?? "").trim().length > 0),
    [answers],
  );

  function set(key: keyof ProfileForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: form.full_name.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      state: form.state.trim() || null,
      household_size: form.household_size ? Number(form.household_size) : null,
      monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved.");
  }

  function updateAnswer(id: string, value: string) {
    const next = { ...answers, [id]: value };
    setAnswers(next);
    saveAnswers(next);
  }

  function deleteAnswer(id: string) {
    const next = { ...answers };
    delete next[id];
    setAnswers(next);
    saveAnswers(next);
    toast.success(`${labelFor(id)} removed.`);
  }

  function clearAllAnswers() {
    if (!confirm("Clear every saved application answer on this device?")) return;
    setAnswers({});
    saveAnswers({});
    toast.success("All answers cleared.");
  }

  function removeSaved(id: string) {
    const next = saved.filter((s) => s !== id);
    setSaved(next);
    try { store.setItem(SAVED_KEY, JSON.stringify(next)); } catch {}
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (loading || (user && fetching)) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16">
          <p className="text-sm text-muted-foreground">Loading your settings...</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Settings</p>
            <h1 className="mt-2 font-display text-4xl tracking-tight">Your saved info</h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Everything Claimly remembers about you lives here. Edit it, delete it, or sign out - it's yours.
            </p>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>

        {/* Account / Profile */}
        <section className="mt-10 rounded-2xl border border-border bg-card p-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <UserIcon className="size-4 text-primary" /> Account profile
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved to your login and reused across every eligibility check.
          </p>
          <form onSubmit={saveProfile} className="mt-6 space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" value={form.full_name} maxLength={100} onChange={(e) => set("full_name", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Contact email</Label>
              <Input id="email" type="email" maxLength={255} value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" maxLength={30} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" maxLength={30} value={form.state} onChange={(e) => set("state", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="household_size">Household size</Label>
                <Input id="household_size" type="number" min={1} max={20} value={form.household_size} onChange={(e) => set("household_size", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monthly_income">Monthly income</Label>
                <Input id="monthly_income" type="number" min={0} value={form.monthly_income} onChange={(e) => set("monthly_income", e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="inline-flex items-center gap-2">
              <Save className="size-4" /> {saving ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </section>

        {/* Application answers */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ListChecks className="size-4 text-primary" /> Application answers
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Answers reused across every program's application wizard.
              </p>
            </div>
            {answerEntries.length > 0 && (
              <button
                onClick={clearAllAnswers}
                className="text-xs text-destructive hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          {answerEntries.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Nothing saved yet. Start an application from the homepage - answers are stored automatically.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {answerEntries.map(([id, value]) => (
                <div key={id} className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`ans_${id}`}>{labelFor(id)}</Label>
                    <button
                      onClick={() => deleteAnswer(id)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" /> Remove
                    </button>
                  </div>
                  <Input
                    id={`ans_${id}`}
                    value={value}
                    onChange={(e) => updateAnswer(id, e.target.value)}
                  />
                </div>
              ))}
              <p className="pt-2 text-xs text-muted-foreground">
                Known fields: {Object.keys(FIELD_LABELS).length}. Edits save automatically.
              </p>
            </div>
          )}
        </section>

        {/* Saved programs */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bookmark className="size-4 text-primary" /> Saved programs
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Programs you've bookmarked for later.
          </p>
          {saved.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              No bookmarks yet. Browse the <Link to="/programs" className="text-primary hover:underline">programs directory</Link>.
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-border">
              {saved.map((id) => (
                <li key={id} className="flex items-center justify-between py-3">
                  <span className="text-sm text-foreground">{id}</span>
                  <button
                    onClick={() => removeSaved(id)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3" /> Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}