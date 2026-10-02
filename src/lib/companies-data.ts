import { plans, type Plan } from "./insurance-data";

export type Company = {
  slug: string;
  name: string;
  tagline: string;
  about: string;
  rating: number;
  founded: number;
  headquarters: string;
  license: string;
  claimsPaidRate: string;
  avgClaimDays: number;
  branches: number;
  accent: string;
};

/** Insurance providers listed on the marketplace. */
export const companies: Company[] = [
  {
    slug: "aegis-assurance",
    name: "Aegis Assurance",
    tagline: "Rwanda's most-bought motor and home cover",
    about:
      "Aegis Assurance has underwritten personal lines in Rwanda since 2004, with a service model built around same-week claim settlement and a nationwide garage network.",
    rating: 4.8,
    founded: 2004,
    headquarters: "Kigali, Nyarugenge",
    license: "BNR/INS/0142",
    claimsPaidRate: "97.4%",
    avgClaimDays: 3,
    branches: 21,
    accent: "Motor & home specialist",
  },
  {
    slug: "northwind-mutual",
    name: "Northwind Mutual",
    tagline: "Digital-first cover with the lowest entry premiums",
    about:
      "A mutual insurer owned by its policyholders. Northwind runs a fully digital claims desk and prices aggressively for first-time buyers and small businesses.",
    rating: 4.6,
    founded: 2011,
    headquarters: "Kigali, Gasabo",
    license: "BNR/INS/0233",
    claimsPaidRate: "95.1%",
    avgClaimDays: 5,
    branches: 9,
    accent: "Best value pricing",
  },
  {
    slug: "meridian-insurance",
    name: "Meridian Insurance",
    tagline: "Premium cover with same-day claim payouts",
    about:
      "Meridian focuses on high-value personal and travel risks, with agreed-value settlements and a 24/7 priority assistance desk in Kigali and abroad.",
    rating: 4.9,
    founded: 1998,
    headquarters: "Kigali, Kicukiro",
    license: "BNR/INS/0088",
    claimsPaidRate: "98.2%",
    avgClaimDays: 1,
    branches: 14,
    accent: "Fastest claims on the platform",
  },
  {
    slug: "solstice-cover",
    name: "Solstice Cover",
    tagline: "Commercial fleet and SME package specialists",
    about:
      "Solstice writes commercial risks for transporters, cooperatives and SMEs, with telematics-based fleet pricing and dedicated account handlers.",
    rating: 4.4,
    founded: 2009,
    headquarters: "Kigali, Gasabo",
    license: "BNR/INS/0197",
    claimsPaidRate: "93.8%",
    avgClaimDays: 6,
    branches: 7,
    accent: "Fleet & SME focus",
  },
  {
    slug: "harborline-group",
    name: "Harborline Group",
    tagline: "Health and professional liability at scale",
    about:
      "Harborline runs the largest cashless medical network on the platform and underwrites professional indemnity for regulated professions.",
    rating: 4.7,
    founded: 2006,
    headquarters: "Kigali, Nyarugenge",
    license: "BNR/INS/0165",
    claimsPaidRate: "96.6%",
    avgClaimDays: 2,
    branches: 18,
    accent: "Health network of 240 clinics",
  },
  {
    slug: "vantage-underwriters",
    name: "Vantage Underwriters",
    tagline: "Affordable everyday cover, no medical exams",
    about:
      "Vantage keeps underwriting light: instant issue on gadget and solo health plans, with claims handled entirely in-app.",
    rating: 4.3,
    founded: 2015,
    headquarters: "Kigali, Kicukiro",
    license: "BNR/INS/0281",
    claimsPaidRate: "92.5%",
    avgClaimDays: 4,
    branches: 5,
    accent: "Instant issue plans",
  },
];

export function getCompany(slug: string) {
  return companies.find((c) => c.slug === slug);
}

export function companyProducts(company: Company): Plan[] {
  return plans.filter((p) => p.provider === company.name);
}

export function companyBySlugForPlan(plan: Plan) {
  return companies.find((c) => c.name === plan.provider);
}

export function getPlan(id: string) {
  return plans.find((p) => p.id === id);
}

/** Category-level exclusions surfaced on the product detail page. */
export const exclusionsByCategory: Record<string, string[]> = {
  motor: [
    "Driving without a valid Rwandan licence or under the influence",
    "Wear and tear, mechanical or electrical breakdown",
    "Use for racing, hire or reward unless declared",
    "Loss of keys where no forced entry occurred",
  ],
  health: [
    "Conditions declared and excluded at underwriting",
    "Cosmetic and elective procedures",
    "Treatment outside the declared network without pre-authorisation",
    "Injury from professional sports",
  ],
  travel: [
    "Trips booked after a known disruption event",
    "Pre-existing medical conditions not declared",
    "Unattended baggage",
    "Travel against government advisories",
  ],
  home: [
    "Gradual damp, subsidence or poor maintenance",
    "Theft from an unoccupied property beyond 60 days",
    "Cash beyond the declared limit",
    "Damage during structural renovation",
  ],
  gadget: [
    "Cosmetic damage that does not affect function",
    "Devices bought second-hand without proof of purchase",
    "Loss without forced entry or a police report",
    "Devices older than 36 months at inception",
  ],
  cyber: [
    "Incidents pre-dating the policy start date",
    "Loss caused by unpatched systems flagged at underwriting",
    "Fines that are uninsurable by law",
    "Failure to maintain multi-factor authentication",
  ],
};

export function exclusionsFor(categorySlug: string) {
  return (
    exclusionsByCategory[categorySlug] ?? [
      "Losses arising before the policy start date",
      "Deliberate acts, fraud or misrepresentation",
      "War, nuclear and sanctioned-territory exposures",
      "Any activity excluded in the policy schedule",
    ]
  );
}
