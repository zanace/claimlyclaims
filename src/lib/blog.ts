export type BlogCategory =
  | "Taxes"
  | "Food assistance"
  | "Housing"
  | "Family benefits"
  | "Unclaimed property";

export type Article = {
  slug: string;
  title: string;
  summary: string;
  category: BlogCategory;
  readTime: string;
  date: string;
  body: { heading?: string; paragraphs: string[] }[];
};

export const BLOG_CATEGORIES: BlogCategory[] = [
  "Taxes",
  "Food assistance",
  "Housing",
  "Family benefits",
  "Unclaimed property",
];

export const ARTICLES: Article[] = [
  {
    slug: "earned-income-tax-credit-explained",
    title: "The Earned Income Tax Credit, Explained (And Why So Many People Miss It)",
    summary:
      "The EITC is one of the largest refunds working people can get — and one of the most commonly skipped.",
    category: "Taxes",
    readTime: "6 min read",
    date: "2026-01-12",
    body: [
      {
        paragraphs: [
          "The Earned Income Tax Credit is a refundable tax credit for people who work but don't earn a lot. Refundable is the important word: if the credit is bigger than the tax you owe, the difference comes back to you as a refund. You can owe nothing all year and still get money.",
          "Every year the IRS estimates that roughly one in five eligible people don't claim it [VERIFY CURRENT FIGURE]. Not because they don't qualify — because they never filed, or they filed and skipped the form.",
        ],
      },
      {
        heading: "Who it's for",
        paragraphs: [
          "In broad strokes: you worked for pay during the year, your income falls under a limit that depends on your filing status and how many qualifying children you have, and your investment income is small. Workers without children can qualify too, though the credit is much smaller and the age rules are tighter [VERIFY].",
          "Self-employment counts. Gig work counts. Cash work you reported counts. A part-time job you held for three months counts.",
        ],
      },
      {
        heading: "Why people miss it",
        paragraphs: [
          "The most common reason is simple: their income was low enough that they weren't required to file a return, so they didn't. But filing is how you claim a refund. No return, no credit.",
          "The second reason is life changes. A new baby, a move, a year with less work, a separation — any of these can make you newly eligible when you weren't the year before. People check once, get a no, and never check again.",
          "The third is fear of the process. Filing feels like something that can go wrong. In practice, claiming the EITC is a schedule attached to a normal return, and free filing help exists nationwide through IRS-sponsored volunteer programs.",
        ],
      },
      {
        heading: "You can usually go back",
        paragraphs: [
          "If you were eligible in an earlier year and never filed, you can generally still file a late return and claim the refund for up to three years from the original due date [VERIFY]. After that the money stays with the Treasury. This is the single most overlooked source of real cash for people who have had a few unstable years.",
        ],
      },
      {
        heading: "What to have ready",
        paragraphs: [
          "Social Security numbers for you and any children you're claiming, your W-2s or 1099s, records of self-employment income and expenses, and last year's return if you have it. If you're claiming a child, you'll want something that shows they lived with you for more than half the year — school records, medical records, or a letter from a landlord all work.",
        ],
      },
      {
        heading: "The short version",
        paragraphs: [
          "If you worked and earned a modest income, file a return even if nobody makes you. Check the earlier years too. The EITC is money the tax code deliberately set aside for working households, and the only way it reaches you is a filed return.",
        ],
      },
    ],
  },
  {
    slug: "unclaimed-property-how-to-check",
    title: "Unclaimed Property: How to Check If You Have Money Waiting",
    summary:
      "Old paychecks, forgotten deposits, and insurance payouts end up with the state. Searching is free and takes minutes.",
    category: "Unclaimed property",
    readTime: "5 min read",
    date: "2026-01-20",
    body: [
      {
        paragraphs: [
          "When a company can't reach you, it doesn't keep your money forever. After a dormancy period — often one to five years, depending on the state and the type of account — it has to hand the money to the state, which holds it for you indefinitely. That handoff is called escheatment, and the pile is enormous.",
        ],
      },
      {
        heading: "What ends up there",
        paragraphs: [
          "Final paychecks from a job you left. Security deposits from an apartment you moved out of. Utility deposits. Refunds from a doctor's office or an insurer. Balances in bank accounts you stopped using. Uncashed checks of every kind. Life insurance payouts where the beneficiary was never found. Stock and dividend payments tied to an old address.",
          "The common thread is a change of address or a change of name. If you've moved, married, divorced, or switched banks, your odds go up.",
        ],
      },
      {
        heading: "How to search",
        paragraphs: [
          "Search your state's official unclaimed property site, plus every state you've lived or worked in. The multi-state search at MissingMoney.com is run by state administrators and covers most of them. Searching is free.",
          "Try variations: maiden name, nicknames, misspellings, middle initial or not. Search for deceased relatives whose estates you're entitled to, and for any business you owned.",
        ],
      },
      {
        heading: "Never pay a finder up front",
        paragraphs: [
          "You will get letters from firms offering to recover 'your' money for a percentage. You never need one. Claiming from the state is free and the forms are short. Most states also cap what a finder can charge [VERIFY]. If someone asks for a fee before you receive anything, walk away.",
        ],
      },
      {
        heading: "What the claim looks like",
        paragraphs: [
          "You'll fill out a claim form, then prove two things: that you are you, and that you're connected to the address or account on file. Typically that means a photo ID, your Social Security number, and something linking you to the old address — an old bill, a lease, a tax return.",
          "Processing usually takes a few weeks to a few months. Small amounts sometimes pay out automatically with no documentation at all.",
        ],
      },
      {
        heading: "Make it a habit",
        paragraphs: [
          "New property is turned over to the states constantly, so a search that comes up empty today can hit next year. Checking once a year takes about five minutes and costs nothing.",
        ],
      },
    ],
  },
  {
    slug: "snap-eligibility-what-counts-as-income",
    title: "SNAP Eligibility: What Actually Counts as Income",
    summary:
      "People rule themselves out of food assistance over income they didn't need to count. Here's how the math really works.",
    category: "Food assistance",
    readTime: "7 min read",
    date: "2026-02-02",
    body: [
      {
        paragraphs: [
          "SNAP — the program most people still call food stamps — is decided mostly on household size and income. The confusing part is that 'income' in the SNAP rules is not the same number as the one on your pay stub, and deductions can move a household from 'over the limit' to eligible.",
        ],
      },
      {
        heading: "Gross versus net",
        paragraphs: [
          "Most households have to pass two tests: a gross income test and a net income test. Gross income is what you bring in before deductions. Net income is what's left after the program's allowed deductions. Households with an elderly or disabled member often only have to pass the net test [VERIFY].",
          "That distinction matters, because the deductions are substantial.",
        ],
      },
      {
        heading: "What counts",
        paragraphs: [
          "Wages and salary, self-employment income after business costs, unemployment benefits, Social Security and SSI, most pensions, child support you receive, and regular cash contributions from someone outside the household.",
        ],
      },
      {
        heading: "What usually doesn't",
        paragraphs: [
          "Federal tax refunds, including the EITC. Most student financial aid used for tuition and fees. Loans you have to repay. Reimbursements for actual expenses. Non-recurring lump sums are often treated as an asset rather than income [VERIFY]. Money paid directly to a third party on your behalf is generally excluded.",
        ],
      },
      {
        heading: "The deductions that change the answer",
        paragraphs: [
          "A standard deduction based on household size. An earned income deduction that discounts a portion of what you make from work. Dependent care costs you pay in order to work or attend school. Child support you pay out. Out-of-pocket medical expenses above a threshold for elderly or disabled members. And an excess shelter deduction for rent, mortgage, and utilities above a share of your income.",
          "The shelter deduction is the one people underestimate. In a high-rent area it can be large enough on its own to make an over-the-limit household eligible.",
        ],
      },
      {
        heading: "Who counts as a household",
        paragraphs: [
          "A SNAP household is people who buy and prepare food together — not just people on the lease. Roommates who shop and cook separately are usually separate households, which changes both the income counted and the size limit applied.",
        ],
      },
      {
        heading: "When in doubt, apply",
        paragraphs: [
          "States run their own versions with their own limits, and several use broad-based categorical eligibility that raises or removes the asset test [VERIFY]. The application is free, a denial costs you nothing, and the worst realistic outcome is a letter. Estimates like ours are a starting point — the agency makes the decision.",
        ],
      },
    ],
  },
  {
    slug: "tax-credits-parents-forget",
    title: "5 Tax Credits Parents Often Forget to Claim",
    summary:
      "Raising kids is expensive and the tax code partly accounts for that — if you claim the right lines.",
    category: "Family benefits",
    readTime: "6 min read",
    date: "2026-02-15",
    body: [
      {
        paragraphs: [
          "Parents leave money on the table every filing season, usually by missing a credit that required one extra form. These five come up the most.",
        ],
      },
      {
        heading: "1. The Child Tax Credit",
        paragraphs: [
          "A per-child credit for qualifying children under the age limit, with a portion refundable for families whose tax bill is already low [VERIFY CURRENT FIGURE]. You have to file to get it, even if your income is below the filing requirement — which is exactly the group that most often skips filing.",
        ],
      },
      {
        heading: "2. The Credit for Other Dependents",
        paragraphs: [
          "A smaller credit for dependents who don't meet the Child Tax Credit rules: a teenager who aged out, a college student you support, a parent or relative living with you. Many families support someone who qualifies and never claim it.",
        ],
      },
      {
        heading: "3. The Child and Dependent Care Credit",
        paragraphs: [
          "If you paid for care so you could work or look for work, part of that cost can come back as a credit. Daycare, after-school programs, and summer day camp generally count; overnight camp doesn't. You need the provider's name, address, and tax ID — get it before they close for the year.",
        ],
      },
      {
        heading: "4. Education credits",
        paragraphs: [
          "The American Opportunity Credit covers undergraduate costs for a limited number of years and is partly refundable; the Lifetime Learning Credit is smaller but covers a wider range of coursework, including a single class to keep a job skill current [VERIFY]. Parents paying tuition for a dependent claim it on their own return.",
        ],
      },
      {
        heading: "5. The EITC, with children",
        paragraphs: [
          "The Earned Income Tax Credit gets substantially larger with each qualifying child, up to a cap. Families sometimes claim the Child Tax Credit and stop, not realizing the EITC is a separate calculation on the same return.",
        ],
      },
      {
        heading: "A note on split households",
        paragraphs: [
          "When parents live apart, only one can claim a given child for most of these credits, and the rules turn on where the child physically lived for more than half the year — not on who pays more support. Sort it out before filing; duplicate claims freeze both refunds.",
        ],
      },
    ],
  },
  {
    slug: "never-filed-owed-a-refund",
    title: "What to Do If You Never Filed a Tax Return You Were Owed a Refund On",
    summary:
      "Skipping a filing year when you were owed money is fixable — but there's a deadline on getting the refund.",
    category: "Taxes",
    readTime: "6 min read",
    date: "2026-03-01",
    body: [
      {
        paragraphs: [
          "A lot of people have a year they never filed. Income was low, life was chaotic, the paperwork was somewhere in a box. If you were owed a refund that year, that money is still sitting there — but not forever.",
        ],
      },
      {
        heading: "The three-year window",
        paragraphs: [
          "You generally have three years from the original due date to file and still receive a refund [VERIFY]. After that the claim expires and the money stays with the Treasury. Two things follow from this: check your oldest unfiled year first, and don't wait for a quiet weekend.",
          "If you owed tax rather than being owed a refund, there's no deadline to file — and filing late is still much better than not filing, because penalties and interest keep running.",
        ],
      },
      {
        heading: "Step one: get your records",
        paragraphs: [
          "You don't need the paper W-2 you lost. The IRS keeps a wage and income transcript showing what employers and payers reported for you, and you can request it online or by mail for free. That transcript is usually enough to reconstruct a whole year.",
        ],
      },
      {
        heading: "Step two: use that year's forms",
        paragraphs: [
          "A prior-year return has to be filed on that year's forms with that year's rules and limits. Prior-year forms are all available from the IRS. Most older years have to be mailed rather than e-filed, so send them separately, one envelope per year, and use tracked mail.",
        ],
      },
      {
        heading: "Step three: check for credits you skipped",
        paragraphs: [
          "This is where late returns often turn into real money. The EITC, Child Tax Credit, and education credits are claimed on the return, so an unfiled year is an unclaimed year. Run the numbers with that year's rules — they change annually.",
        ],
      },
      {
        heading: "Step four: expect it to be slow",
        paragraphs: [
          "Paper returns take months to process, and multiple years take longer. If the IRS filed a substitute return on your behalf, your own return replaces it, but that takes extra review time. Keep copies of everything you send.",
        ],
      },
      {
        heading: "Free help exists",
        paragraphs: [
          "IRS-sponsored volunteer tax programs prepare returns at no cost for households under an income threshold, and Low Income Taxpayer Clinics handle disputes and back-year messes [VERIFY]. You don't have to pay a percentage of your refund to anyone.",
        ],
      },
    ],
  },
];

export function getArticle(slug: string) {
  return ARTICLES.find((a) => a.slug === slug);
}

export function relatedArticles(slug: string) {
  const current = getArticle(slug);
  const others = ARTICLES.filter((a) => a.slug !== slug);
  const sameCat = others.filter((a) => a.category === current?.category);
  return [...sameCat, ...others.filter((a) => !sameCat.includes(a))].slice(0, 3);
}
