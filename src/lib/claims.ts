import { store } from "@/lib/store";
export type ClaimStatus =
  | "Not started"
  | "Gathering documents"
  | "Submitted"
  | "Approved"
  | "Denied";

export const CLAIM_STATUSES: ClaimStatus[] = [
  "Not started",
  "Gathering documents",
  "Submitted",
  "Approved",
  "Denied",
];

export type Claim = {
  id: string;
  programId: string;
  programName: string;
  status: ClaimStatus;
  amount: string;
  updatedAt: string;
};

const KEY = "claimly.claims.v1";

export function loadClaims(): Claim[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = store.getItem(KEY);
    return raw ? (JSON.parse(raw) as Claim[]) : [];
  } catch {
    return [];
  }
}

export function saveClaims(claims: Claim[]) {
  if (typeof window === "undefined") return;
  store.setItem(KEY, JSON.stringify(claims));
}

export const STATUS_TONE: Record<ClaimStatus, string> = {
  "Not started": "bg-secondary text-secondary-foreground",
  "Gathering documents": "bg-accent/30 text-foreground",
  Submitted: "bg-primary/15 text-primary",
  Approved: "bg-primary text-primary-foreground",
  Denied: "bg-destructive/15 text-destructive",
};

export type DocGroup = {
  key: string;
  title: string;
  blurb: string;
  items: string[];
};

export const DOC_GROUPS: DocGroup[] = [
  {
    key: "identity",
    title: "Identity & household",
    blurb: "Nearly every claim starts here. Gather once, reuse everywhere.",
    items: [
      "Photo ID for every adult in the household",
      "Social Security numbers or ITINs",
      "Birth certificates for children you claim",
      "Proof of current address (lease, utility bill, or mail)",
    ],
  },
  {
    key: "income",
    title: "Income & work",
    blurb: "Caseworkers verify the last 30-90 days of income for most programs.",
    items: [
      "Recent pay stubs (last 30 days)",
      "W-2s and 1099s for each tax year you are claiming",
      "Self-employment ledger or app earnings summaries",
      "Unemployment, disability, or child support award letters",
    ],
  },
  {
    key: "housing",
    title: "Housing & utilities",
    blurb: "Needed for rent help, energy assistance, and some food benefits.",
    items: [
      "Signed lease or mortgage statement",
      "Most recent electric, gas, or water bills",
      "Shutoff or eviction notice, if you have one",
    ],
  },
  {
    key: "medical",
    title: "Medical & childcare",
    blurb: "Unlocks deductions that raise your benefit amount.",
    items: [
      "Insurance cards or denial letters",
      "Out-of-pocket medical bills (helps seniors and disabled applicants)",
      "Childcare invoices or provider statements",
    ],
  },
];