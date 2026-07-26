// Official government filing destinations the assistant is allowed to send people to.
// Only .gov (or the official state-run directory) URLs belong here.
export type OfficialLink = {
  label: string;
  url: string;
  note: string;
};

export const OFFICIAL_LINKS: OfficialLink[] = [
  // ---- IRS: filing, credits, refunds ----
  { label: "IRS Free File (free federal filing)", url: "https://www.irs.gov/filing/irs-free-file-do-your-taxes-for-free", note: "Free guided federal return if income is under the yearly Free File limit. This is where most refund claims start." },
  { label: "IRS Direct File", url: "https://directfile.irs.gov", note: "File a simple federal return directly with the IRS, free, in participating states." },
  { label: "IRS Free Tax Prep / VITA site locator", url: "https://irs.treasury.gov/freetaxprep/", note: "Find a nearby IRS-certified volunteer who files your return for free." },
  { label: "Earned Income Tax Credit (EITC)", url: "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit-eitc", note: "Claimed on Form 1040 with Schedule EIC when there are qualifying children." },
  { label: "EITC Assistant (eligibility check)", url: "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/use-the-eitc-assistant", note: "Official IRS questionnaire that confirms EITC eligibility and amount." },
  { label: "Child Tax Credit", url: "https://www.irs.gov/credits-deductions/individuals/child-tax-credit", note: "Claimed on Form 1040 with Schedule 8812." },
  { label: "Child and Dependent Care Credit", url: "https://www.irs.gov/credits-deductions/individuals/child-and-dependent-care-credit-information", note: "Claimed with Form 2441." },
  { label: "American Opportunity / Lifetime Learning education credits", url: "https://www.irs.gov/credits-deductions/individuals/education-credits-aotc-llc", note: "Claimed with Form 8863 using the Form 1098-T from the school." },
  { label: "Premium Tax Credit (marketplace health coverage)", url: "https://www.irs.gov/affordable-care-act/individuals-and-families/the-premium-tax-credit-the-basics", note: "Reconciled with Form 8962 using Form 1095-A." },
  { label: "Saver's Credit (retirement contributions)", url: "https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-savings-contributions-savers-credit", note: "Claimed with Form 8880." },
  { label: "Amend a past return (Form 1040-X)", url: "https://www.irs.gov/filing/file-an-amended-return", note: "Use this to claim a credit you missed. Generally 3 years from the original filing deadline to claim a refund." },
  { label: "File a prior-year return", url: "https://www.irs.gov/filing/individuals/filing-past-due-tax-returns", note: "Unfiled back years often hold refunds; you can still file and claim within the 3-year window." },
  { label: "Get your IRS transcripts / prior W-2 data", url: "https://www.irs.gov/individuals/get-transcript", note: "Free wage and income transcripts if you're missing old W-2s or 1099s." },
  { label: "Where's My Refund?", url: "https://www.irs.gov/wheres-my-refund", note: "Track a filed refund. Needs SSN, filing status, and exact refund amount." },
  { label: "Where's My Amended Return?", url: "https://www.irs.gov/filing/wheres-my-amended-return", note: "Tracks a 1040-X; these take roughly 16+ weeks." },
  { label: "Apply for an IRS Individual Taxpayer ID (ITIN, Form W-7)", url: "https://www.irs.gov/individuals/individual-taxpayer-identification-number", note: "For filers without an SSN." },
  { label: "IRS payment plans / offer in compromise", url: "https://www.irs.gov/payments/online-payment-agreement-application", note: "If a return shows tax owed rather than a refund." },
  { label: "Taxpayer Advocate Service (free IRS help)", url: "https://www.taxpayeradvocate.irs.gov/", note: "Independent IRS help when a claim is stuck or causing hardship." },
  { label: "Low Income Taxpayer Clinics", url: "https://www.taxpayeradvocate.irs.gov/about-us/low-income-taxpayer-clinics-litc/", note: "Free or low-cost representation in IRS disputes." },

  // ---- Benefits: food, cash, health, housing ----
  { label: "Benefits.gov eligibility finder", url: "https://www.benefits.gov/benefit-finder", note: "Official cross-agency screener for federal programs." },
  { label: "SNAP state application directory", url: "https://www.fns.usda.gov/snap/state-directory", note: "SNAP is applied for through your state agency - this page links each one." },
  { label: "WIC state agency directory", url: "https://www.fns.usda.gov/wic/contacts", note: "For pregnant people and kids under 5." },
  { label: "HealthCare.gov (marketplace + Medicaid/CHIP referral)", url: "https://www.healthcare.gov/", note: "One application covers marketplace subsidies, Medicaid, and CHIP." },
  { label: "Medicaid state contacts", url: "https://www.medicaid.gov/about-us/where-can-people-get-help-medicaid-chip/index.html", note: "State-by-state Medicaid/CHIP offices." },
  { label: "Medicare Savings / Extra Help (Part D)", url: "https://www.ssa.gov/medicare/part-d-extra-help", note: "Apply through SSA to cut prescription costs." },
  { label: "Social Security & SSI applications", url: "https://www.ssa.gov/apply", note: "Retirement, disability (SSDI), and SSI all start here." },
  { label: "TANF state contacts", url: "https://www.acf.hhs.gov/ofa/map/about/help-families", note: "Cash assistance is run by states." },
  { label: "LIHEAP energy bill help", url: "https://www.acf.hhs.gov/ocs/programs/liheap/consumer-info", note: "Heating and cooling bill assistance by state." },
  { label: "HUD rental assistance / public housing", url: "https://www.hud.gov/helping-americans/public-indian-housing", note: "Housing Choice Vouchers and public housing through your local PHA." },
  { label: "Lifeline phone/internet discount", url: "https://www.lifelinesupport.org/", note: "Federal discount on phone or broadband." },
  { label: "Child care assistance (CCDF) by state", url: "https://childcare.gov/state-resources", note: "Subsidized child care applications." },
  { label: "Federal student aid (FAFSA, Pell Grant)", url: "https://studentaid.gov/h/apply-for-aid/fafsa", note: "Pell Grants and most college aid require the FAFSA." },
  { label: "VA benefits applications", url: "https://www.va.gov/", note: "Disability compensation, pension, health care, and education benefits." },
  { label: "Unclaimed property search (official state directory)", url: "https://unclaimed.org/", note: "NAUPA-run directory of official state unclaimed-money sites. Never pay a finder's fee." },
  { label: "Treasury Hunt (unclaimed savings bonds)", url: "https://treasuryhunt.gov/", note: "Matured or lost US savings bonds." },
  { label: "Disaster assistance (FEMA)", url: "https://www.disasterassistance.gov/", note: "Individual assistance after a declared disaster." },
];

export const OFFICIAL_LINKS_PROMPT = OFFICIAL_LINKS.map(
  (l) => `- ${l.label}: ${l.url} - ${l.note}`,
).join("\n");

// ---- Program -> official application source -------------------------------
// Maps a program name/id to the real government page where the application
// lives, plus the documents that page asks for.
export type OfficialSource = {
  label: string;
  url: string;
  docs: string[];
};

const PROGRAM_SOURCES: Array<{ match: RegExp; source: OfficialSource }> = [
  { match: /\bsnap\b|food stamp|ebt/i, source: { label: "USDA SNAP state application directory", url: "https://www.fns.usda.gov/snap/state-directory", docs: ["Photo ID", "Proof of income (recent pay stubs)", "Proof of address (utility bill or lease)", "Social Security numbers for household members"] } },
  { match: /\bwic\b/i, source: { label: "WIC state agency directory", url: "https://www.fns.usda.gov/wic/contacts", docs: ["Photo ID", "Proof of address", "Proof of income", "Proof of pregnancy or child's birth certificate"] } },
  { match: /medicaid|chip\b|children's health/i, source: { label: "Medicaid & CHIP state offices", url: "https://www.medicaid.gov/about-us/where-can-people-get-help-medicaid-chip/index.html", docs: ["Photo ID", "Proof of income", "Proof of citizenship or immigration status", "Household member SSNs"] } },
  { match: /marketplace|affordable care|premium tax credit|health insurance/i, source: { label: "HealthCare.gov application", url: "https://www.healthcare.gov/", docs: ["Household income estimate for the year", "SSNs or document numbers", "Current policy numbers if insured", "Form 1095-A if you had marketplace coverage"] } },
  { match: /medicare|extra help|part d/i, source: { label: "Medicare Extra Help (SSA)", url: "https://www.ssa.gov/medicare/part-d-extra-help", docs: ["Medicare card", "Bank statements", "Proof of income and resources"] } },
  { match: /earned income|eitc/i, source: { label: "IRS EITC (claimed on Form 1040 + Schedule EIC)", url: "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit-eitc", docs: ["W-2s and 1099s", "Children's SSNs and birth dates", "Last year's return if you have it"] } },
  { match: /child tax credit|schedule 8812/i, source: { label: "IRS Child Tax Credit (Form 1040 + Schedule 8812)", url: "https://www.irs.gov/credits-deductions/individuals/child-tax-credit", docs: ["Children's SSNs", "W-2s and 1099s", "Proof children lived with you (school or medical records)"] } },
  { match: /child (and )?dependent care/i, source: { label: "IRS Child & Dependent Care Credit (Form 2441)", url: "https://www.irs.gov/credits-deductions/individuals/child-and-dependent-care-credit-information", docs: ["Care provider name, address, and EIN/SSN", "Receipts for care paid", "W-2s"] } },
  { match: /education credit|american opportunity|lifetime learning|1098-t/i, source: { label: "IRS education credits (Form 8863)", url: "https://www.irs.gov/credits-deductions/individuals/education-credits-aotc-llc", docs: ["Form 1098-T from the school", "Receipts for books and supplies"] } },
  { match: /fafsa|pell|student aid|college/i, source: { label: "Federal Student Aid (FAFSA)", url: "https://studentaid.gov/h/apply-for-aid/fafsa", docs: ["FSA ID", "Last year's tax return", "Bank and investment records", "Social Security number"] } },
  { match: /liheap|energy|heating|cooling|utility|water assistance|lihwap/i, source: { label: "LIHEAP energy assistance by state", url: "https://www.acf.hhs.gov/ocs/programs/liheap/consumer-info", docs: ["Recent utility bill or shutoff notice", "Photo ID", "Proof of income", "Proof of address"] } },
  { match: /housing|rent|hud|voucher|section 8|homeless|eviction|weatheriz|home repair/i, source: { label: "HUD rental assistance & local PHA finder", url: "https://www.hud.gov/helping-americans/public-indian-housing", docs: ["Photo ID for each adult", "Birth certificates and SSNs", "Proof of income", "Current lease or eviction notice"] } },
  { match: /tanf|cash assistance|welfare|emergency cash/i, source: { label: "TANF cash assistance state contacts", url: "https://www.acf.hhs.gov/ofa/map/about/help-families", docs: ["Photo ID", "Proof of income", "Proof of address", "Birth certificates for children"] } },
  { match: /\bssi\b|\bssdi\b|social security|disability|retirement/i, source: { label: "Social Security & SSI applications", url: "https://www.ssa.gov/apply", docs: ["Birth certificate", "Social Security number", "Medical records and doctor contacts", "W-2s or self-employment tax return"] } },
  { match: /veteran|\bva\b|gi bill|military/i, source: { label: "VA benefits applications", url: "https://www.va.gov/", docs: ["DD-214 discharge papers", "Medical records", "Dependent birth/marriage certificates"] } },
  { match: /child care|ccdf|head start|pre-?k/i, source: { label: "Child care assistance by state (CCDF)", url: "https://childcare.gov/state-resources", docs: ["Photo ID", "Proof of income", "Proof of work/school schedule", "Child's birth certificate and immunizations"] } },
  { match: /lifeline|broadband|internet|phone/i, source: { label: "Lifeline phone & internet discount", url: "https://www.lifelinesupport.org/", docs: ["Photo ID", "Proof of program participation (SNAP/Medicaid letter) or income"] } },
  { match: /unclaimed|savings bond|escheat/i, source: { label: "Official state unclaimed property directory", url: "https://unclaimed.org/", docs: ["Photo ID", "Proof of past addresses", "Any old account or policy numbers"] } },
  { match: /disaster|fema|hurricane|flood|wildfire/i, source: { label: "DisasterAssistance.gov", url: "https://www.disasterassistance.gov/", docs: ["Photo ID", "Proof of address at the damaged home", "Insurance information", "Damage photos"] } },
  { match: /free file|tax return|refund|amend|1040|tax credit|filing/i, source: { label: "IRS Free File (start your return)", url: "https://www.irs.gov/filing/irs-free-file-do-your-taxes-for-free", docs: ["W-2s and 1099s", "Last year's return", "SSNs for everyone on the return", "Bank routing and account number"] } },
];

const FALLBACK_SOURCE: OfficialSource = {
  label: "Benefits.gov official program finder",
  url: "https://www.benefits.gov/benefit-finder",
  docs: ["Photo ID", "Proof of income", "Proof of address", "SSNs for household members"],
};

export function officialSourceFor(nameOrId: string): OfficialSource {
  const hay = (nameOrId || "").toLowerCase();
  for (const entry of PROGRAM_SOURCES) {
    if (entry.match.test(hay)) return entry.source;
  }
  return FALLBACK_SOURCE;
}
