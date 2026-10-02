import {
  Activity,
  BadgeCheck,
  BarChart3,
  Blocks,
  Briefcase,
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  Files,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  MessagesSquare,
  Package,
  RefreshCw,
  ScrollText,
  Settings,
  ShieldCheck,
  Scale,
  Store,
  Tags,
  TrendingUp,
  Truck,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type Role = "customer" | "business" | "insurer" | "broker" | "admin";

export const roles: Role[] = ["customer", "business", "insurer", "broker", "admin"];

export function isRole(value: string): value is Role {
  return (roles as string[]).includes(value);
}

/** Dashboard home path for an account role (falls back to customer). */
export function dashboardFor(role: string | null | undefined): string {
  const safe: Role = isRole(role ?? "") ? (role as Role) : "customer";
  return `/dashboard/${safe}`;
}

/** Fine-grained permissions. Nav modules are gated on these. */
export type Permission =
  | "dashboard:view"
  | "marketplace:browse"
  | "marketplace:manage"
  | "compare:use"
  | "policies:view"
  | "policies:manage"
  | "portfolio:view"
  | "products:manage"
  | "quotes:view"
  | "claims:view"
  | "claims:manage"
  | "renewals:view"
  | "payments:view"
  | "finance:view"
  | "documents:view"
  | "support:view"
  | "support:manage"
  | "messages:view"
  | "profile:view"
  | "customers:view"
  | "employees:manage"
  | "assets:manage"
  | "commissions:view"
  | "reports:view"
  | "analytics:view"
  | "compliance:view"
  | "users:manage"
  | "organizations:manage"
  | "categories:manage"
  | "questions:manage"
  | "settings:manage"
  | "system:manage";

export const rolePermissions: Record<Role, Permission[]> = {
  customer: [
    "dashboard:view",
    "compare:use",
    "policies:view",
    "claims:view",
    "payments:view",
    "renewals:view",
    "documents:view",
    "support:view",
    "messages:view",
    "profile:view",
  ],
  business: [
    "dashboard:view",
    "portfolio:view",
    "marketplace:browse",
    "employees:manage",
    "assets:manage",
    "quotes:view",
    "claims:view",
    "payments:view",
    "reports:view",
    "documents:view",
    "settings:manage",
    "messages:view",
    "profile:view",
  ],
  insurer: [
    "dashboard:view",
    "products:manage",
    "customers:view",
    "policies:view",
    "policies:manage",
    "claims:view",
    "claims:manage",
    "reports:view",
    "payments:view",
    "settings:manage",
  ],
  broker: [
    "dashboard:view",
    "customers:view",
    "quotes:view",
    "policies:view",
    "renewals:view",
    "claims:view",
    "commissions:view",
    "reports:view",
    "messages:view",
    "settings:manage",
  ],
  admin: [
    "dashboard:view",
    "organizations:manage",
    "users:manage",
    "products:manage",
    "policies:manage",
    "claims:manage",
    "payments:view",
    "categories:manage",
    "questions:manage",
    "reports:view",
    "support:manage",
    "system:manage",
  ],
};

export function hasPermission(role: Role, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export type NavItem = {
  /** URL slug under /dashboard/{role}/… — "" means the role's dashboard root. */
  slug: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  badge?: number;
};

export type NavGroup = { label: string; items: NavItem[] };

export type RoleProfile = {
  role: Role;
  label: string;
  workspace: string;
  /** Shown in the logged-in header to make data scope explicit. */
  scope: string;
  notifications: number;
  groups: NavGroup[];
};

const overviewItem: NavItem = {
  slug: "",
  label: "Overview",
  icon: LayoutDashboard,
  permission: "dashboard:view",
};

const dashboardItem: NavItem = { ...overviewItem, label: "Dashboard" };

export const roleProfiles: Record<Role, RoleProfile> = {
  customer: {
    role: "customer",
    label: "Individual",
    workspace: "Personal cover",
    scope: "Your account",
    notifications: 3,
    groups: [
      {
        label: "Overview",
        items: [
          overviewItem,
          { slug: "policies", label: "My Policies", icon: ShieldCheck, permission: "policies:view" },
          { slug: "compare", label: "Compare", icon: Scale, permission: "compare:use" },
        ],
      },
      {
        label: "Cover",
        items: [
          { slug: "claims", label: "Claims", icon: LifeBuoy, permission: "claims:view", badge: 1 },
          { slug: "payments", label: "Payments", icon: CreditCard, permission: "payments:view" },
          { slug: "renewals", label: "Renewals", icon: RefreshCw, permission: "renewals:view", badge: 2 },
        ],
      },
      {
        label: "Account",
        items: [
          { slug: "messages", label: "Messages", icon: MessagesSquare, permission: "messages:view" },
          { slug: "profile", label: "Profile", icon: UserRound, permission: "profile:view" },
          { slug: "support", label: "Support", icon: LifeBuoy, permission: "support:view" },
        ],
      },
    ],
  },
  insurer: {
    role: "insurer",
    label: "Insurance provider",
    workspace: "Aegis Assurance",
    scope: "Your company data only",
    notifications: 8,
    groups: [
      { label: "Overview", items: [overviewItem] },
      {
        label: "Distribution",
        items: [
          { slug: "products", label: "Products", icon: Package, permission: "products:manage" },
          { slug: "customers", label: "Customers", icon: Users, permission: "customers:view" },
          { slug: "policies", label: "Policies", icon: ScrollText, permission: "policies:manage" },
        ],
      },
      {
        label: "Operations",
        items: [
          { slug: "claims", label: "Claims", icon: LifeBuoy, permission: "claims:manage", badge: 5 },
          { slug: "reports", label: "Reports", icon: FileText, permission: "reports:view" },
          { slug: "payments", label: "Payments", icon: CreditCard, permission: "payments:view" },
          { slug: "settings", label: "Settings", icon: Settings, permission: "settings:manage" },
        ],
      },
    ],
  },
  broker: {
    role: "broker",
    label: "Broker / agent",
    workspace: "Kigali Risk Partners",
    scope: "Your assigned book",
    notifications: 5,
    groups: [
      {
        label: "Overview",
        items: [
          dashboardItem,
          { slug: "customers", label: "My Customers", icon: Users, permission: "customers:view" },
          { slug: "quotes", label: "Quotes", icon: ClipboardList, permission: "quotes:view", badge: 7 },
        ],
      },
      {
        label: "Book",
        items: [
          { slug: "policies", label: "Policies", icon: ScrollText, permission: "policies:view" },
          { slug: "renewals", label: "Renewals", icon: RefreshCw, permission: "renewals:view", badge: 4 },
          { slug: "claims", label: "Claims", icon: LifeBuoy, permission: "claims:view" },
        ],
      },
      {
        label: "Engagement",
        items: [
          { slug: "messages", label: "Messages", icon: MessagesSquare, permission: "messages:view" },
        ],
      },
      {
        label: "Earnings",
        items: [
          { slug: "commissions", label: "Commissions", icon: Wallet, permission: "commissions:view" },
          { slug: "reports", label: "Reports", icon: FileText, permission: "reports:view" },
          { slug: "settings", label: "Settings", icon: Settings, permission: "settings:manage" },
        ],
      },
    ],
  },
  business: {
    role: "business",
    label: "Business customer",
    workspace: "Northgate Logistics",
    scope: "Your organisation",
    notifications: 4,
    groups: [
      {
        label: "Overview",
        items: [
          overviewItem,
          { slug: "portfolio", label: "Insurance Portfolio", icon: Briefcase, permission: "portfolio:view" },
          { slug: "marketplace", label: "Marketplace", icon: Store, permission: "marketplace:browse" },
        ],
      },
      {
        label: "Organisation",
        items: [
          { slug: "employees", label: "Employees", icon: Users, permission: "employees:manage" },
          { slug: "assets", label: "Assets", icon: Truck, permission: "assets:manage" },
          { slug: "quotes", label: "Quotes", icon: ClipboardList, permission: "quotes:view", badge: 3 },
          { slug: "claims", label: "Claims", icon: LifeBuoy, permission: "claims:view" },
        ],
      },
      {
        label: "Advisers",
        items: [
          { slug: "messages", label: "Messages", icon: MessagesSquare, permission: "messages:view" },
        ],
      },
      {
        label: "Finance",
        items: [
          { slug: "payments", label: "Payments", icon: CreditCard, permission: "payments:view" },
          { slug: "documents", label: "Documents", icon: Files, permission: "documents:view" },
          { slug: "reports", label: "Reports", icon: FileText, permission: "reports:view" },
          { slug: "settings", label: "Settings", icon: Settings, permission: "settings:manage" },
        ],
      },
    ],
  },
  admin: {
    role: "admin",
    label: "Platform admin",
    workspace: "InsureHub platform",
    scope: "Platform-wide",
    notifications: 12,
    groups: [
      {
        label: "Approvals",
        items: [
          dashboardItem,
          { slug: "companies", label: "Insurance Companies", icon: Building2, permission: "organizations:manage", badge: 7 },
          { slug: "brokers", label: "Brokers", icon: Briefcase, permission: "organizations:manage", badge: 5 },
        ],
      },
      {
        label: "Marketplace",
        items: [
          { slug: "customers", label: "Customers", icon: Users, permission: "users:manage" },
          { slug: "products", label: "Products", icon: Package, permission: "products:manage" },
          { slug: "policies", label: "Policies", icon: ScrollText, permission: "policies:manage" },
          { slug: "claims", label: "Claims", icon: LifeBuoy, permission: "claims:manage", badge: 9 },
          { slug: "categories", label: "Categories", icon: Tags, permission: "categories:manage" },
          { slug: "questions", label: "Questions", icon: ListChecks, permission: "questions:manage" },
        ],
      },
      {
        label: "Platform",
        items: [
          { slug: "payments", label: "Payments", icon: CreditCard, permission: "payments:view" },
          { slug: "reports", label: "Reports", icon: BarChart3, permission: "reports:view" },
          { slug: "support", label: "Support", icon: LifeBuoy, permission: "support:manage", badge: 14 },
          { slug: "settings", label: "Platform Settings", icon: Blocks, permission: "system:manage" },
        ],
      },
    ],
  },
};

/** Nav groups filtered down to what the role is actually permitted to see. */
export function visibleGroups(role: Role): NavGroup[] {
  return roleProfiles[role].groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(role, item.permission)),
    }))
    .filter((group) => group.items.length > 0);
}

export function findModule(role: Role, slug: string): NavItem | undefined {
  return roleProfiles[role].groups
    .flatMap((g) => g.items)
    .find((item) => item.slug === slug && hasPermission(role, item.permission));
}

export const moduleIcons = { Gauge, Activity, Settings, BadgeCheck, TrendingUp };
