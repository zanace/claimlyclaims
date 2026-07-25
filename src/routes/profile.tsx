import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

const title = "Your Claimly profile | Account details";
const description =
  "Update the household details Claimly uses to match you with tax refunds, food assistance, and other benefit programs.";

export const Route = createFileRoute("/profile")({
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
  component: Profile,
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
  full_name: "",
  email: "",
  phone: "",
  state: "",
  household_size: "",
  monthly_income: "",
};

function Profile() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState<ProfileForm>(EMPTY);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setFetching(false);
      return;
    }
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
    return () => {
      active = false;
    };
  }, [user]);

  function set(key: keyof ProfileForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (form.full_name.trim().length > 100) {
      toast.error("Name must be under 100 characters.");
      return;
    }
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
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved.");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="font-display text-4xl tracking-tight">Your profile</h1>
        <p className="mt-3 text-muted-foreground">
          These details stay with your login and pre-fill your eligibility checks and claims.
        </p>

        {loading || (user && fetching) ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading your profile…</p>
        ) : !user ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-8">
            <p className="text-muted-foreground">Log in to view and edit your profile.</p>
            <Link
              to="/auth"
              className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Log in or sign up
            </Link>
          </div>
        ) : (
          <form onSubmit={save} className="mt-10 space-y-6 rounded-2xl border border-border bg-card p-8">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                maxLength={100}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder="Alex Rivera"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Contact email</Label>
              <Input
                id="email"
                type="email"
                maxLength={255}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                maxLength={30}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  maxLength={30}
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  placeholder="TX"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="household_size">Household size</Label>
                <Input
                  id="household_size"
                  type="number"
                  min={1}
                  max={20}
                  value={form.household_size}
                  onChange={(e) => set("household_size", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monthly_income">Monthly income</Label>
                <Input
                  id="monthly_income"
                  type="number"
                  min={0}
                  value={form.monthly_income}
                  onChange={(e) => set("monthly_income", e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save profile"}
              </Button>
              <Link to="/claims" className="text-sm text-muted-foreground hover:text-foreground">
                Go to my claims
              </Link>
            </div>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}