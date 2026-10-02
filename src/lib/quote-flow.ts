export type QuoteStep = "questionnaire" | "review" | "checkout" | "payment";

export type PersonalDetails = {
  fullName: string;
  email: string;
  phone: string;
  nationalId: string;
  address: string;
};

export type DraftQuote = {
  id: string;
  planId: string;
  step: QuoteStep;
  answers: Record<string, string>;
  premium: number | null;
  breakdown: PremiumBreakdown | null;
  personal: PersonalDetails;
  documents: string[];
  termsAccepted: boolean;
  paymentReference: string | null;
  status: "draft" | "accepted" | "paid";
  createdAt: string;
  updatedAt: string;
};

export type IssuedPolicy = {
  id: string;
  policyNumber: string;
  certificateId: string;
  planId: string;
  planName: string;
  provider: string;
  category: string;
  premium: number;
  paidAt: string;
  startDate: string;
  endDate: string;
  holder: PersonalDetails;
  documents: string[];
  paymentReference: string;
};

/* ------------------------------------------------------------------ */
/* Questionnaires — the pricing questions asked per insurance category */
/* ------------------------------------------------------------------ */

export type QuestionValidation = {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};

export type Question = {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "date";
  options?: string[];
  help?: string;
  placeholder?: string;
  required?: boolean;
  validation?: QuestionValidation;
};

export type Questionnaire = {
  intro: string;
  questions: Question[];
};

export type ServerQuestion = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "date";
  options: string[];
  help: string | null;
  placeholder: string | null;
  required: boolean;
  validation: QuestionValidation | null;
};

/**
 * Builds the questionnaire for the quote flow from backend-managed questions
 * (category defaults inherited by the product plus insurer product extras).
 * Falls back to the built-in per-category questionnaire when a plan has no
 * active questions set up yet.
 */
export function questionnaireFromServer(
  items: ServerQuestion[] | null | undefined,
  fallback: Questionnaire,
): Questionnaire {
  if (!items || items.length === 0) return fallback;
  return {
    intro: fallback.intro,
    questions: items.map((q) => ({
      id: q.key,
      label: q.label,
      type: q.type,
      options: q.options && q.options.length > 0 ? q.options : undefined,
      help: q.help ?? undefined,
      placeholder: q.placeholder ?? undefined,
      required: q.required,
      validation: q.validation ?? undefined,
    })),
  };
}

const generic: Questionnaire = {
  intro: "A few details about what you want covered so we can price it accurately.",
  questions: [
    { id: "insuredName", label: "Who or what is being insured?", type: "text", placeholder: "Name or description" },
    { id: "sumInsured", label: "Value to insure (RWF)", type: "number", placeholder: "e.g. 5000000" },
    { id: "startDate", label: "Preferred start date", type: "date" },
    {
      id: "priorClaims",
      label: "Claims in the last 3 years",
      type: "select",
      options: ["None", "1 claim", "2 or more"],
    },
  ],
};

export const questionnaires: Record<string, Questionnaire> = {
  motor: {
    intro: "Tell us about the vehicle and the main driver. This drives your motor premium.",
    questions: [
      { id: "plate", label: "Plate number", type: "text", placeholder: "RAB 123 X" },
      { id: "makeModel", label: "Make & model", type: "text", placeholder: "Toyota RAV4" },
      { id: "year", label: "Year of manufacture", type: "number", placeholder: "2019" },
      { id: "vehicleValue", label: "Current market value (RWF)", type: "number", placeholder: "18000000" },
      {
        id: "usage",
        label: "Vehicle use",
        type: "select",
        options: ["Private", "Business", "Commercial / hire"],
      },
      { id: "driverAge", label: "Main driver's age", type: "number", placeholder: "34" },
      {
        id: "licenceYears",
        label: "Years holding a licence",
        type: "select",
        options: ["Less than 2", "2 to 5", "More than 5"],
      },
      { id: "priorClaims", label: "Claims in the last 3 years", type: "select", options: ["None", "1 claim", "2 or more"] },
      { id: "startDate", label: "Preferred start date", type: "date" },
    ],
  },
  health: {
    intro: "Medical history helps us confirm eligibility and load the premium fairly.",
    questions: [
      { id: "memberAge", label: "Main member's age", type: "number", placeholder: "36" },
      { id: "dependants", label: "Dependants to cover", type: "select", options: ["0", "1", "2", "3", "4 or more"] },
      { id: "smoker", label: "Do you smoke?", type: "select", options: ["No", "Yes"] },
      {
        id: "chronic",
        label: "Any chronic conditions?",
        type: "select",
        options: ["None", "Managed with medication", "Under active treatment"],
      },
      { id: "hospitalisations", label: "Hospital admissions in the last 2 years", type: "select", options: ["None", "1", "2 or more"] },
      { id: "startDate", label: "Preferred start date", type: "date" },
    ],
  },
  travel: {
    intro: "Trip details determine your travel premium and medical limits.",
    questions: [
      { id: "destination", label: "Main destination region", type: "select", options: ["Africa", "Europe", "Asia", "Americas", "Worldwide"] },
      { id: "travellers", label: "Number of travellers", type: "select", options: ["1", "2", "3", "4 or more"] },
      { id: "tripDays", label: "Longest trip length (days)", type: "number", placeholder: "14" },
      { id: "travellerAge", label: "Oldest traveller's age", type: "number", placeholder: "41" },
      { id: "sports", label: "Adventure sports cover?", type: "select", options: ["No", "Yes"] },
      { id: "startDate", label: "Cover start date", type: "date" },
    ],
  },
  home: {
    intro: "Property details so we can rate buildings and contents correctly.",
    questions: [
      { id: "address", label: "Property address", type: "text", placeholder: "Kicukiro, Kigali" },
      { id: "propertyType", label: "Property type", type: "select", options: ["Apartment", "House", "Compound / multiple units"] },
      { id: "buildingValue", label: "Rebuild value (RWF)", type: "number", placeholder: "120000000" },
      { id: "contentsValue", label: "Contents value (RWF)", type: "number", placeholder: "15000000" },
      { id: "security", label: "Security in place", type: "select", options: ["Guard & alarm", "Guard only", "None"] },
      { id: "startDate", label: "Preferred start date", type: "date" },
    ],
  },
  gadget: {
    intro: "Device details so we can confirm value and eligibility.",
    questions: [
      { id: "device", label: "Device make & model", type: "text", placeholder: "iPhone 14 Pro" },
      { id: "deviceValue", label: "Replacement value (RWF)", type: "number", placeholder: "1400000" },
      { id: "deviceAge", label: "Device age", type: "select", options: ["Under 12 months", "12 to 24 months", "Over 24 months"] },
      { id: "priorClaims", label: "Claims in the last 2 years", type: "select", options: ["None", "1 claim", "2 or more"] },
      { id: "startDate", label: "Preferred start date", type: "date" },
    ],
  },
};

export function questionnaireFor(categorySlug: string): Questionnaire {
  return questionnaires[categorySlug] ?? generic;
}

/* ------------------------------------------------------------------ */
/* Premium breakdown shape (computed server-side by the pricing API)   */
/* ------------------------------------------------------------------ */

export type PremiumBreakdown = {
  base: number;
  loadings: { label: string; factor: number }[];
  monthly: number;
  annual: number;
};

/* ------------------------------------------------------------------ */
/* Step metadata                                                       */
/* ------------------------------------------------------------------ */

export const emptyPersonal: PersonalDetails = {
  fullName: "",
  email: "",
  phone: "",
  nationalId: "",
  address: "",
};

export const stepOrder: QuoteStep[] = ["questionnaire", "review", "checkout", "payment"];

export const stepLabels: Record<QuoteStep, string> = {
  questionnaire: "Questionnaire",
  review: "Contact & Submit",
  checkout: "Checkout",
  payment: "Payment",
};

export function resumePath(draft: DraftQuote) {
  switch (draft.step) {
    case "review":
      return `/review/${draft.id}`;
    case "checkout":
      return `/checkout/${draft.id}`;
    case "payment":
      return `/pay/${draft.id}`;
    default:
      return `/quote/${draft.id}`;
  }
}
