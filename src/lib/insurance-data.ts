import {
  Car,
  HeartPulse,
  Plane,
  Home,
  Building2,
  Flame,
  Ship,
  Package,
  Sprout,
  ShieldCheck,
  Briefcase,
  UserRound,
  Smartphone,
  PawPrint,
  GraduationCap,
  Landmark,
} from "lucide-react";

/** Format an amount in Rwandan francs. */
export function formatRwf(amount: number, opts?: { compact?: boolean }) {
  if (opts?.compact && amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `RWF ${m % 1 === 0 ? m : m.toFixed(1)}M`;
  }
  return `RWF ${amount.toLocaleString("en-US")}`;
}

export type Category = {
  slug: string;
  name: string;
  icon: typeof Car;
  blurb: string;
  products: number;
  from: string;
};

export const categories: Category[] = [
  { slug: "motor", name: "Motor", icon: Car, blurb: "Comprehensive & third-party cover", products: 148, from: "RWF 24,000/mo" },
  { slug: "health", name: "Health", icon: HeartPulse, blurb: "Individual & family medical plans", products: 96, from: "RWF 44,000/mo" },
  { slug: "life", name: "Life", icon: ShieldCheck, blurb: "Term, whole life & income cover", products: 61, from: "RWF 16,000/mo" },
  { slug: "travel", name: "Travel", icon: Plane, blurb: "Single trip & annual multi-trip", products: 74, from: "RWF 8,000/trip" },
  { slug: "home", name: "Home", icon: Home, blurb: "Building, contents & tenants", products: 52, from: "RWF 18,000/mo" },
  { slug: "property", name: "Property", icon: Landmark, blurb: "Landlord & commercial property", products: 38, from: "RWF 38,000/mo" },
  { slug: "business", name: "Business", icon: Briefcase, blurb: "SME packages & liability", products: 83, from: "RWF 54,000/mo" },
  { slug: "fire", name: "Fire", icon: Flame, blurb: "Fire, lightning & allied perils", products: 27, from: "RWF 14,000/mo" },
  { slug: "marine", name: "Marine", icon: Ship, blurb: "Hull, freight & liability", products: 19, from: "Quote" },
  { slug: "cargo", name: "Cargo", icon: Package, blurb: "Goods in transit worldwide", products: 24, from: "Quote" },
  { slug: "agriculture", name: "Agriculture", icon: Sprout, blurb: "Crop, livestock & index cover", products: 16, from: "RWF 12,000/mo" },
  { slug: "cyber", name: "Cyber", icon: ShieldCheck, blurb: "Breach response & liability", products: 22, from: "RWF 33,000/mo" },
  { slug: "liability", name: "Professional Liability", icon: Briefcase, blurb: "Errors, omissions & indemnity", products: 31, from: "RWF 29,000/mo" },
  { slug: "accident", name: "Personal Accident", icon: UserRound, blurb: "Injury, disability & cash benefit", products: 29, from: "RWF 6,500/mo" },
  { slug: "gadget", name: "Device & Gadget", icon: Smartphone, blurb: "Phones, laptops & wearables", products: 44, from: "RWF 4,000/mo" },
  { slug: "pet", name: "Pet", icon: PawPrint, blurb: "Vet fees, illness & accident", products: 18, from: "RWF 10,000/mo" },
  { slug: "education", name: "Education", icon: GraduationCap, blurb: "Tuition protection & savings", products: 13, from: "RWF 20,000/mo" },
  { slug: "sme-fleet", name: "Fleet", icon: Building2, blurb: "Multi-vehicle commercial fleet", products: 21, from: "Quote" },
];

export type CustomerType = "Individual" | "Family" | "SME" | "Enterprise";
export type PaymentOption = "Monthly" | "Quarterly" | "Annual" | "Instalments";

export type Plan = {
  id: string;
  provider: string;
  providerRating: number;
  name: string;
  category: string;
  categorySlug: string;
  /** Monthly premium in RWF */
  monthly: number;
  /** Cover limit in RWF */
  coverAmount: number;
  /** Excess in RWF */
  excessAmount: number;
  claimDays: string;
  /** Average claim settlement time, in days — used for sorting */
  claimSpeed: number;
  customerTypes: CustomerType[];
  payments: PaymentOption[];
  badge?: "Best value" | "Most popular" | "Fastest claims";
  highlights: string[];
  features: Record<string, boolean | string>;
};

const motorFeatures = (liability: string, pa: string, extras: Partial<Plan["features"]> = {}) => ({
  "Own damage": true,
  "Third-party liability": liability,
  "Theft & fire": true,
  "Natural disaster": true,
  "Roadside assistance": "24/7",
  "No-claim discount": "Up to 40%",
  "Zero depreciation": true,
  "Personal accident": pa,
  ...extras,
});

export const plans: Plan[] = [
  {
    id: "aegis-motor-plus",
    provider: "Aegis Assurance",
    providerRating: 4.8,
    name: "Motor Comprehensive Plus",
    category: "Motor",
    categorySlug: "motor",
    monthly: 56_000,
    coverAmount: 110_000_000,
    excessAmount: 325_000,
    claimDays: "3 days avg.",
    claimSpeed: 3,
    customerTypes: ["Individual", "Family"],
    payments: ["Monthly", "Quarterly", "Annual"],
    badge: "Most popular",
    highlights: ["Courtesy car included", "Windscreen cover", "Unlimited roadside assist"],
    features: motorFeatures("RWF 1.3B", "RWF 32,000,000"),
  },
  {
    id: "northwind-motor-core",
    provider: "Northwind Mutual",
    providerRating: 4.6,
    name: "DriveCore Essential",
    category: "Motor",
    categorySlug: "motor",
    monthly: 38_000,
    coverAmount: 78_000_000,
    excessAmount: 520_000,
    claimDays: "5 days avg.",
    claimSpeed: 5,
    customerTypes: ["Individual"],
    payments: ["Monthly", "Instalments"],
    badge: "Best value",
    highlights: ["Lowest premium in class", "Digital-only claims", "Flexible monthly billing"],
    features: motorFeatures("RWF 650M", "RWF 13,000,000", {
      "Natural disaster": false,
      "Roadside assistance": "Business hours",
      "No-claim discount": "Up to 25%",
      "Zero depreciation": false,
    }),
  },
  {
    id: "meridian-motor-signature",
    provider: "Meridian Insurance",
    providerRating: 4.9,
    name: "Signature Motor 360",
    category: "Motor",
    categorySlug: "motor",
    monthly: 76_000,
    coverAmount: 156_000_000,
    excessAmount: 130_000,
    claimDays: "24 hours avg.",
    claimSpeed: 1,
    customerTypes: ["Individual", "Family", "Enterprise"],
    payments: ["Monthly", "Quarterly", "Annual"],
    badge: "Fastest claims",
    highlights: ["Agreed value cover", "Same-day claim payout", "Global driving extension"],
    features: motorFeatures("RWF 2.6B", "RWF 65,000,000", {
      "Roadside assistance": "24/7 priority",
      "No-claim discount": "Up to 50%",
    }),
  },
  {
    id: "solstice-motor-fleet",
    provider: "Solstice Cover",
    providerRating: 4.4,
    name: "Fleet Shield Commercial",
    category: "Fleet",
    categorySlug: "sme-fleet",
    monthly: 420_000,
    coverAmount: 900_000_000,
    excessAmount: 1_200_000,
    claimDays: "4 days avg.",
    claimSpeed: 4,
    customerTypes: ["SME", "Enterprise"],
    payments: ["Quarterly", "Annual", "Instalments"],
    highlights: ["Up to 60 vehicles", "Telematics discount", "Dedicated fleet handler"],
    features: motorFeatures("RWF 3.1B", "RWF 40,000,000"),
  },
  {
    id: "harborline-health-family",
    provider: "Harborline Group",
    providerRating: 4.7,
    name: "Family Health Complete",
    category: "Health",
    categorySlug: "health",
    monthly: 92_000,
    coverAmount: 240_000_000,
    excessAmount: 0,
    claimDays: "2 days avg.",
    claimSpeed: 2,
    customerTypes: ["Individual", "Family"],
    payments: ["Monthly", "Annual"],
    badge: "Most popular",
    highlights: ["Outpatient & dental", "Maternity cover", "Cashless network of 240 clinics"],
    features: {
      Inpatient: true,
      Outpatient: true,
      Maternity: true,
      Dental: true,
      Optical: false,
      "Chronic conditions": "After 6 months",
    },
  },
  {
    id: "vantage-health-solo",
    provider: "Vantage Underwriters",
    providerRating: 4.3,
    name: "Solo Care Standard",
    category: "Health",
    categorySlug: "health",
    monthly: 44_000,
    coverAmount: 85_000_000,
    excessAmount: 50_000,
    claimDays: "6 days avg.",
    claimSpeed: 6,
    customerTypes: ["Individual"],
    payments: ["Monthly", "Instalments"],
    badge: "Best value",
    highlights: ["Affordable outpatient", "Telemedicine included", "No medical exam"],
    features: {
      Inpatient: true,
      Outpatient: true,
      Maternity: false,
      Dental: false,
      Optical: false,
      "Chronic conditions": "Excluded",
    },
  },
  {
    id: "aegis-home-secure",
    provider: "Aegis Assurance",
    providerRating: 4.8,
    name: "HomeSecure Buildings & Contents",
    category: "Home",
    categorySlug: "home",
    monthly: 26_000,
    coverAmount: 150_000_000,
    excessAmount: 200_000,
    claimDays: "5 days avg.",
    claimSpeed: 5,
    customerTypes: ["Individual", "Family"],
    payments: ["Monthly", "Annual"],
    highlights: ["Buildings & contents", "Accidental damage", "Alternative accommodation"],
    features: {
      Buildings: true,
      Contents: true,
      "Accidental damage": true,
      "Theft & burglary": true,
      "Flood & storm": true,
    },
  },
  {
    id: "meridian-travel-annual",
    provider: "Meridian Insurance",
    providerRating: 4.9,
    name: "Worldwide Multi-Trip",
    category: "Travel",
    categorySlug: "travel",
    monthly: 18_000,
    coverAmount: 60_000_000,
    excessAmount: 80_000,
    claimDays: "3 days avg.",
    claimSpeed: 3,
    customerTypes: ["Individual", "Family"],
    payments: ["Annual", "Monthly"],
    highlights: ["Unlimited trips up to 45 days", "Medical evacuation", "Baggage & delay cover"],
    features: {
      "Medical emergency": true,
      "Trip cancellation": true,
      "Baggage loss": true,
      "Adventure sports": "Optional",
    },
  },
  {
    id: "northwind-cyber-sme",
    provider: "Northwind Mutual",
    providerRating: 4.6,
    name: "Cyber SME Essentials",
    category: "Cyber",
    categorySlug: "cyber",
    monthly: 145_000,
    coverAmount: 500_000_000,
    excessAmount: 2_000_000,
    claimDays: "48 hours avg.",
    claimSpeed: 2,
    customerTypes: ["SME", "Enterprise"],
    payments: ["Quarterly", "Annual"],
    badge: "Fastest claims",
    highlights: ["24/7 breach hotline", "Ransomware cover", "Regulatory defence costs"],
    features: {
      "Breach response": true,
      "Business interruption": true,
      Ransomware: true,
      "Third-party liability": "RWF 500M",
    },
  },
  {
    id: "solstice-business-package",
    provider: "Solstice Cover",
    providerRating: 4.4,
    name: "SME Business Package",
    category: "Business",
    categorySlug: "business",
    monthly: 98_000,
    coverAmount: 400_000_000,
    excessAmount: 800_000,
    claimDays: "7 days avg.",
    claimSpeed: 7,
    customerTypes: ["SME"],
    payments: ["Monthly", "Quarterly", "Annual", "Instalments"],
    highlights: ["Property, stock & liability", "Employer's liability", "Business interruption"],
    features: {
      "Property damage": true,
      "Public liability": "RWF 400M",
      "Employers' liability": true,
      "Business interruption": true,
    },
  },
  {
    id: "harborline-liability-pro",
    provider: "Harborline Group",
    providerRating: 4.7,
    name: "Professional Indemnity Pro",
    category: "Professional Liability",
    categorySlug: "liability",
    monthly: 64_000,
    coverAmount: 300_000_000,
    excessAmount: 600_000,
    claimDays: "8 days avg.",
    claimSpeed: 8,
    customerTypes: ["Individual", "SME", "Enterprise"],
    payments: ["Quarterly", "Annual"],
    highlights: ["Errors & omissions", "Legal defence costs", "Retroactive cover"],
    features: {
      "Errors & omissions": true,
      "Legal defence": true,
      "Retroactive cover": "Up to 3 years",
      Defamation: true,
    },
  },
  {
    id: "vantage-gadget-care",
    provider: "Vantage Underwriters",
    providerRating: 4.3,
    name: "Gadget Care Plus",
    category: "Device & Gadget",
    categorySlug: "gadget",
    monthly: 7_500,
    coverAmount: 3_500_000,
    excessAmount: 25_000,
    claimDays: "2 days avg.",
    claimSpeed: 2,
    customerTypes: ["Individual", "Family"],
    payments: ["Monthly", "Annual"],
    badge: "Best value",
    highlights: ["Accidental damage", "Theft cover", "48-hour replacement"],
    features: {
      "Accidental damage": true,
      Theft: true,
      "Liquid damage": true,
      "Worldwide cover": true,
    },
  },
];

export const comparisonRows = [
  "Own damage",
  "Third-party liability",
  "Theft & fire",
  "Natural disaster",
  "Roadside assistance",
  "No-claim discount",
  "Zero depreciation",
  "Personal accident",
] as const;

/** The three motor policies shown side-by-side on the compare page. */
export const comparePlans = plans.filter((p) => p.categorySlug === "motor").slice(0, 3);

export const providers = [
  "Aegis Assurance",
  "Northwind Mutual",
  "Meridian Insurance",
  "Solstice Cover",
  "Harborline Group",
  "Vantage Underwriters",
];

export const premiumRanges = [
  { label: "Under RWF 25,000/mo", min: 0, max: 25_000 },
  { label: "RWF 25,000 – 60,000/mo", min: 25_000, max: 60_000 },
  { label: "RWF 60,000 – 150,000/mo", min: 60_000, max: 150_000 },
  { label: "RWF 150,000+/mo", min: 150_000, max: Number.POSITIVE_INFINITY },
];

export const customerTypes: CustomerType[] = ["Individual", "Family", "SME", "Enterprise"];
export const paymentOptions: PaymentOption[] = ["Monthly", "Quarterly", "Annual", "Instalments"];
