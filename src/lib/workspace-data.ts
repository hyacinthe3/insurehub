import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Building2,
  Briefcase,
  CreditCard,
  FileText,
  LifeBuoy,
  ListChecks,
  MessagesSquare,
  Package,
  RefreshCw,
  Scale,
  ScrollText,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  UserRound,
} from "lucide-react";

import type { Role } from "@/lib/rbac";
import type { StatusTone, TableCell } from "@/components/dashboard/ui-bits";

export type QuickAction = { label: string; to?: string; primary?: boolean };

export type TableBlock = {
  kind: "table";
  title: string;
  description?: string;
  columns: string[];
  rows: TableCell[][];
  rowActions?: string[];
  emptyTitle?: string;
  emptyBody?: string;
};

export type TabbedTableBlock = {
  kind: "tabs";
  title: string;
  description?: string;
  columns: string[];
  rowActions?: string[];
  tabs: {
    label: string;
    rows: TableCell[][];
    emptyTitle: string;
    emptyBody: string;
    emptyAction?: QuickAction;
  }[];
};

export type QueueBlock = {
  kind: "queue";
  title: string;
  description?: string;
  actions: string[];
  items: {
    title: string;
    meta: string;
    detail: string;
    status: string;
    tone: StatusTone;
    timeline?: string[];
  }[];
  emptyTitle: string;
  emptyBody: string;
};

export type NoteBlock = {
  kind: "note";
  title: string;
  description?: string;
  points: string[];
  action?: QuickAction;
};

export type Block = TableBlock | TabbedTableBlock | QueueBlock | NoteBlock;

export type ModulePage = {
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: QuickAction[];
  stats?: { label: string; value: string; delta?: string; tone?: StatusTone }[];
  blocks: Block[];
};

const ok = (label: string): TableCell => ({ pill: label, tone: "success" });
const warn = (label: string): TableCell => ({ pill: label, tone: "warning" });
const bad = (label: string): TableCell => ({ pill: label, tone: "danger" });
const info = (label: string): TableCell => ({ pill: label, tone: "info" });
const off = (label: string): TableCell => ({ pill: label, tone: "neutral" });

/* ------------------------------- customer ------------------------------- */

const customerPages: Record<string, ModulePage> = {
  policies: {
    title: "My policies",
    description: "Everything you're covered for, in one place.",
    icon: ShieldCheck,
    actions: [{ label: "Buy insurance", to: "/browse", primary: true }],
    blocks: [
      {
        kind: "tabs",
        title: "Policies",
        columns: ["Policy", "Provider", "Premium", "Renews", "Status"],
        rowActions: ["View cover", "Documents", "Renew", "Submit claim"],
        tabs: [
          {
            label: "Active",
            rows: [
              ["Comprehensive motor", "Aegis Assurance", "RWF 780,000 / yr", "14 Sep 2026", ok("Active")],
              ["Home & contents", "Harborline Group", "RWF 410,000 / yr", "02 Nov 2026", ok("Active")],
              ["Private health", "Vantage Underwriters", "RWF 960,000 / yr", "30 Jan 2027", ok("Active")],
            ],
            emptyTitle: "No active policies yet",
            emptyBody: "Browse the marketplace and buy your first cover — you'll see it here instantly.",
            emptyAction: { label: "Browse cover", to: "/browse" },
          },
          {
            label: "Expired",
            rows: [["Travel — Europe 30 days", "Meridian Insurance", "RWF 62,000", "Expired 11 Mar 2026", bad("Expired")]],
            emptyTitle: "Nothing expired",
            emptyBody: "Policies move here once their cover period ends.",
          },
          {
            label: "Pending",
            rows: [["Travel — worldwide", "Meridian Insurance", "RWF 148,000 / yr", "Awaiting payment", warn("Pending")]],
            emptyTitle: "No pending policies",
            emptyBody: "Cover you've applied for but not yet paid appears here.",
          },
          {
            label: "Cancelled",
            rows: [],
            emptyTitle: "No cancelled policies",
            emptyBody: "You haven't cancelled any cover. Cancelling never affects your claims history.",
          },
        ],
      },
      {
        kind: "note",
        title: "Comprehensive motor — what's covered",
        description: "Policy AEG-MTR-40912 · Aegis Assurance",
        points: [
          "Own damage up to RWF 28,000,000 · excess RWF 250,000",
          "Third-party liability unlimited · passenger liability RWF 10,000,000",
          "Windscreen, theft and fire included · courtesy car for 14 days",
          "Documents: schedule, certificate, terms (PDF)",
        ],
        action: { label: "Submit a claim on this policy", primary: true },
      },
    ],
  },
  compare: {
    title: "Compare cover",
    description: "Line up your current policy against live marketplace quotes.",
    icon: Scale,
    actions: [{ label: "Open comparison tool", to: "/compare", primary: true }],
    blocks: [
      {
        kind: "table",
        title: "Saved comparisons",
        columns: ["Comparison", "Plans", "Best premium", "Saved"],
        rowActions: ["Open"],
        rows: [
          ["Motor renewal 2026", "3 plans", "RWF 692,000 / yr", "18 Jul 2026"],
          ["Family health", "4 plans", "RWF 1,120,000 / yr", "02 Jul 2026"],
        ],
        emptyTitle: "No saved comparisons",
        emptyBody: "Compare any two plans in the marketplace and save the result here.",
      },
    ],
  },
  claims: {
    title: "Claims",
    description: "Track every claim from submission to payout.",
    icon: LifeBuoy,
    actions: [{ label: "Submit a claim", primary: true }],
    stats: [
      { label: "Open claims", value: "1", tone: "warning" },
      { label: "Approved this year", value: "2", tone: "success" },
      { label: "Total paid out", value: "RWF 1,840,000" },
      { label: "Avg. settlement", value: "6 days" },
    ],
    blocks: [
      {
        kind: "queue",
        title: "Your claims",
        actions: ["View evidence", "Timeline"],
        items: [
          {
            title: "Windscreen replacement — motor",
            meta: "Claim #48210 · Aegis Assurance · RWF 340,000",
            detail: "3 photos, garage quote and police reference uploaded.",
            status: "Under review",
            tone: "warning",
            timeline: ["Submitted 22 Jul", "Documents received 23 Jul", "Assessor assigned 24 Jul"],
          },
          {
            title: "Water damage — kitchen",
            meta: "Claim #47188 · Harborline Group · RWF 1,200,000",
            detail: "Settled to your MoMo account.",
            status: "Approved",
            tone: "success",
            timeline: ["Submitted 03 May", "Approved 07 May", "Paid 08 May"],
          },
          {
            title: "Lost luggage — travel",
            meta: "Claim #46022 · Meridian Insurance · RWF 210,000",
            detail: "Declined: claim fell outside the cover period.",
            status: "Rejected",
            tone: "danger",
            timeline: ["Submitted 14 Mar", "Reviewed 18 Mar", "Rejected 19 Mar"],
          },
        ],
        emptyTitle: "No claims yet — here's how to submit one",
        emptyBody:
          "Pick the affected policy, describe what happened, upload photos or receipts, and we'll route it to your insurer within minutes.",
      },
    ],
  },
  payments: {
    title: "Payments",
    description: "Invoices, receipts and the payment method we keep on file.",
    icon: CreditCard,
    actions: [{ label: "Pay outstanding balance", primary: true }, { label: "Add payment method" }],
    stats: [
      { label: "Outstanding", value: "RWF 148,000", tone: "warning" },
      { label: "Paid this year", value: "RWF 2,262,000" },
      { label: "Next charge", value: "01 Sep 2026" },
      { label: "Method on file", value: "MTN MoMo ••4417" },
    ],
    blocks: [
      {
        kind: "table",
        title: "Invoice history",
        columns: ["Invoice", "Policy", "Amount", "Date", "Status"],
        rowActions: ["Receipt"],
        rows: [
          ["INV-20461", "Travel — worldwide", "RWF 148,000", "28 Jul 2026", warn("Due")],
          ["INV-20114", "Private health", "RWF 960,000", "30 Jan 2026", ok("Paid")],
          ["INV-19980", "Home & contents", "RWF 410,000", "02 Nov 2025", ok("Paid")],
          ["INV-19702", "Comprehensive motor", "RWF 780,000", "14 Sep 2025", ok("Paid")],
        ],
        emptyTitle: "No invoices yet",
        emptyBody: "Once you buy cover, every invoice and receipt lands here.",
      },
      {
        kind: "note",
        title: "Payment method on file",
        description: "Used for renewals and instalments",
        points: ["MTN MoMo ending 4417 · Clarisse Mutoni", "Auto-renew enabled for 3 of 4 policies", "Receipts emailed to clarisse.mutoni@mail.rw"],
        action: { label: "Update payment method" },
      },
    ],
  },
  renewals: {
    title: "Renewals",
    description: "Nothing lapses without you knowing.",
    icon: RefreshCw,
    actions: [{ label: "Renew all due", primary: true }],
    blocks: [
      {
        kind: "table",
        title: "Coming up",
        columns: ["Policy", "Provider", "Renewal date", "New premium", "Status"],
        rowActions: ["Renew", "Compare"],
        rows: [
          ["Travel — worldwide", "Meridian Insurance", "21 Aug 2026", "RWF 148,000", warn("Due in 19 days")],
          ["Comprehensive motor", "Aegis Assurance", "14 Sep 2026", "RWF 780,000", warn("Due in 43 days")],
          ["Home & contents", "Harborline Group", "02 Nov 2026", "RWF 410,000", info("Scheduled")],
        ],
        emptyTitle: "Nothing to renew",
        emptyBody: "We'll email you 30 days before any policy is due.",
      },
    ],
  },
  profile: {
    title: "Profile",
    description: "Your details, security and notification preferences.",
    icon: UserRound,
    actions: [{ label: "Save changes", primary: true }],
    blocks: [
      {
        kind: "note",
        title: "Personal details",
        points: [
          "Clarisse Mutoni · clarisse.mutoni@mail.rw · +250 788 000 417",
          "National ID verified · 12 Feb 2026",
          "Address: KG 7 Ave, Kigali",
        ],
        action: { label: "Edit details" },
      },
      {
        kind: "note",
        title: "Security",
        points: ["Password updated 3 months ago", "Two-factor authentication: on (SMS)", "2 active sessions"],
        action: { label: "Manage security" },
      },
    ],
  },
  support: {
    title: "Support",
    description: "We answer in under 2 hours on weekdays.",
    icon: LifeBuoy,
    actions: [{ label: "New request", primary: true }],
    blocks: [
      {
        kind: "table",
        title: "Your requests",
        columns: ["Ref", "Subject", "Opened", "Status"],
        rowActions: ["Open"],
        rows: [["SUP-8841", "Claim #48210 — assessor visit date", "24 Jul 2026", warn("Awaiting us")]],
        emptyTitle: "No open requests",
        emptyBody: "Ask us anything about cover, claims or payments and we'll pick it up here.",
      },
    ],
  },
  messages: {
    title: "Messages",
    description: "Secure messages with your assigned broker.",
    icon: MessagesSquare,
    blocks: [],
  },
};

/* -------------------------------- insurer -------------------------------- */

const insurerPages: Record<string, ModulePage> = {
  products: {
    title: "Products",
    description: "Your company's products listed on the InsureHub marketplace.",
    icon: Package,
    blocks: [
      {
        kind: "table",
        title: "Product catalogue",
        description: "Scoped to your company",
        columns: ["Product", "Category", "Base premium", "Policies", "Status"],
        rowActions: ["Edit", "Archive"],
        rows: [
          ["Comprehensive motor 2026", "Motor", "RWF 780,000 / yr", "4,182", ok("Published")],
          ["Third-party motor", "Motor", "RWF 210,000 / yr", "9,044", ok("Published")],
          ["Family health plus", "Health", "RWF 1,240,000 / yr", "2,317", ok("Published")],
          ["Landlord buildings", "Property", "RWF 520,000 / yr", "—", warn("Pending review")],
          ["Cyber SME essentials", "Cyber", "RWF 1,900,000 / yr", "—", off("Draft")],
          ["Student travel 2024", "Travel", "RWF 48,000", "0", off("Archived")],
        ],
        emptyTitle: "No products yet",
        emptyBody: "Create your first product to start receiving quotes from the marketplace.",
      },
    ],
  },
  customers: {
    title: "Customers",
    description: "Policyholders insured by your company.",
    icon: Users,
    actions: [{ label: "Export CSV" }],
    blocks: [
      {
        kind: "table",
        title: "Policyholders",
        description: "Scoped to your company",
        columns: ["Customer", "Type", "Policies", "Premium (yr)", "Since", "Status"],
        rowActions: ["View"],
        rows: [
          ["Clarisse Mutoni", "Individual", "2", "RWF 1,740,000", "2023", ok("Active")],
          ["Northgate Logistics", "Business", "6", "RWF 84,000,000", "2021", ok("Active")],
          ["Bramley Dental", "Business", "3", "RWF 10,700,000", "2024", ok("Active")],
          ["Jean-Paul Rugema", "Individual", "1", "RWF 210,000", "2026", warn("Payment due")],
        ],
        emptyTitle: "No customers yet",
        emptyBody: "Customers appear here the moment a marketplace quote converts.",
      },
    ],
  },
  policies: {
    title: "Policies",
    description: "In-force, pending and lapsed policies you underwrite.",
    icon: ScrollText,
    stats: [
      { label: "In force", value: "15,543" },
      { label: "New (30d)", value: "812" },
      { label: "Lapsed (30d)", value: "134", tone: "danger" },
      { label: "Renewals due", value: "1,208", tone: "warning" },
    ],
    blocks: [
      {
        kind: "table",
        title: "Recent policies",
        columns: ["Policy no.", "Customer", "Product", "Premium", "Inception", "Status"],
        rowActions: ["Open"],
        rows: [
          ["AEG-MTR-40912", "Clarisse Mutoni", "Comprehensive motor", "RWF 780,000", "14 Sep 2025", ok("In force")],
          ["AEG-FLT-11204", "Northgate Logistics", "Fleet motor", "RWF 84,000,000", "12 Dec 2025", ok("In force")],
          ["AEG-HLT-30877", "Bramley Dental", "Group health", "RWF 10,700,000", "01 Feb 2026", ok("In force")],
          ["AEG-MTR-41880", "Jean-Paul Rugema", "Third-party motor", "RWF 210,000", "—", warn("Pending payment")],
          ["AEG-PRP-29001", "Rowan Estates", "Landlord buildings", "RWF 520,000", "18 Aug 2025", bad("Lapsed")],
        ],
        emptyTitle: "No policies yet",
        emptyBody: "Published products generate policies as customers buy them.",
      },
    ],
  },
  claims: {
    title: "Claims queue",
    description: "Sorted by urgency. SLA breaches surface first.",
    icon: LifeBuoy,
    stats: [
      { label: "Open claims", value: "37", tone: "warning" },
      { label: "Breaching SLA", value: "4", tone: "danger" },
      { label: "Approved (30d)", value: "212", tone: "success" },
      { label: "Paid (30d)", value: "RWF 418,000,000" },
    ],
    blocks: [
      {
        kind: "queue",
        title: "Awaiting decision",
        description: "Your company's claims only",
        actions: ["Approve", "Reject", "Request info"],
        items: [
          {
            title: "Fleet collision — 2 vehicles",
            meta: "AEG-FLT-11204 · Northgate Logistics · RWF 14,200,000",
            detail: "Police report, 8 photos, two repair quotes attached.",
            status: "SLA breach · 16 days",
            tone: "danger",
            timeline: ["Submitted 17 Jul", "Assessor assigned 19 Jul", "Awaiting decision"],
          },
          {
            title: "Windscreen replacement",
            meta: "AEG-MTR-40912 · Clarisse Mutoni · RWF 340,000",
            detail: "Garage quote verified against approved price list.",
            status: "Under review · 4 days",
            tone: "warning",
            timeline: ["Submitted 22 Jul", "Documents received 23 Jul"],
          },
          {
            title: "Dental surgery reimbursement",
            meta: "AEG-HLT-30877 · Bramley Dental · RWF 2,050,000",
            detail: "Invoice and treatment plan uploaded; member eligible.",
            status: "New · 1 day",
            tone: "info",
            timeline: ["Submitted 01 Aug"],
          },
        ],
        emptyTitle: "Queue is clear",
        emptyBody: "No claims awaiting a decision. New submissions arrive here in real time.",
      },
    ],
  },
  reports: {
    title: "Reports",
    description: "Exportable sales, claims and renewal reporting.",
    icon: FileText,
    actions: [{ label: "Export CSV", primary: true }, { label: "Export PDF" }, { label: "Date range: last 30 days" }],
    blocks: [
      {
        kind: "table",
        title: "Available reports",
        description: "Your company · 01 Jul – 31 Jul 2026",
        columns: ["Report", "Period", "Records", "Headline", "Last run"],
        rowActions: ["Run", "Export"],
        rows: [
          ["Sales by product", "Last 30 days", "812", "RWF 3.1B GWP", "01 Aug 2026"],
          ["Claims experience", "Last 30 days", "249", "Loss ratio 61.4%", "01 Aug 2026"],
          ["Renewal retention", "Last 90 days", "3,411", "Retention 87.2%", "31 Jul 2026"],
          ["Commission payable", "Last 30 days", "142", "RWF 96,400,000", "31 Jul 2026"],
        ],
        emptyTitle: "No reports available",
        emptyBody: "Reports generate once you have policy or claims activity.",
      },
    ],
  },
  payments: {
    title: "Payments",
    description: "Premium collection and settlement with InsureHub.",
    icon: CreditCard,
    stats: [
      { label: "Collected (30d)", value: "RWF 3.1B", tone: "success" },
      { label: "Outstanding", value: "RWF 214,000,000", tone: "warning" },
      { label: "Next settlement", value: "05 Aug 2026" },
      { label: "Platform fees (30d)", value: "RWF 62,000,000" },
    ],
    blocks: [
      {
        kind: "table",
        title: "Settlements",
        columns: ["Run", "Period", "Gross premium", "Fees", "Net to you", "Status"],
        rowActions: ["Statement"],
        rows: [
          ["SET-2608", "16–31 Jul 2026", "RWF 1.6B", "RWF 32,000,000", "RWF 1.57B", warn("Scheduled")],
          ["SET-2607", "01–15 Jul 2026", "RWF 1.5B", "RWF 30,000,000", "RWF 1.47B", ok("Paid")],
          ["SET-2606", "16–30 Jun 2026", "RWF 1.4B", "RWF 28,000,000", "RWF 1.37B", ok("Paid")],
        ],
        emptyTitle: "No settlements yet",
        emptyBody: "Settlement runs appear here twice a month.",
      },
    ],
  },
  settings: {
    title: "Settings",
    description: "Company profile, users and underwriting defaults.",
    icon: Settings,
    actions: [{ label: "Save changes", primary: true }],
    blocks: [
      {
        kind: "note",
        title: "Company profile",
        points: ["Aegis Assurance Ltd · RSSB licence AS-0142", "Verified by InsureHub admin on 04 Jan 2024", "Claims contact: claims@aegis.rw"],
        action: { label: "Edit profile" },
      },
      {
        kind: "note",
        title: "Team & permissions",
        points: ["6 users · 2 underwriters, 3 claims handlers, 1 admin", "SSO enforced for all staff accounts", "Claims approval limit: RWF 20,000,000"],
        action: { label: "Manage users" },
      },
    ],
  },
};

/* -------------------------------- broker --------------------------------- */

const brokerPages: Record<string, ModulePage> = {
  customers: {
    title: "My customers",
    description: "Only clients assigned to Kigali Risk Partners. Adding a client requires their consent.",
    icon: Users,
    actions: [{ label: "Add customer", primary: true }],
    blocks: [
      {
        kind: "table",
        title: "Assigned clients",
        description: "128 clients connected to you",
        columns: ["Client", "Type", "Policies", "Premium (yr)", "Consent", "Status"],
        rowActions: ["Open", "New quote"],
        rows: [
          ["Northgate Logistics", "Business", "6", "RWF 84,000,000", "Signed 12 Jan 2026", ok("Active")],
          ["Bramley Dental", "Business", "3", "RWF 10,700,000", "Signed 04 Mar 2026", ok("Active")],
          ["Helix Labs", "Business", "2", "RWF 27,500,000", "Signed 22 Feb 2026", ok("Active")],
          ["Rowan Estates", "Business", "1", "RWF 5,200,000", "Signed 18 Aug 2025", warn("Renewal due")],
          ["Claudine Ingabire", "Individual", "1", "RWF 780,000", "Consent requested", warn("Awaiting consent")],
        ],
        emptyTitle: "No customers yet",
        emptyBody: "Invite a client by email — they approve the connection before you see their data.",
      },
      {
        kind: "note",
        title: "Adding a customer",
        points: [
          "Send an invite with the client's email or phone number",
          "They confirm the broker mandate in their own InsureHub account",
          "Only then do their policies, quotes and claims appear in your book",
        ],
        action: { label: "Send invite", primary: true },
      },
    ],
  },
  quotes: {
    title: "Quotes",
    description: "Every quote you've built, sent or converted.",
    icon: FileText,
    actions: [{ label: "New quote", primary: true }],
    stats: [
      { label: "Draft quotes", value: "9" },
      { label: "Sent this month", value: "34", delta: "+8 vs June" },
      { label: "Expiring in 7 days", value: "6", tone: "warning" },
      { label: "Converted (30d)", value: "41", tone: "success" },
    ],
    blocks: [
      {
        kind: "table",
        title: "Quote pipeline",
        columns: ["Customer", "Product", "Premium", "Status", "Date"],
        rowActions: ["Open", "Send"],
        rows: [
          ["Northgate Logistics", "Fleet motor — 42 vehicles", "RWF 84,000,000", warn("Awaiting client"), "28 Jul 2026"],
          ["Bramley Dental", "Practice cover", "RWF 10,700,000", info("Sent"), "26 Jul 2026"],
          ["Helix Labs", "Cyber liability", "RWF 27,500,000", ok("Accepted"), "21 Jul 2026"],
          ["Rowan Estates", "Landlord buildings", "RWF 5,200,000", off("Draft"), "19 Jul 2026"],
          ["Claudine Ingabire", "Comprehensive motor", "RWF 780,000", bad("Expired"), "02 Jul 2026"],
        ],
        emptyTitle: "No quotes yet",
        emptyBody: "Start a quote for one of your clients — it takes about two minutes.",
      },
    ],
  },
  policies: {
    title: "Policies",
    description: "Policies you placed, across all carriers.",
    icon: ScrollText,
    blocks: [
      {
        kind: "table",
        title: "Placed policies",
        columns: ["Policy no.", "Client", "Carrier", "Premium", "Renews", "Status"],
        rowActions: ["Open"],
        rows: [
          ["AEG-FLT-11204", "Northgate Logistics", "Aegis Assurance", "RWF 84,000,000", "12 Dec 2026", ok("In force")],
          ["HRB-HLT-88120", "Bramley Dental", "Harborline Group", "RWF 10,700,000", "01 Feb 2027", ok("In force")],
          ["NWM-CYB-20411", "Helix Labs", "Northwind Mutual", "RWF 27,500,000", "30 Sep 2026", ok("In force")],
          ["AEG-PRP-29001", "Rowan Estates", "Aegis Assurance", "RWF 5,200,000", "18 Aug 2026", warn("Renewal due")],
        ],
        emptyTitle: "No placed policies",
        emptyBody: "Once a client accepts a quote and pays, the policy lands here.",
      },
    ],
  },
  renewals: {
    title: "Renewals",
    description: "Your book's expiries for the next 90 days.",
    icon: RefreshCw,
    actions: [{ label: "Start renewal batch", primary: true }],
    blocks: [
      {
        kind: "table",
        title: "Expiring soon",
        columns: ["Client", "Policy", "Expires", "Current premium", "Status"],
        rowActions: ["Re-quote", "Remind client"],
        rows: [
          ["Rowan Estates", "Landlord buildings", "18 Aug 2026", "RWF 5,200,000", warn("Due in 16 days")],
          ["Helix Labs", "Cyber liability", "30 Sep 2026", "RWF 27,500,000", info("Due in 59 days")],
          ["Northgate Logistics", "Fleet motor", "12 Dec 2026", "RWF 84,000,000", info("Scheduled")],
        ],
        emptyTitle: "No renewals due",
        emptyBody: "Policies appear here 90 days before expiry so you have time to re-quote.",
      },
    ],
  },
  claims: {
    title: "Claims",
    description: "Claims raised by your clients — you can chase carriers on their behalf.",
    icon: LifeBuoy,
    blocks: [
      {
        kind: "queue",
        title: "Client claims",
        actions: ["Chase carrier", "View evidence"],
        items: [
          {
            title: "Fleet collision — 2 vehicles",
            meta: "Northgate Logistics · Aegis Assurance · RWF 14,200,000",
            detail: "Carrier SLA breached — escalation sent 31 Jul.",
            status: "Under review",
            tone: "warning",
            timeline: ["Submitted 17 Jul", "Assessor assigned 19 Jul", "Escalated 31 Jul"],
          },
          {
            title: "Server room water ingress",
            meta: "Helix Labs · Northwind Mutual · RWF 8,600,000",
            detail: "Settled in full to client account.",
            status: "Approved",
            tone: "success",
            timeline: ["Submitted 02 Jun", "Approved 09 Jun", "Paid 11 Jun"],
          },
        ],
        emptyTitle: "No client claims",
        emptyBody: "When a client claims, it shows here so you can track the carrier's response.",
      },
    ],
  },
  commissions: {
    title: "Commissions",
    description: "Earnings tied to specific policy sales.",
    icon: Briefcase,
    stats: [
      { label: "Pending", value: "RWF 18,900,000", tone: "warning" },
      { label: "Paid (YTD)", value: "RWF 214,600,000", tone: "success" },
      { label: "Next payout", value: "05 Aug 2026" },
      { label: "Avg. rate", value: "12.4%" },
    ],
    blocks: [
      {
        kind: "table",
        title: "Commission ledger",
        columns: ["Policy", "Client", "Premium", "Rate", "Commission", "Status"],
        rowActions: ["Statement"],
        rows: [
          ["NWM-CYB-20411", "Helix Labs", "RWF 27,500,000", "14%", "RWF 3,850,000", warn("Pending")],
          ["HRB-HLT-88120", "Bramley Dental", "RWF 10,700,000", "12%", "RWF 1,284,000", warn("Pending")],
          ["AEG-FLT-11204", "Northgate Logistics", "RWF 84,000,000", "10%", "RWF 8,400,000", ok("Paid 05 Jul")],
          ["AEG-PRP-29001", "Rowan Estates", "RWF 5,200,000", "15%", "RWF 780,000", ok("Paid 05 Jul")],
        ],
        emptyTitle: "No commissions yet",
        emptyBody: "Commission accrues the moment a placed policy is paid for.",
      },
    ],
  },
  reports: {
    title: "Reports",
    description: "Production, retention and commission reporting for your book.",
    icon: FileText,
    actions: [{ label: "Export CSV", primary: true }, { label: "Date range: last 30 days" }],
    blocks: [
      {
        kind: "table",
        title: "Available reports",
        columns: ["Report", "Period", "Records", "Headline", "Last run"],
        rowActions: ["Run", "Export"],
        rows: [
          ["New business production", "Last 30 days", "41", "RWF 127,400,000 premium", "01 Aug 2026"],
          ["Renewal retention", "Last 90 days", "63", "Retention 91.1%", "31 Jul 2026"],
          ["Commission statement", "Last 30 days", "24", "RWF 50,400,000", "31 Jul 2026"],
        ],
        emptyTitle: "No reports available",
        emptyBody: "Reports build once you have quotes and policies in your book.",
      },
    ],
  },
  settings: {
    title: "Settings",
    description: "Agency profile, team and payout details.",
    icon: Settings,
    actions: [{ label: "Save changes", primary: true }],
    blocks: [
      {
        kind: "note",
        title: "Agency profile",
        points: ["Kigali Risk Partners · broker licence BR-0288", "Verified by InsureHub admin on 11 Feb 2025", "3 agents on the account"],
        action: { label: "Edit profile" },
      },
      {
        kind: "note",
        title: "Payout details",
        points: ["Bank of Kigali ••2210", "Payouts on the 5th of each month", "Commission statements emailed automatically"],
        action: { label: "Update payout details" },
      },
    ],
  },
  messages: {
    title: "Messages",
    description: "Secure customer and client messaging.",
    icon: MessagesSquare,
    blocks: [],
  },
};

/* --------------------------------- admin --------------------------------- */

const approvalQueue = (kind: "company" | "broker"): QueueBlock => ({
  kind: "queue",
  title: kind === "company" ? "Awaiting approval" : "Broker applications",
  description: "Platform-wide · gates the applicant's access to InsureHub",
  actions: ["Approve", "Reject", "Request info"],
  items:
    kind === "company"
      ? [
          {
            title: "Solstice Cover Ltd",
            meta: "Applied 29 Jul 2026 · RSSB licence AS-0311",
            detail: "Licence certificate, audited accounts and 3 product drafts submitted.",
            status: "Pending 4 days",
            tone: "warning",
            timeline: ["Applied 29 Jul", "Documents complete 30 Jul"],
          },
          {
            title: "Meridian Insurance Rwanda",
            meta: "Applied 26 Jul 2026 · RSSB licence AS-0298",
            detail: "Awaiting proof of reinsurance treaty.",
            status: "Info requested",
            tone: "info",
            timeline: ["Applied 26 Jul", "Info requested 28 Jul"],
          },
          {
            title: "Vantage Underwriters",
            meta: "Applied 21 Jul 2026 · RSSB licence AS-0276",
            detail: "Compliance review complete, ready for final sign-off.",
            status: "Pending 12 days",
            tone: "danger",
            timeline: ["Applied 21 Jul", "Compliance cleared 30 Jul"],
          },
        ]
      : [
          {
            title: "Kigali Risk Partners — new agent seat",
            meta: "Requested 31 Jul 2026 · agency BR-0288",
            detail: "Adds a third licensed agent to an already-verified agency.",
            status: "Pending 2 days",
            tone: "warning",
          },
          {
            title: "Umurava Brokers Ltd",
            meta: "Applied 27 Jul 2026 · licence BR-0341",
            detail: "Professional indemnity certificate uploaded.",
            status: "Pending 6 days",
            tone: "warning",
          },
          {
            title: "Horizon Advisory",
            meta: "Applied 12 Jul 2026 · licence pending",
            detail: "Licence number could not be verified with the regulator.",
            status: "Rejected",
            tone: "danger",
          },
        ],
  emptyTitle: "Approval queue is clear",
  emptyBody: "New applications appear here immediately and block the applicant until you decide.",
});

const adminPages: Record<string, ModulePage> = {
  companies: {
    title: "Insurance companies",
    description: "Approvals first — an unapproved carrier cannot list products or receive quotes.",
    icon: Building2,
    stats: [
      { label: "Pending approval", value: "7", tone: "warning" },
      { label: "Active companies", value: "24", tone: "success" },
      { label: "Suspended", value: "1", tone: "danger" },
      { label: "Avg. approval time", value: "3.4 days" },
    ],
    blocks: [
      approvalQueue("company"),
      {
        kind: "table",
        title: "All companies",
        columns: ["Company", "Licence", "Products", "GWP (30d)", "Status"],
        rowActions: ["Open", "Suspend"],
        rows: [
          ["Aegis Assurance", "AS-0142", "6", "RWF 3.1B", ok("Active")],
          ["Harborline Group", "AS-0155", "9", "RWF 2.4B", ok("Active")],
          ["Northwind Mutual", "AS-0163", "4", "RWF 1.8B", ok("Active")],
          ["Solstice Cover", "AS-0311", "3 drafts", "—", warn("Pending approval")],
          ["Atlas Provident", "AS-0121", "2", "RWF 0", bad("Suspended")],
        ],
        emptyTitle: "No companies onboarded",
        emptyBody: "Approve an application to see it listed here.",
      },
    ],
  },
  brokers: {
    title: "Brokers",
    description: "Approve, suspend and monitor broker agencies across the platform.",
    icon: Briefcase,
    stats: [
      { label: "Pending approval", value: "5", tone: "warning" },
      { label: "Active brokers", value: "63", tone: "success" },
      { label: "Agents", value: "184" },
      { label: "Commission (30d)", value: "RWF 412,000,000" },
    ],
    blocks: [
      approvalQueue("broker"),
      {
        kind: "table",
        title: "All brokers",
        columns: ["Agency", "Licence", "Agents", "Clients", "Status"],
        rowActions: ["Open", "Suspend"],
        rows: [
          ["Kigali Risk Partners", "BR-0288", "3", "128", ok("Active")],
          ["Umurava Brokers", "BR-0341", "5", "—", warn("Pending approval")],
          ["Lakeside Advisory", "BR-0203", "2", "74", ok("Active")],
          ["Horizon Advisory", "—", "1", "0", bad("Rejected")],
        ],
        emptyTitle: "No brokers onboarded",
        emptyBody: "Approve an application to see it listed here.",
      },
    ],
  },
  customers: {
    title: "Customers",
    description: "Every individual and business account on InsureHub.",
    icon: Users,
    stats: [
      { label: "Total customers", value: "38,204", delta: "+2.1% WoW" },
      { label: "Businesses", value: "1,942" },
      { label: "Verified KYC", value: "94.6%", tone: "success" },
      { label: "Flagged accounts", value: "11", tone: "danger" },
    ],
    blocks: [
      {
        kind: "table",
        title: "Recent accounts",
        columns: ["Account", "Type", "Policies", "Joined", "KYC"],
        rowActions: ["Open", "Suspend"],
        rows: [
          ["Clarisse Mutoni", "Individual", "4", "12 Feb 2023", ok("Verified")],
          ["Northgate Logistics", "Business", "17", "04 Apr 2021", ok("Verified")],
          ["Bramley Dental", "Business", "5", "19 Mar 2024", ok("Verified")],
          ["Jean-Paul Rugema", "Individual", "1", "28 Jul 2026", warn("Pending")],
          ["Anon. account #38204", "Individual", "0", "01 Aug 2026", bad("Flagged")],
        ],
        emptyTitle: "No customers yet",
        emptyBody: "Customer accounts appear here as people sign up.",
      },
    ],
  },
  products: {
    title: "Products",
    description: "Marketplace listing review across every carrier.",
    icon: Package,
    blocks: [
      {
        kind: "table",
        title: "Listing review",
        description: "Platform-wide",
        columns: ["Product", "Company", "Category", "Base premium", "Status"],
        rowActions: ["Approve", "Reject", "Request info"],
        rows: [
          ["Landlord buildings", "Aegis Assurance", "Property", "RWF 520,000", warn("Pending review")],
          ["SME cyber shield", "Northwind Mutual", "Cyber", "RWF 1,900,000", warn("Pending review")],
          ["Family health plus", "Aegis Assurance", "Health", "RWF 1,240,000", ok("Published")],
          ["Fleet motor pro", "Harborline Group", "Motor", "RWF 2,100,000", ok("Published")],
          ["Pet lifetime plus", "Solstice Cover", "Pet", "RWF 180,000", off("Draft")],
        ],
        emptyTitle: "Nothing to review",
        emptyBody: "Carrier submissions land here for approval before going live.",
      },
    ],
  },
  policies: {
    title: "Policies",
    description: "All policies in force across the marketplace.",
    icon: ScrollText,
    blocks: [],
  },
  claims: {
    title: "Claims",
    description: "Claims filed across every carrier on the marketplace.",
    icon: LifeBuoy,
    blocks: [],
  },
  payments: {
    title: "Payments",
    description: "Premium flow, platform fees and carrier settlements.",
    icon: CreditCard,
    stats: [
      { label: "Processed (30d)", value: "RWF 12.8B" },
      { label: "Platform fees (30d)", value: "RWF 256,000,000", tone: "success" },
      { label: "Failed payments", value: "184", tone: "danger" },
      { label: "Next settlement run", value: "05 Aug 2026" },
    ],
    blocks: [
      {
        kind: "table",
        title: "Settlement runs",
        columns: ["Run", "Counterparty", "Gross", "Fees", "Net", "Status"],
        rowActions: ["Statement"],
        rows: [
          ["SET-2608", "Aegis Assurance", "RWF 1.6B", "RWF 32,000,000", "RWF 1.57B", warn("Scheduled")],
          ["SET-2608", "Harborline Group", "RWF 1.2B", "RWF 24,000,000", "RWF 1.18B", warn("Scheduled")],
          ["SET-2607", "Northwind Mutual", "RWF 900,000,000", "RWF 18,000,000", "RWF 882,000,000", ok("Paid")],
        ],
        emptyTitle: "No settlements yet",
        emptyBody: "Runs are generated twice a month for every active carrier.",
      },
    ],
  },
  categories: {
    title: "Categories",
    description: "Add, edit or hide the taxonomy every product and search filter is built on.",
    icon: Tags,
    blocks: [],
  },
  questions: {
    title: "Questions",
    description: "Default quote questions asked per category. Insurers add product-specific extras on top.",
    icon: ListChecks,
    blocks: [],
  },
  reports: {
    title: "Reports",
    description: "Platform-wide performance, compliance and finance reporting.",
    icon: FileText,
    actions: [{ label: "Export CSV", primary: true }, { label: "Date range: last 30 days" }],
    blocks: [
      {
        kind: "table",
        title: "Available reports",
        columns: ["Report", "Period", "Records", "Headline", "Last run"],
        rowActions: ["Run", "Export"],
        rows: [
          ["Marketplace GWP", "Last 30 days", "6,410", "RWF 12.8B", "01 Aug 2026"],
          ["Carrier league table", "Last 30 days", "24", "Aegis leads at 24%", "01 Aug 2026"],
          ["Claims SLA compliance", "Last 30 days", "1,284", "23 breaches", "01 Aug 2026"],
          ["Approval throughput", "Last 90 days", "48", "3.4 day median", "31 Jul 2026"],
        ],
        emptyTitle: "No reports available",
        emptyBody: "Reports generate from platform activity.",
      },
    ],
  },
  support: {
    title: "Support",
    description: "Tickets from customers, carriers and brokers — assigned, not pooled.",
    icon: LifeBuoy,
    actions: [{ label: "New ticket", primary: true }],
    stats: [
      { label: "Open tickets", value: "14", tone: "warning" },
      { label: "Unassigned", value: "3", tone: "danger" },
      { label: "Breaching SLA", value: "2", tone: "danger" },
      { label: "Median first reply", value: "48 min", tone: "success" },
    ],
    blocks: [
      {
        kind: "table",
        title: "Ticket queue",
        columns: ["Ref", "Subject", "Requester", "Assignee", "Age", "Status"],
        rowActions: ["Open", "Assign"],
        rows: [
          ["SUP-8852", "Carrier cannot publish product", "Solstice Cover", "Unassigned", "3h", bad("Unassigned")],
          ["SUP-8848", "Duplicate premium charge", "Bramley Dental", "Yves N.", "1d", warn("In progress")],
          ["SUP-8841", "Claim assessor visit date", "Clarisse Mutoni", "Grace M.", "2d", warn("Awaiting us")],
          ["SUP-8830", "Commission statement mismatch", "Kigali Risk Partners", "Yves N.", "4d", info("Awaiting requester")],
          ["SUP-8812", "KYC document rejected", "Jean-Paul Rugema", "Grace M.", "6d", ok("Resolved")],
        ],
        emptyTitle: "No open tickets",
        emptyBody: "New tickets are routed here and must be assigned within one hour.",
      },
    ],
  },
  settings: {
    title: "Platform settings",
    description: "System configuration, audit logs and taxonomy controls.",
    icon: Settings,
    actions: [{ label: "Save changes", primary: true }],
    blocks: [
      {
        kind: "note",
        title: "System configuration",
        points: [
          "Currency: RWF · locale rw-RW · timezone Africa/Kigali",
          "Platform fee: 2.0% of gross written premium",
          "Claims SLA: 14 days to decision, 5 days to payout",
          "Carrier approval requires licence verification + audited accounts",
        ],
        action: { label: "Edit configuration" },
      },
      {
        kind: "table",
        title: "Audit log",
        columns: ["Event", "Actor", "Target", "When"],
        rows: [
          ["Company approved", "Sandrine Keza", "Northwind Mutual", "31 Jul 2026 14:02"],
          ["Product rejected", "Sandrine Keza", "Pet lifetime plus", "30 Jul 2026 09:41"],
          ["Fee schedule updated", "System", "Platform fee 2.0%", "28 Jul 2026 18:20"],
          ["Broker suspended", "Yves Nkurunziza", "Horizon Advisory", "24 Jul 2026 11:07"],
        ],
        emptyTitle: "No audit events",
        emptyBody: "Every privileged action is recorded here.",
      },
      {
        kind: "note",
        title: "Categories & taxonomy",
        points: ["18 live categories · 2 hidden", "Category changes re-index marketplace search within 5 minutes"],
        action: { label: "Manage categories" },
      },
    ],
  },
};

/* -------------------------------- business ------------------------------- */

const businessPages: Record<string, ModulePage> = {
  portfolio: {
    title: "Insurance portfolio",
    description: "All cover held by Northgate Logistics.",
    icon: BadgeCheck,
    blocks: [
      {
        kind: "table",
        title: "Policies in force",
        columns: ["Policy", "Carrier", "Premium (yr)", "Renews", "Status"],
        rowActions: ["Open", "Renew"],
        rows: [
          ["Fleet motor — 42 vehicles", "Aegis Assurance", "RWF 84,000,000", "12 Dec 2026", ok("Active")],
          ["Cyber liability", "Northwind Mutual", "RWF 27,500,000", "30 Sep 2026", ok("Active")],
          ["Group health & dental", "Harborline Group", "RWF 62,000,000", "01 Feb 2027", ok("Active")],
          ["Employers' liability", "Aegis Assurance", "RWF 18,400,000", "01 Aug 2026", warn("Renewal due")],
        ],
        emptyTitle: "No cover yet",
        emptyBody: "Browse the marketplace to place your organisation's first policy.",
      },
    ],
  },
  messages: {
    title: "Messages",
    description: "Secure messages with your assigned broker.",
    icon: MessagesSquare,
    blocks: [],
  },
};

export const modulePages: Record<Role, Record<string, ModulePage>> = {
  customer: customerPages,
  insurer: insurerPages,
  broker: brokerPages,
  admin: adminPages,
  business: businessPages,
};

export function getModulePage(role: Role, slug: string): ModulePage | undefined {
  return modulePages[role]?.[slug];
}
