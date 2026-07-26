import { store } from "@/lib/store";
import { loadAnswers, saveAnswers, type Answers } from "@/lib/applicant-profile";

/** Canonical reusable fields that make up the Claimly Smart Profile. */
export const SMART_FIELDS: Array<{ id: string; label: string; group: string }> = [
  { id: "full_name", label: "Full name", group: "About you" },
  { id: "dob", label: "Date of birth", group: "About you" },
  { id: "email", label: "Email address", group: "About you" },
  { id: "phone", label: "Phone number", group: "About you" },
  { id: "preferred_language", label: "Preferred language", group: "About you" },
  { id: "emergency_contact", label: "Emergency contact", group: "About you" },
  { id: "address", label: "Home address", group: "Where you live" },
  { id: "zip", label: "ZIP code", group: "Where you live" },
  { id: "county", label: "County", group: "Where you live" },
  { id: "state", label: "State", group: "Where you live" },
  { id: "housing", label: "Housing status (rent/own)", group: "Where you live" },
  { id: "monthly_rent", label: "Monthly rent", group: "Where you live" },
  { id: "monthly_mortgage", label: "Monthly mortgage", group: "Where you live" },
  { id: "household_size", label: "Household size", group: "Household" },
  { id: "kids", label: "Number of children", group: "Household" },
  { id: "veteran", label: "Veteran status", group: "Household" },
  { id: "student", label: "Student status", group: "Household" },
  { id: "disability", label: "Disability status", group: "Household" },
  { id: "monthly_income", label: "Monthly income", group: "Income & work" },
  { id: "annual_income", label: "Annual income", group: "Income & work" },
  { id: "employment", label: "Employment status", group: "Income & work" },
  { id: "employer", label: "Employer name", group: "Income & work" },
];

export const SMART_FIELD_LABELS: Record<string, string> = Object.fromEntries(
  SMART_FIELDS.map((f) => [f.id, f.label]),
);

export function filledFields(answers: Answers = loadAnswers()): string[] {
  return SMART_FIELDS.filter((f) => String(answers[f.id] ?? "").trim()).map((f) => f.id);
}

export function profileCompletion(answers: Answers = loadAnswers()): number {
  return Math.round((filledFields(answers).length / SMART_FIELDS.length) * 100);
}

/** Rough but honest: ~25 seconds of typing/looking-up saved per reused field. */
export function minutesSaved(fieldCount: number): number {
  return Math.max(0, Math.round((fieldCount * 25) / 60));
}

export type SavedApplication = {
  id: string;
  programId: string;
  programName: string;
  submittedAt: string;
  status: string;
  estimate?: string;
  answers: Answers;
  autoFilled: number;
  asked: number;
  documentsReused: number;
};

const APPS_KEY = "claimly.applications.v1";

export function loadApplications(): SavedApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = store.getItem(APPS_KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedApplication[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveApplications(apps: SavedApplication[]) {
  if (typeof window === "undefined") return;
  store.setItem(APPS_KEY, JSON.stringify(apps));
}

export function recordApplication(app: SavedApplication) {
  const apps = loadApplications();
  saveApplications([app, ...apps.filter((a) => a.id !== app.id)].slice(0, 100));
}

export function newApplicationId() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `CLM-${new Date().getFullYear()}-${n}`;
}

/** Merge new answers into the Smart Profile (used when the user says "update profile"). */
export function mergeIntoProfile(patch: Answers) {
  const next = { ...loadAnswers(), ...patch };
  saveAnswers(next);
  return next;
}

export type SmartMetrics = {
  applications: number;
  fieldsAutoFilled: number;
  documentsReused: number;
  minutesSaved: number;
  hoursSaved: string;
  completion: number;
};

export function smartMetrics(apps: SavedApplication[] = loadApplications()): SmartMetrics {
  const fieldsAutoFilled = apps.reduce((n, a) => n + (a.autoFilled || 0), 0);
  const documentsReused = apps.reduce((n, a) => n + (a.documentsReused || 0), 0);
  const mins = minutesSaved(fieldsAutoFilled) + documentsReused * 2;
  return {
    applications: apps.length,
    fieldsAutoFilled,
    documentsReused,
    minutesSaved: mins,
    hoursSaved: mins < 60 ? `${mins} min` : `${(mins / 60).toFixed(1)} hr`,
    completion: profileCompletion(),
  };
}

/** Plain-language memory summary handed to the AI so it can reference past applications. */
export function memorySummary(): string {
  const answers = loadAnswers();
  const apps = loadApplications();
  const known = SMART_FIELDS.filter((f) => String(answers[f.id] ?? "").trim())
    .map((f) => `${f.label}: ${answers[f.id]}`)
    .join("; ");
  const past = apps
    .slice(0, 8)
    .map((a) => `${a.programName} (${new Date(a.submittedAt).toLocaleDateString()}, ${a.status})`)
    .join("; ");
  const parts: string[] = [];
  if (known) parts.push(`Smart Profile on file: ${known}.`);
  if (past) parts.push(`Previously applied inside Claimly: ${past}.`);
  if (parts.length) {
    parts.push(
      "Reference this memory naturally (e.g. \"Your address hasn't changed since your SNAP application\"), never re-ask for anything listed, and offer to reuse it.",
    );
  }
  return parts.join("\n");
}
