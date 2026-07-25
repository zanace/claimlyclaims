import { useEffect } from "react";
import { PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export type UserInfo = {
  state: string;
  householdSize: string;
  monthlyIncome: string;
  filingStatus: string;
  dependents: string;
  workSituation: string;
  housing: string;
  healthCoverage: string;
  lastFiledYear: string;
  notes: string;
};

export const EMPTY_INFO: UserInfo = {
  state: "",
  householdSize: "",
  monthlyIncome: "",
  filingStatus: "",
  dependents: "",
  workSituation: "",
  housing: "",
  healthCoverage: "",
  lastFiledYear: "",
  notes: "",
};

const STORAGE_KEY = "claimly.user-info";

const FIELDS: { key: keyof UserInfo; label: string; placeholder: string }[] = [
  { key: "state", label: "State", placeholder: "Ohio" },
  { key: "householdSize", label: "People in household", placeholder: "3" },
  { key: "monthlyIncome", label: "Monthly income (before tax)", placeholder: "2,400" },
  { key: "filingStatus", label: "Tax filing status", placeholder: "Head of household" },
  { key: "dependents", label: "Kids / dependents & ages", placeholder: "2 kids, 4 and 9" },
  { key: "workSituation", label: "Work situation", placeholder: "Part-time + some 1099" },
  { key: "housing", label: "Housing", placeholder: "Renting, $1,100/mo" },
  { key: "healthCoverage", label: "Health coverage", placeholder: "Uninsured" },
  { key: "lastFiledYear", label: "Last tax year you filed", placeholder: "2023" },
  { key: "notes", label: "Anything else", placeholder: "Veteran, recently laid off..." },
];

export function loadStoredInfo(): UserInfo {
  if (typeof window === "undefined") return EMPTY_INFO;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY_INFO, ...(JSON.parse(raw) as Partial<UserInfo>) } : EMPTY_INFO;
  } catch {
    return EMPTY_INFO;
  }
}

export function infoToPrompt(info: UserInfo): string {
  const lines = FIELDS.filter((f) => info[f.key].trim()).map(
    (f) => `- ${f.label}: ${info[f.key].trim()}`,
  );
  return lines.length ? lines.join("\n") : "";
}

export function InfoPanel({
  info,
  onChange,
}: {
  info: UserInfo;
  onChange: (info: UserInfo) => void;
}) {
  // Prefill anything blank from the signed-in profile, once.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user || cancelled) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("state, household_size, monthly_income")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile || cancelled) return;
      const stored = loadStoredInfo();
      const merged: UserInfo = {
        ...stored,
        state: stored.state || profile.state || "",
        householdSize: stored.householdSize || (profile.household_size?.toString() ?? ""),
        monthlyIncome: stored.monthlyIncome || (profile.monthly_income?.toString() ?? ""),
      };
      onChange(merged);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key: keyof UserInfo, value: string) => {
    const next = { ...info, [key]: value.slice(0, 200) };
    onChange(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — the chat still works, it just won't remember */
    }
  };

  const filled = FIELDS.filter((f) => info[f.key].trim()).length;

  return (
    <aside className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="flex items-center gap-2">
        <PencilLine className="size-4 text-accent" />
        <h2 className="font-display text-xl">Your info</h2>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Fill in what you're comfortable sharing — the assistant reads this on every message so you
        don't have to repeat yourself. Stays in this browser. Never enter your SSN or bank details.
      </p>

      <div className="mt-5 space-y-3">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`info-${field.key}`} className="text-xs text-muted-foreground">
              {field.label}
            </Label>
            <Input
              id={`info-${field.key}`}
              value={info[field.key]}
              placeholder={field.placeholder}
              maxLength={200}
              onChange={(e) => set(field.key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{filled}/{FIELDS.length} filled</span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            onChange(EMPTY_INFO);
            window.localStorage.removeItem(STORAGE_KEY);
          }}
        >
          Clear
        </Button>
      </div>
    </aside>
  );
}
