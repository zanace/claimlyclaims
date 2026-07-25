export type Program = {
  id: string;
  name: string;
  category: "Tax credits" | "Food" | "Healthcare" | "Housing & utilities";
  estimate: string;
  summary: string;
  who: string;
};

export const CATEGORIES = [
  {
    key: "Tax credits",
    blurb: "Refundable credits and unfiled returns that often add up to thousands.",
  },
  { key: "Food", blurb: "Monthly grocery support for households and young families." },
  { key: "Healthcare", blurb: "Free or low-cost coverage for adults and children." },
  {
    key: "Housing & utilities",
    blurb: "Rent support, energy bills, and emergency assistance.",
  },
] as const;

export const PROGRAMS: Program[] = [
  {
    id: "eitc",
    name: "Earned Income Tax Credit",
    category: "Tax credits",
    estimate: "Up to ~$7,800",
    summary: "A refundable credit for working people with low to moderate income.",
    who: "Workers with earned income; amount scales with children in the household.",
  },
  {
    id: "ctc",
    name: "Child Tax Credit",
    category: "Tax credits",
    estimate: "Up to $2,000 per child",
    summary: "Per-child credit that can lower your tax bill or come back as a refund.",
    who: "Parents and guardians of qualifying children under 17.",
  },
  {
    id: "back-refunds",
    name: "Unfiled prior-year refunds",
    category: "Tax credits",
    estimate: "Varies",
    summary: "Refunds from past years you never claimed are still collectable for a window.",
    who: "Anyone who skipped filing while owed money.",
  },
  {
    id: "aotc",
    name: "Education credits",
    category: "Tax credits",
    estimate: "Up to $2,500",
    summary: "Tuition and course-material credits for students and their families.",
    who: "Enrolled students or the person claiming them.",
  },
  {
    id: "snap",
    name: "SNAP food benefits",
    category: "Food",
    estimate: "~$200+/month",
    summary: "A monthly grocery balance loaded onto a card you use at most stores.",
    who: "Households under the income limit for their size.",
  },
  {
    id: "wic",
    name: "WIC",
    category: "Food",
    estimate: "~$70/month + food package",
    summary: "Nutrition support for pregnant people, infants, and children under five.",
    who: "Families with young children who meet income guidelines.",
  },
  {
    id: "school-meals",
    name: "Free & reduced school meals",
    category: "Food",
    estimate: "~$1,000/child per year",
    summary: "Daily breakfast and lunch at no cost during the school year.",
    who: "School-age children in qualifying households.",
  },
  {
    id: "medicaid",
    name: "Medicaid",
    category: "Healthcare",
    estimate: "Full coverage",
    summary: "Comprehensive health coverage with little or no monthly premium.",
    who: "Adults and families under state income thresholds.",
  },
  {
    id: "chip",
    name: "CHIP",
    category: "Healthcare",
    estimate: "Low or no cost",
    summary: "Children's coverage for families who earn too much for Medicaid.",
    who: "Households with kids and modest income.",
  },
  {
    id: "marketplace",
    name: "Marketplace premium credits",
    category: "Healthcare",
    estimate: "Varies monthly",
    summary: "Subsidies that cut the price of a private plan, sometimes to near zero.",
    who: "People without job-based coverage.",
  },
  {
    id: "section8",
    name: "Housing Choice Vouchers",
    category: "Housing & utilities",
    estimate: "Rent capped near 30% of income",
    summary: "A voucher that covers the gap between what you can pay and market rent.",
    who: "Renters under local income limits; waitlists apply.",
  },
  {
    id: "liheap",
    name: "Energy bill assistance",
    category: "Housing & utilities",
    estimate: "$300–$1,000/year",
    summary: "Help with heating, cooling, and past-due utility balances.",
    who: "Households facing high energy costs or shutoff notices.",
  },
];