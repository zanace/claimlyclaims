// Deterministic eligibility screener. The AI is fuzzy, so we back it up
// with hard rules: extract signals from what the user actually said /
// stored, then knock out programs that clearly don't fit (no kids ->
// no CTC/WIC; not a vet -> no VA; too high income -> no need-based).
import { PROGRAMS } from "./programs";

export type Signals = {
  householdSize?: number;
  annualIncome?: number;
  hasKids?: boolean;
  isPregnant?: boolean;
  isVeteran?: boolean;
  isSenior?: boolean;        // 60+
  isMedicareAge?: boolean;   // 65+
  hasDisability?: boolean;
  isStudent?: boolean;
  isWorking?: boolean;
  isUnemployed?: boolean;
  isRenter?: boolean;
  isHomeowner?: boolean;
  state?: string;
};

function parseMoney(raw: string): number | undefined {
  const s = raw.replace(/[$\s,]/g, "").toLowerCase();
  const m = s.match(/^(\d+(?:\.\d+)?)(k|m)?$/);
  if (!m) return undefined;
  let n = parseFloat(m[1]);
  if (m[2] === "k") n *= 1_000;
  if (m[2] === "m") n *= 1_000_000;
  return isFinite(n) && n >= 0 ? n : undefined;
}

export function extractSignals(text: string, base: Partial<Signals> = {}): Signals {
  const out: Signals = { ...base };
  const s = (text || "").toLowerCase();
  if (!s.trim()) return out;

  if (out.householdSize === undefined) {
    const hh = s.match(/(?:household|family|home)[^0-9\n]{0,25}(\d{1,2})\b|\b(\d{1,2})\s*(?:people|persons?|members?|of us)\b/);
    if (hh) {
      const n = parseInt(hh[1] || hh[2], 10);
      if (n >= 1 && n <= 20) out.householdSize = n;
    }
  }

  if (out.hasKids === undefined) {
    if (/\b(no kids?|no children|childless|no dependents?|zero kids?|0 kids?|0 children|just me\b|only me\b|single(?:,| and| with no|$))/.test(s)) {
      out.hasKids = false;
    } else {
      const kc = s.match(/\b(\d+)\s*(?:kids?|children|dependents?|sons?|daughters?)\b/);
      if (kc && parseInt(kc[1], 10) > 0) out.hasKids = true;
      else if (/\b(mom|mother|dad|father|parent|my kid|my child|my baby|toddler|infant|newborn|stepchild|foster kid|kids?)\b/.test(s)) {
        out.hasKids = true;
      }
    }
  }

  if (out.isPregnant === undefined && /\b(pregnan(?:t|cy)|expecting a baby|prenatal|due in)\b/.test(s)) {
    out.isPregnant = true;
  }

  if (out.isVeteran === undefined) {
    if (/\b(not (?:a )?veteran|never served|no military)\b/.test(s)) out.isVeteran = false;
    else if (/\b(veteran|va (?:benefits|disability|healthcare|loan)|active duty|us military|army|navy|marines?|air force|coast guard|national guard|reservist|served in the)\b/.test(s)) out.isVeteran = true;
  }

  const age = s.match(/\b(?:i am|i'm|im|age[d]?)\s*(\d{2,3})\b|\b(\d{2,3})\s*(?:years?\s*old|yo|y\/o|yrs?)\b/);
  const ageNum = age ? parseInt(age[1] || age[2], 10) : undefined;
  if (ageNum && ageNum > 0 && ageNum < 120) {
    if (ageNum >= 60) out.isSenior = true;
    if (ageNum >= 65) out.isMedicareAge = true;
    if (ageNum < 60 && out.isSenior === undefined) out.isSenior = false;
    if (ageNum < 65 && out.isMedicareAge === undefined) out.isMedicareAge = false;
  }
  if (out.isSenior === undefined && /\b(senior citizen|retired|elderly)\b/.test(s)) out.isSenior = true;

  if (out.hasDisability === undefined && /\b(disab(?:le|led|ility)|ssdi|ssi disability|blind|legally deaf|wheelchair|chronic illness|autis|adhd)\b/.test(s)) {
    out.hasDisability = true;
  }

  if (out.isStudent === undefined && /\b(student|college|university|grad school|undergrad|fafsa|tuition|pell|community college|trade school|vocational)\b/.test(s)) {
    out.isStudent = true;
  }

  if (/\b(unemploy(?:ed|ment)|laid off|jobless|between jobs|out of work|fired|no job)\b/.test(s)) out.isUnemployed = true;
  if (out.isWorking === undefined && /\b(work(?:ing)?|employed|my job|salary|paycheck|part[- ]time|full[- ]time|1099|w[- ]?2|self[- ]employed|freelance|gig work)\b/.test(s)) {
    out.isWorking = true;
  }

  if (out.isRenter === undefined && /\b(rent(?:ing|er)?\b|apartment|lease|landlord)/.test(s)) out.isRenter = true;
  if (out.isHomeowner === undefined && /\b(homeowner|own my (?:home|house)|mortgage|deed to)/.test(s)) out.isHomeowner = true;

  if (out.annualIncome === undefined) {
    const yr = s.match(/\$?\s*([\d,.]+\s*[km]?)\s*(?:\/|per|a)?\s*(?:yr|year|annually|annual)\b/);
    if (yr) {
      const n = parseMoney(yr[1]);
      if (n !== undefined && n > 0 && n < 10_000_000) out.annualIncome = n;
    }
  }
  if (out.annualIncome === undefined) {
    const mo = s.match(/\$?\s*([\d,.]+\s*[km]?)\s*(?:\/|per|a)?\s*(?:mo|month|monthly)\b/);
    if (mo) {
      const n = parseMoney(mo[1]);
      if (n !== undefined && n > 0) out.annualIncome = n * 12;
    }
  }
  if (out.annualIncome === undefined) {
    const bare = s.match(/\b(?:makes?|earn(?:s|ing)?|salary(?: of)?|income(?: of)?)\s*\$?\s*([\d,.]+\s*[km]?)\b/);
    if (bare) {
      const n = parseMoney(bare[1]);
      if (n !== undefined && n >= 1000) out.annualIncome = n;
      else if (n !== undefined && n > 10 && n < 1000) out.annualIncome = n * 1000;
    }
  }

  return out;
}

export function fplAnnual(householdSize: number): number {
  const size = Math.max(1, Math.min(householdSize, 20));
  return 15_650 + (size - 1) * 5_500;
}

export function fplCap(householdSize: number, pct: number): number {
  return fplAnnual(householdSize) * (pct / 100);
}

type Rule = {
  requiresKids?: boolean;
  requiresPregnancyOrKids?: boolean;
  requiresVeteran?: boolean;
  requiresSenior?: boolean;
  requiresMedicareAge?: boolean;
  requiresDisability?: boolean;
  requiresStudent?: boolean;
  requiresRenter?: boolean;
  requiresHomeowner?: boolean;
  requiresUnemployed?: boolean;
  requiresWorker?: boolean;
  incomeCapPctFpl?: number;
  incomeCapAbsolute?: number;
  organizationOnly?: boolean;
};

export const PROGRAM_RULES: Record<string, Rule> = {
  eitc: { incomeCapAbsolute: 66_819 },
  ctc: { requiresKids: true, incomeCapAbsolute: 400_000 },
  actc: { requiresKids: true, incomeCapAbsolute: 400_000 },
  cdcc: { requiresKids: true },
  aotc: { requiresStudent: true, incomeCapAbsolute: 90_000 },
  llc: { requiresStudent: true, incomeCapAbsolute: 90_000 },
  ptc: { incomeCapPctFpl: 400 },
  "savers-credit": { requiresWorker: true, incomeCapAbsolute: 76_500 },
  "adoption-credit": { incomeCapAbsolute: 292_150 },
  "state-eitc": { incomeCapAbsolute: 70_000 },
  "elderly-disabled-credit": {},
  "back-refunds": {},

  tanf: { requiresKids: true, incomeCapPctFpl: 100 },
  ssi: { incomeCapPctFpl: 100 },
  ssdi: { requiresDisability: true },
  "ss-retirement": { requiresSenior: true },
  "ss-survivor": {},
  "ss-family": {},
  "general-assistance": { incomeCapPctFpl: 100 },
  ui: { requiresUnemployed: true },
  dua: { requiresUnemployed: true },
  "fema-ia": {},
  "eip-recovery": { incomeCapAbsolute: 150_000 },
  "child-support": { requiresKids: true },
  "emergency-assistance": { incomeCapPctFpl: 200 },

  snap: { incomeCapPctFpl: 200 },
  wic: { requiresPregnancyOrKids: true, incomeCapPctFpl: 185 },
  "school-meals": { requiresKids: true, incomeCapPctFpl: 185 },
  "summer-ebt": { requiresKids: true, incomeCapPctFpl: 185 },
  csfp: { requiresSenior: true, incomeCapPctFpl: 130 },
  tefap: { incomeCapPctFpl: 185 },
  "snap-ed": { incomeCapPctFpl: 185 },
  "senior-farmers-market": { requiresSenior: true, incomeCapPctFpl: 185 },
  "wic-farmers-market": { requiresPregnancyOrKids: true, incomeCapPctFpl: 185 },
  "meals-on-wheels": { requiresSenior: true },
  cacfp: { organizationOnly: true },
  "food-pantries": {},
  "wic-breastfeeding": { requiresPregnancyOrKids: true, incomeCapPctFpl: 185 },

  medicaid: { incomeCapPctFpl: 138 },
  chip: { requiresKids: true, incomeCapPctFpl: 200 },
  marketplace: { incomeCapAbsolute: 400_000 },
  csr: { incomeCapPctFpl: 250 },
  "medicare-savings": { requiresMedicareAge: true, incomeCapPctFpl: 150 },
  "extra-help": { requiresMedicareAge: true, incomeCapPctFpl: 150 },
  "medicaid-expansion": { incomeCapPctFpl: 138 },
  chc: {},
  "hill-burton": { incomeCapPctFpl: 200 },
  vfc: { requiresKids: true },
  "ryan-white": {},
  "family-planning": { incomeCapPctFpl: 250 },
  adap: {},
  "mat-sud": {},
  "prescription-assistance": {},
  bccp: { incomeCapPctFpl: 250 },

  section8: { requiresRenter: true, incomeCapPctFpl: 200 },
  "public-housing": { incomeCapPctFpl: 200 },
  liheap: { incomeCapPctFpl: 150 },
  lihwap: { incomeCapPctFpl: 150 },
  wap: { incomeCapPctFpl: 200 },
  "acp-lifeline": { incomeCapPctFpl: 200 },
  section202: { requiresSenior: true, incomeCapPctFpl: 50 },
  section811: { requiresDisability: true, incomeCapPctFpl: 50 },
  "usda-502": { requiresHomeowner: true, incomeCapPctFpl: 115 },
  "hud-hoc": {},
  "hafa-hardship": { requiresHomeowner: true },
  era: { requiresRenter: true, incomeCapPctFpl: 200 },
  "continuum-of-care": {},
  "hud-vash": { requiresVeteran: true },
  "solar-for-all": { requiresHomeowner: true },
  "home-repair-grants": { requiresHomeowner: true, incomeCapPctFpl: 200 },
  "project-based-rental-assistance": { requiresRenter: true, incomeCapPctFpl: 200 },
  "lihtc-apartments": { incomeCapPctFpl: 200 },
  fss: {},
  "housing-choice-homeownership": { requiresRenter: true, incomeCapPctFpl: 200 },
  "fha-loans": {},
  "dpa-programs": {},
  mcc: {},
  "usda-504": { requiresHomeowner: true, incomeCapPctFpl: 100 },
  "home-program": { organizationOnly: true },
  "cdbg-housing": { organizationOnly: true },
  esg: { organizationOnly: true },
  "vawa-housing": {},
  "fair-housing-complaint": {},
  "tribal-housing": {},
  "farm-labor-housing": {},
  "lead-hazard-grants": { requiresHomeowner: true },
  "energy-efficiency-rebates": { requiresHomeowner: true },
  "utility-shutoff-protection": {},
  "eviction-legal-help": { requiresRenter: true },

  ccdf: { requiresKids: true, incomeCapPctFpl: 200 },
  "head-start": { requiresKids: true, incomeCapPctFpl: 100 },
  "state-prek": { requiresKids: true },
  "home-visiting": { requiresKids: true },
  "cps-diaper": { requiresKids: true, incomeCapPctFpl: 200 },
  "foster-adoption-assist": { requiresKids: true },
  "child-care-tax-fsa": { requiresKids: true, requiresWorker: true },

  pell: { requiresStudent: true, incomeCapAbsolute: 90_000 },
  fseog: { requiresStudent: true, incomeCapAbsolute: 90_000 },
  "work-study": { requiresStudent: true },
  "teach-grant": { requiresStudent: true },
  pslf: { requiresWorker: true },
  idr: {},
  wioa: {},
  "job-corps": {},
  apprenticeship: {},
  "state-tuition-free": { requiresStudent: true },
  "ged-adult-ed": {},
  americorps: {},

  "va-disability": { requiresVeteran: true, requiresDisability: true },
  "va-pension": { requiresVeteran: true, requiresSenior: true },
  "va-aid-attendance": { requiresVeteran: true },
  "va-healthcare": { requiresVeteran: true },
  "gi-bill": { requiresVeteran: true },
  "vr-e": { requiresVeteran: true, requiresDisability: true },
  dic: {},
  "va-home-loan": { requiresVeteran: true },
  "sah-grant": { requiresVeteran: true, requiresDisability: true },

  "ltss-waivers": { requiresDisability: true },
  pace: { requiresSenior: true },
  ship: { requiresMedicareAge: true },
  "aaa-services": { requiresSenior: true },
  scsep: { requiresSenior: true, incomeCapPctFpl: 125 },
  "ticket-to-work": { requiresDisability: true },
  "able-accounts": { requiresDisability: true },
  "assistive-tech": { requiresDisability: true },
  "caregiver-support": {},

  "sba-disaster": {},
  "crime-victim-comp": {},
  "lsc-legal-aid": { incomeCapPctFpl: 125 },
  "taxpayer-clinics": { incomeCapPctFpl: 250 },
  "disaster-snap": { incomeCapPctFpl: 200 },
  "fema-flood": {},

  "state-unclaimed": {},
  "pension-search": {},
  "savings-bonds": {},
  "fha-refunds": { requiresHomeowner: true },
  "class-action": {},
  "tax-overpayment": {},

  cdbg: { organizationOnly: true },
  "nih-grants": { organizationOnly: true },
  "ars-grants": { organizationOnly: true },
  "epa-grants": { organizationOnly: true },
  shsgp: { organizationOnly: true },
  sbir: { organizationOnly: true },
  worc: { organizationOnly: true },
  "teach-inst": { organizationOnly: true },
};

function ruleFromCategory(programId: string): Rule {
  const p = PROGRAMS.find((x) => x.id === programId);
  if (!p) return {};
  if (p.category === "Grants for organizations") return { organizationOnly: true };
  if (p.category === "Veterans & military") return { requiresVeteran: true };
  return {};
}

export type ScreenVerdict =
  | { fit: "ok"; reason?: string }
  | { fit: "not_fit"; reason: string };

export function screenProgram(programId: string, sig: Signals): ScreenVerdict {
  const rule = { ...ruleFromCategory(programId), ...(PROGRAM_RULES[programId] || {}) };

  if (rule.organizationOnly) return { fit: "not_fit", reason: "This program funds organizations, not individuals." };
  if (rule.requiresKids && sig.hasKids === false) return { fit: "not_fit", reason: "Requires a qualifying child; you told us you have no kids." };
  if (rule.requiresPregnancyOrKids && sig.hasKids === false && sig.isPregnant !== true) return { fit: "not_fit", reason: "Only for pregnant people or families with young kids." };
  if (rule.requiresVeteran && sig.isVeteran === false) return { fit: "not_fit", reason: "Requires U.S. military service." };
  if (rule.requiresMedicareAge && sig.isMedicareAge === false) return { fit: "not_fit", reason: "Requires Medicare eligibility (typically age 65+)." };
  if (rule.requiresSenior && sig.isSenior === false) return { fit: "not_fit", reason: "Age-restricted (typically 60+)." };
  if (rule.requiresDisability && sig.hasDisability === false) return { fit: "not_fit", reason: "Requires a qualifying disability." };
  if (rule.requiresStudent && sig.isStudent === false) return { fit: "not_fit", reason: "For students in school or training." };
  if (rule.requiresRenter && sig.isHomeowner === true && sig.isRenter !== true) return { fit: "not_fit", reason: "For renters, not homeowners." };
  if (rule.requiresHomeowner && sig.isRenter === true && sig.isHomeowner !== true) return { fit: "not_fit", reason: "For homeowners, not renters." };
  if (rule.requiresUnemployed && sig.isUnemployed === false) return { fit: "not_fit", reason: "For people who are currently unemployed." };

  if (rule.incomeCapAbsolute !== undefined && sig.annualIncome !== undefined) {
    if (sig.annualIncome > rule.incomeCapAbsolute) {
      return { fit: "not_fit", reason: `Income is above the program's cap (about $${rule.incomeCapAbsolute.toLocaleString()}/yr).` };
    }
  }
  if (rule.incomeCapPctFpl !== undefined && sig.annualIncome !== undefined) {
    const hh = sig.householdSize ?? 1;
    const cap = fplCap(hh, rule.incomeCapPctFpl);
    if (sig.annualIncome > cap) {
      return { fit: "not_fit", reason: `Household income (~$${Math.round(sig.annualIncome).toLocaleString()}/yr) is above the ~${rule.incomeCapPctFpl}% FPL limit for a household of ${hh} (~$${Math.round(cap).toLocaleString()}/yr).` };
    }
  }

  return { fit: "ok" };
}

export function signalsFromInfo(info: {
  state?: string;
  householdSize?: string;
  monthlyIncome?: string;
  householdIncome?: string;
  dependents?: string;
  workSituation?: string;
  housing?: string;
  healthCoverage?: string;
  notes?: string;
  filingStatus?: string;
}): Signals {
  const sig: Signals = {};
  const hh = parseInt((info.householdSize || "").replace(/\D/g, ""), 10);
  if (!Number.isNaN(hh) && hh > 0) sig.householdSize = hh;

  const ann = parseMoney(info.householdIncome || "");
  if (ann !== undefined && ann >= 1000) sig.annualIncome = ann;
  else {
    const mon = parseMoney(info.monthlyIncome || "");
    if (mon !== undefined) sig.annualIncome = mon * 12;
  }

  const dep = (info.dependents || "").toLowerCase().trim();
  if (dep) {
    if (/\b(none|no kids?|0|0 kids?|no dependents?)\b/.test(dep)) sig.hasKids = false;
    else if (/\d/.test(dep) || /(kid|child|son|daughter|dependent)/.test(dep)) sig.hasKids = true;
  }

  const notes = (info.notes || "").toLowerCase();
  if (/\b(veteran|military|army|navy|marines?|air force|coast guard)\b/.test(notes)) sig.isVeteran = true;
  if (/\b(disab(?:le|led|ility))\b/.test(notes)) sig.hasDisability = true;
  if (/\b(pregnan)/.test(notes)) sig.isPregnant = true;
  if (/\b(student|college|university)\b/.test(notes)) sig.isStudent = true;
  if (/\b(retired|senior)\b/.test(notes)) sig.isSenior = true;

  const housing = (info.housing || "").toLowerCase();
  if (/\b(rent|apartment|lease)/.test(housing)) sig.isRenter = true;
  if (/\b(own|mortgage|homeowner)/.test(housing)) sig.isHomeowner = true;

  const work = (info.workSituation || "").toLowerCase();
  if (/\b(unemploy|laid off|jobless|no job)/.test(work)) sig.isUnemployed = true;
  else if (work) sig.isWorking = true;

  if (info.state) sig.state = info.state.trim();
  return sig;
}
