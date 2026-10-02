import { Briefcase, Building2, ShieldCheck, User, Shield, type LucideIcon } from "lucide-react";

import type { Role } from "@/lib/rbac";

export type DashboardStat = { label: string; value: string; delta?: string };
export type DashboardItem = { title: string; meta: string; status: string };

export type RoleDashboard = {
  role: string;
  name: string;
  icon: LucideIcon;
  stats: DashboardStat[];
  itemsTitle: string;
  items: DashboardItem[];
  seo: { title: string; description: string };
};

export const roleDashboards: Record<Role, RoleDashboard> = {
  customer: {
    role: "Individual",
    name: "Your policy dashboard",
    icon: User,
    stats: [
      { label: "Active policies", value: "4" },
      { label: "Annual premium", value: "RWF 2,410,000", delta: "−8% vs last year" },
      { label: "Open claims", value: "1" },
      { label: "Renewals in 60 days", value: "2" },
    ],
    itemsTitle: "Your policies",
    items: [
      { title: "Comprehensive motor cover", meta: "Aegis Assurance · renews 14 Sep 2026", status: "Active" },
      { title: "Home & contents", meta: "Harborline Group · renews 02 Nov 2026", status: "Active" },
      { title: "Travel — worldwide", meta: "Meridian Insurance · renews 21 Aug 2026", status: "Renewal due" },
      { title: "Private health", meta: "Vantage Underwriters · claim #48210", status: "Claim open" },
    ],
    seo: {
      title: "Customer dashboard — InsureHub",
      description: "Track your personal policies, renewals and claims, priced in RWF.",
    },
  },
  business: {
    role: "Business",
    name: "Company cover overview",
    icon: Building2,
    stats: [
      { label: "Policies in force", value: "17" },
      { label: "Annual spend", value: "RWF 241,000,000", delta: "−4.2% after re-tender" },
      { label: "Covered employees", value: "312" },
      { label: "Open claims", value: "3" },
    ],
    itemsTitle: "Company policies",
    items: [
      { title: "Cyber liability — RWF 5B", meta: "Northwind Mutual · renews 30 Sep 2026", status: "Active" },
      { title: "Fleet motor — 42 vehicles", meta: "Solstice Cover · renews 12 Dec 2026", status: "Active" },
      { title: "Employers' liability", meta: "Aegis Assurance · renews 01 Aug 2026", status: "Renewal due" },
      { title: "Group health & dental", meta: "Harborline Group · 312 members", status: "Active" },
    ],
    seo: {
      title: "Business dashboard — InsureHub",
      description: "Manage company cover, fleet policies and employee benefits in RWF.",
    },
  },
  insurer: {
    role: "Insurance company",
    name: "Carrier performance",
    icon: ShieldCheck,
    stats: [
      { label: "Live products", value: "23" },
      { label: "Quotes (30d)", value: "48,912", delta: "+11.4% MoM" },
      { label: "Conversion", value: "6.8%", delta: "+0.6 pts" },
      { label: "GWP (30d)", value: "RWF 3.1B" },
    ],
    itemsTitle: "Product pipeline",
    items: [
      { title: "Comprehensive motor 2026", meta: "Pricing v4 · 12,402 quotes", status: "Live" },
      { title: "Cyber SME essentials", meta: "Pricing v2 · 3,180 quotes", status: "Live" },
      { title: "Landlord buildings", meta: "Submitted 22 Jul 2026", status: "In review" },
      { title: "Pet lifetime plus", meta: "Draft pricing model", status: "Draft" },
    ],
    seo: {
      title: "Insurer dashboard — InsureHub",
      description: "Monitor product performance, quote volume and conversion across the marketplace.",
    },
  },
  broker: {
    role: "Broker",
    name: "Client book overview",
    icon: Briefcase,
    stats: [
      { label: "Active clients", value: "128" },
      { label: "Placements (30d)", value: "41", delta: "+9 vs last month" },
      { label: "Commission (30d)", value: "RWF 50,400,000", delta: "+6.1%" },
      { label: "Renewals in 30 days", value: "17" },
    ],
    itemsTitle: "Placement pipeline",
    items: [
      { title: "Northgate Logistics — fleet", meta: "RWF 84m premium · 3 quotes", status: "Awaiting client" },
      { title: "Bramley Dental — practice cover", meta: "RWF 10.7m premium · 5 quotes", status: "Quoted" },
      { title: "Helix Labs — cyber", meta: "RWF 27.5m premium · bound", status: "Placed" },
      { title: "Rowan Estates — landlord", meta: "Renewal 18 Aug 2026", status: "Renewal due" },
    ],
    seo: {
      title: "Broker dashboard — InsureHub",
      description: "Track client placements, commission and renewals in RWF.",
    },
  },
  admin: {
    role: "Platform admin",
    name: "Platform control centre",
    icon: Shield,
    stats: [
      { label: "Active users", value: "38,204", delta: "+2.1% WoW" },
      { label: "Organizations", value: "426" },
      { label: "GWP (30d)", value: "RWF 12.8B", delta: "+7.4%" },
      { label: "Open escalations", value: "9" },
    ],
    itemsTitle: "Needs attention",
    items: [
      { title: "12 provider accounts awaiting verification", meta: "Compliance queue", status: "Action needed" },
      { title: "Marketplace listing review — 8 products", meta: "Submitted this week", status: "In review" },
      { title: "Claims SLA breach — Solstice Cover", meta: "3 claims over 14 days", status: "Escalated" },
      { title: "Monthly settlement run", meta: "Scheduled 01 Aug 2026", status: "Scheduled" },
    ],
    seo: {
      title: "Platform admin dashboard — InsureHub",
      description: "Oversee users, organizations, marketplace listings, finance and compliance.",
    },
  },
};
