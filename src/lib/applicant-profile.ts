// Shared answer memory. Every question the user answers anywhere in Claimly is
// stored here by canonical field id, so we never ask the same thing twice.
export type FieldType = "text" | "number" | "zip" | "money" | "choice" | "yesno";

export type WizardQuestion = {
  id: string;
  label: string;
  help?: string;
  type: FieldType;
  choices?: string[];
  optional?: boolean;
};

export type Answers = Record<string, string>;

const KEY = "claimly.applicantProfile";

export const FIELD_LABELS: Record<string, string> = {
  full_name: "Full name",
  dob: "Date of birth",
  zip: "ZIP code",
  state: "State",
  household_size: "People in your household",
  monthly_income: "Household income before taxes",
  employment: "Work situation",
  housing: "Housing situation",
  kids: "Children under 18",
  kids_ages: "Ages of children",
  pregnant: "Pregnant or new parent",
  insurance: "Health insurance",
  citizenship: "Citizenship or immigration status",
  disability: "Disability or long-term illness",
  benefits_now: "Benefits you already receive",
  phone: "Phone number",
  email: "Email address",
};

export function loadAnswers(): Answers {
  if (typeof window === "undefined") return {};
  try {
    const raw = store.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Answers) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveAnswers(next: Answers) {
  if (typeof window === "undefined") return;
  try {
    store.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export function labelFor(id: string) {
  return FIELD_LABELS[id] ?? id.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
