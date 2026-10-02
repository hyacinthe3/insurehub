import { Briefcase, Building2, LayoutDashboard, ShieldCheck, Users } from "lucide-react";

import type { Role } from "@/lib/rbac";
import type { ModulePage } from "@/lib/workspace-data";

/** The role's landing page: real numbers, quick actions, then the work itself. */
export const overviewPages: Record<Role, ModulePage> = {
  customer: {
    title: "You're covered",
    description: "Four policies in force. One claim in progress. Nothing lapses without us telling you.",
    icon: ShieldCheck,
    actions: [
      { label: "Buy insurance", to: "/browse", primary: true },
      { label: "Get a quote", to: "/compare" },
      { label: "Submit claim" },
      { label: "Renew policy" },
    ],
    stats: [
      { label: "Active policies", value: "3", tone: "success" },
      { label: "Pending claims", value: "1", tone: "warning" },
      { label: "Expiring in 60 days", value: "2", tone: "warning" },
      { label: "Outstanding payments", value: "RWF 148,000", tone: "danger" },
    ],
    blocks: [
      {
        kind: "table",
        title: "Needs your attention",
        columns: ["Item", "Policy", "Amount", "Status"],
        rowActions: ["Open"],
        rows: [
          ["Travel cover payment due", "Travel — worldwide", "RWF 148,000", { pill: "Pay now", tone: "danger" }],
          ["Travel policy renews 21 Aug", "Travel — worldwide", "RWF 148,000", { pill: "Renew", tone: "warning" }],
          ["Claim #48210 under review", "Comprehensive motor", "RWF 340,000", { pill: "Under review", tone: "warning" }],
        ],
        emptyTitle: "Nothing needs you right now",
        emptyBody: "Payments, renewals and claim updates show up here first.",
      },
      {
        kind: "table",
        title: "Your active cover",
        columns: ["Policy", "Provider", "Premium", "Renews", "Status"],
        rowActions: ["View", "Submit claim"],
        rows: [
          ["Comprehensive motor", "Aegis Assurance", "RWF 780,000 / yr", "14 Sep 2026", { pill: "Active", tone: "success" }],
          ["Home & contents", "Harborline Group", "RWF 410,000 / yr", "02 Nov 2026", { pill: "Active", tone: "success" }],
          ["Private health", "Vantage Underwriters", "RWF 960,000 / yr", "30 Jan 2027", { pill: "Active", tone: "success" }],
        ],
        emptyTitle: "No active policies yet",
        emptyBody: "Compare cover in the marketplace — you can be insured in a few minutes.",
      },
    ],
  },
  insurer: {
    title: "Aegis Assurance — operations",
    description: "Live performance for your own book only. No other carrier's data is visible here.",
    icon: Building2,
    actions: [{ label: "New product", primary: true }, { label: "Export report" }],
    stats: [
      { label: "Total policies", value: "18,204" },
      { label: "Active policies", value: "15,543", tone: "success" },
      { label: "Premium revenue (30d)", value: "RWF 3.1B" },
      { label: "Pending claims", value: "37", tone: "warning" },
    ],
    blocks: [
      {
        kind: "table",
        title: "Renewals due (next 30 days)",
        description: "1,208 policies · RWF 1.4B premium at risk",
        columns: ["Policy no.", "Customer", "Product", "Premium", "Expires"],
        rowActions: ["Re-quote"],
        rows: [
          ["AEG-PRP-29001", "Rowan Estates", "Landlord buildings", "RWF 5,200,000", "18 Aug 2026"],
          ["AEG-LIA-77120", "Northgate Logistics", "Employers' liability", "RWF 18,400,000", "01 Aug 2026"],
          ["AEG-MTR-40912", "Clarisse Mutoni", "Comprehensive motor", "RWF 780,000", "14 Sep 2026"],
        ],
        emptyTitle: "No renewals due",
        emptyBody: "Expiring policies surface here 60 days ahead.",
      },
      {
        kind: "table",
        title: "Claims needing a decision",
        columns: ["Claim", "Policy", "Customer", "Amount", "Status"],
        rowActions: ["Approve", "Reject", "Request info"],
        rows: [
          ["CLM-90211", "AEG-FLT-11204", "Northgate Logistics", "RWF 14,200,000", { pill: "SLA breach", tone: "danger" }],
          ["CLM-90188", "AEG-MTR-40912", "Clarisse Mutoni", "RWF 340,000", { pill: "Under review", tone: "warning" }],
          ["CLM-90204", "AEG-HLT-30877", "Bramley Dental", "RWF 2,050,000", { pill: "New", tone: "info" }],
        ],
        emptyTitle: "Claims queue is clear",
        emptyBody: "New submissions appear here the moment a customer files.",
      },
    ],
  },
  broker: {
    title: "Kigali Risk Partners",
    description: "Your book only — 128 clients connected to this agency.",
    icon: Briefcase,
    actions: [{ label: "New quote", primary: true }, { label: "Add customer" }],
    stats: [
      { label: "Draft quotes", value: "9" },
      { label: "Sent this month", value: "34", delta: "+8 vs June" },
      { label: "Expiring soon", value: "6", tone: "warning" },
      { label: "Commissions pending", value: "RWF 18,900,000", tone: "warning" },
    ],
    blocks: [
      {
        kind: "table",
        title: "Quotes in play",
        columns: ["Customer", "Product", "Premium", "Status", "Date"],
        rowActions: ["Open", "Send"],
        rows: [
          ["Northgate Logistics", "Fleet motor — 42 vehicles", "RWF 84,000,000", { pill: "Awaiting client", tone: "warning" }, "28 Jul 2026"],
          ["Bramley Dental", "Practice cover", "RWF 10,700,000", { pill: "Sent", tone: "info" }, "26 Jul 2026"],
          ["Rowan Estates", "Landlord buildings", "RWF 5,200,000", { pill: "Draft", tone: "neutral" }, "19 Jul 2026"],
        ],
        emptyTitle: "No quotes yet",
        emptyBody: "Start a quote for a client — it takes about two minutes.",
      },
      {
        kind: "table",
        title: "Renewals in the next 60 days",
        columns: ["Client", "Policy", "Expires", "Premium", "Status"],
        rowActions: ["Re-quote", "Remind client"],
        rows: [
          ["Rowan Estates", "Landlord buildings", "18 Aug 2026", "RWF 5,200,000", { pill: "Due in 16 days", tone: "warning" }],
          ["Helix Labs", "Cyber liability", "30 Sep 2026", "RWF 27,500,000", { pill: "Due in 59 days", tone: "info" }],
        ],
        emptyTitle: "No renewals due",
        emptyBody: "Your clients' expiries land here 90 days ahead.",
      },
    ],
  },
  admin: {
    title: "Platform health",
    description: "Cross-tenant view. Approvals gate everyone else's access, so start there.",
    icon: LayoutDashboard,
    actions: [
      { label: "Review approvals", to: "/dashboard/admin/companies", primary: true },
      { label: "Open support queue", to: "/dashboard/admin/support" },
    ],
    stats: [
      { label: "Pending approvals", value: "12", tone: "danger" },
      { label: "Active companies", value: "24", tone: "success" },
      { label: "Active brokers", value: "63", tone: "success" },
      { label: "Flagged claims", value: "9", tone: "warning" },
    ],
    blocks: [
      {
        kind: "queue",
        title: "Approvals — action required",
        description: "Platform-wide · applicants are blocked until you decide",
        actions: ["Approve", "Reject", "Request info"],
        items: [
          {
            title: "Solstice Cover Ltd — insurance company",
            meta: "Applied 29 Jul 2026 · licence AS-0311",
            detail: "Licence, audited accounts and 3 product drafts submitted.",
            status: "Pending 4 days",
            tone: "warning",
          },
          {
            title: "Vantage Underwriters — insurance company",
            meta: "Applied 21 Jul 2026 · licence AS-0276",
            detail: "Compliance cleared; awaiting final sign-off.",
            status: "Pending 12 days",
            tone: "danger",
          },
          {
            title: "Umurava Brokers Ltd — broker",
            meta: "Applied 27 Jul 2026 · licence BR-0341",
            detail: "Professional indemnity certificate uploaded.",
            status: "Pending 6 days",
            tone: "warning",
          },
        ],
        emptyTitle: "Approval queue is clear",
        emptyBody: "New company and broker applications land here immediately.",
      },
      {
        kind: "table",
        title: "Support tickets open",
        columns: ["Ref", "Subject", "Requester", "Assignee", "Status"],
        rowActions: ["Open", "Assign"],
        rows: [
          ["SUP-8852", "Carrier cannot publish product", "Solstice Cover", "Unassigned", { pill: "Unassigned", tone: "danger" }],
          ["SUP-8848", "Duplicate premium charge", "Bramley Dental", "Yves N.", { pill: "In progress", tone: "warning" }],
          ["SUP-8841", "Claim assessor visit date", "Clarisse Mutoni", "Grace M.", { pill: "Awaiting us", tone: "warning" }],
        ],
        emptyTitle: "No open tickets",
        emptyBody: "Tickets from customers, carriers and brokers appear here.",
      },
    ],
  },
  business: {
    title: "Northgate Logistics cover",
    description: "Company-wide insurance, employees and assets in one view.",
    icon: Users,
    actions: [{ label: "Browse cover", to: "/browse", primary: true }, { label: "Get a quote", to: "/compare" }],
    stats: [
      { label: "Policies in force", value: "17", tone: "success" },
      { label: "Annual spend", value: "RWF 241,000,000", delta: "−4.2% after re-tender" },
      { label: "Covered employees", value: "312" },
      { label: "Open claims", value: "3", tone: "warning" },
    ],
    blocks: [
      {
        kind: "table",
        title: "Cover in force",
        columns: ["Policy", "Carrier", "Premium (yr)", "Renews", "Status"],
        rowActions: ["Open", "Renew"],
        rows: [
          ["Fleet motor — 42 vehicles", "Aegis Assurance", "RWF 84,000,000", "12 Dec 2026", { pill: "Active", tone: "success" }],
          ["Cyber liability", "Northwind Mutual", "RWF 27,500,000", "30 Sep 2026", { pill: "Active", tone: "success" }],
          ["Employers' liability", "Aegis Assurance", "RWF 18,400,000", "01 Aug 2026", { pill: "Renewal due", tone: "warning" }],
        ],
        emptyTitle: "No cover yet",
        emptyBody: "Place your organisation's first policy from the marketplace.",
      },
    ],
  },
};
