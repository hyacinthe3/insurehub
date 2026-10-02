import type { DraftQuote, IssuedPolicy, PremiumBreakdown } from "./quote-flow";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? "GET",
      // Send/store the httpOnly session cookie the backend sets on
      // register, login and MFA verification.
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
      body: init.body,
    });
  } catch {
    throw new ApiError(
      0,
      "Could not reach the InsureHub service. Check that the backend is running on localhost:4000 and try again.",
    );
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    throw new ApiError(res.status, typeof message === "string" ? message : `Request failed (${res.status})`);
  }
  return data as T;
}

/* ---------------------------------------------------------------- */
/* Quote drafts                                                      */
/* ---------------------------------------------------------------- */

export function listDrafts(): Promise<DraftQuote[]> {
  return request<DraftQuote[]>("/quotes");
}

export function getDraft(id: string): Promise<DraftQuote> {
  return request<DraftQuote>(`/quotes/${id}`);
}

export function createDraft(planId: string): Promise<DraftQuote> {
  return request<DraftQuote>("/quotes", {
    method: "POST",
    body: JSON.stringify({ planId }),
  });
}

export function saveDraft(draft: DraftQuote): Promise<DraftQuote> {
  return request<DraftQuote>(`/quotes/${draft.id}`, {
    method: "PUT",
    body: JSON.stringify(draft),
  });
}

export function deleteDraft(id: string): Promise<void> {
  return request<void>(`/quotes/${id}`, { method: "DELETE" });
}

/* ---------------------------------------------------------------- */
/* Pricing                                                           */
/* ---------------------------------------------------------------- */

export function calculatePremium(
  planId: string,
  answers: Record<string, string>,
): Promise<PremiumBreakdown> {
  return request<PremiumBreakdown>("/pricing/calculate", {
    method: "POST",
    body: JSON.stringify({ planId, answers }),
  });
}

/* ---------------------------------------------------------------- */
/* Issued policies                                                   */
/* ---------------------------------------------------------------- */

export function listPolicies(): Promise<IssuedPolicy[]> {
  return request<IssuedPolicy[]>("/policies");
}

export function getPolicy(id: string): Promise<IssuedPolicy> {
  return request<IssuedPolicy>(`/policies/${id}`);
}

/* ---------------------------------------------------------------- */
/* Simulated payment gateway                                         */
/* ---------------------------------------------------------------- */

export type PaymentStatus = "pending" | "confirmed" | "failed" | "invalid";

export type ChargeInput = {
  quoteId: string;
  amount: number;
  method: "momo" | "card";
  account: string;
};

export function createGatewayCharge(input: {
  data: ChargeInput;
}): Promise<{ reference: string; status: "pending"; last4: string }> {
  return request("/payments/charge", {
    method: "POST",
    body: JSON.stringify(input.data),
  });
}

export function getPaymentStatus(input: {
  data: { reference: string };
}): Promise<{ status: PaymentStatus; amount: number; reason?: string }> {
  return request("/payments/status", {
    method: "POST",
    body: JSON.stringify(input.data),
  });
}

export function issuePolicy(input: {
  data: { reference: string; planCode: string };
}): Promise<IssuedPolicy> {
  return request<IssuedPolicy>("/payments/issue", {
    method: "POST",
    body: JSON.stringify(input.data),
  });
}

/* ---------------------------------------------------------------- */
/* Auth: registration, login, MFA and sessions                       */
/* ---------------------------------------------------------------- */

export type Role = "customer" | "business" | "insurer" | "broker" | "admin";

export type AccountUser = {
  id: string;
  role: Role;
  accountType: string;
  fullName: string | null;
  companyName: string | null;
  email: string;
  phone: string | null;
  tin: string | null;
  mfaEnabled: boolean;
  mfaSettingEnabled: boolean;
};

export type SessionState = {
  authenticated: boolean;
  mfaPending: boolean;
  user: AccountUser | null;
};

export type MfaSetup = {
  otpauthUrl: string;
  qrDataUrl: string;
  secret: string;
};

export function registerAccount(input: {
  accountType: "individual" | "business" | "insurer" | "broker";
  fullName?: string;
  companyName?: string;
  email: string;
  phone: string;
  tin?: string;
  password: string;
}): Promise<{ user: AccountUser }> {
  return request("/auth/register", { method: "POST", body: JSON.stringify(input) });
}

export function loginWithPassword(input: {
  email: string;
  password: string;
  remember: boolean;
}): Promise<{ mfaRequired: boolean; user: AccountUser }> {
  return request("/auth/login", { method: "POST", body: JSON.stringify(input) });
}

export function getMfaSetup(): Promise<MfaSetup> {
  return request<MfaSetup>("/auth/mfa/setup");
}

export function verifyMfaCode(code: string): Promise<{
  user: AccountUser;
  activated: boolean;
}> {
  return request("/auth/mfa/verify", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function setMfaEnabled(enabled: boolean): Promise<{ user: AccountUser }> {
  return request("/auth/mfa", {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
}

export function getSessionState(): Promise<SessionState> {
  return request<SessionState>("/auth/session");
}

export function logout(): Promise<void> {
  return request<void>("/auth/logout", { method: "POST" });
}

/* POST /auth/forgot-password — request a password-reset email.  Always
   returns the same message regardless of whether the account exists. */
export function forgotPassword(email: string): Promise<{ message: string }> {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/* POST /auth/set-password — consume an emailed invitation or password-reset
   token, set the password and receive a pending session (MFA setup is the
   next step).  For reset tokens, MFA is also cleared. */
export function setPasswordWithToken(input: {
  token: string;
  password: string;
}): Promise<{ user: AccountUser }> {
  return request("/auth/set-password", { method: "POST", body: JSON.stringify(input) });
}

/* PATCH /auth/profile — update the signed-in user's own details. */
export function updateProfile(input: {
  fullName?: string;
  companyName?: string;
  phone: string;
  tin?: string;
}): Promise<{ user: AccountUser }> {
  return request("/auth/profile", { method: "PATCH", body: JSON.stringify(input) });
}

/* POST /auth/change-password — verifies the current password, stores the new
   one and revokes every session (the user is signed out everywhere). */
export function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: boolean }> {
  return request("/auth/change-password", { method: "POST", body: JSON.stringify(input) });
}

export type AdminOverviewTotals = {
  users: number;
  customers: number;
  businesses: number;
  insurers: number;
  brokers: number;
  admins: number;
  policies: number;
  activePolicies: number;
  premiumTotal: number;
  providers: number;
  products: number;
  categories: number;
  pendingApplications: number;
};

export type AdminRecentPolicy = {
  id: string;
  policyNumber: string;
  planName: string;
  provider: string;
  category: string;
  holderName: string;
  premium: number;
  paidAt: string;
  endDate: string;
  active: boolean;
};

export type AdminOverview = {
  totals: AdminOverviewTotals;
  recentPolicies: AdminRecentPolicy[];
  monthlyPolicyCounts: { month: string; count: number; premium: number }[];
  premiumByCategory: { category: string; total: number }[];
};

export type AdminCompany = {
  slug: string;
  name: string;
  tagline: string;
  rating: number;
  headquarters: string;
  license: string;
  claimsPaidRate: string;
  branches: number;
  productCount: number;
  policyCount: number;
  status: "active" | "deactivated";
  deactivatedAt: string | null;
};

export type AdminBroker = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
  policyCount: number;
  since: string;
};

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  type: string;
  active: boolean;
  policyCount: number;
  since: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  provider: string;
  providerId: string;
  category: string;
  categorySlug: string;
  monthly: number;
  policyCount: number;
  providerStatus: string;
  status: ProductStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  reviewerName: string | null;
  publishedAt: string | null;
};

export type AdminProductDetail = AdminProduct & {
  description: string;
  coverAmount: number;
  excessAmount: number;
  claimDays: string;
  claimSpeed: number;
  customerTypes: string[];
  payments: string[];
  badge: string | null;
  highlights: string[];
  features: Record<string, unknown>;
  purchaseMethod: ProductPurchaseMethod;
  coverageDetails: Record<string, unknown> | null;
  benefits: string[];
  exclusions: string[];
  requiredDocuments: string[];
  eligibility: string | null;
  policyDuration: string | null;
  deductible: number | null;
  providerEmail: string | null;
};

export type AdminPolicy = {
  id: string;
  policyNumber: string;
  planName: string;
  provider: string;
  category: string;
  holderName: string;
  holderEmail: string;
  premium: number;
  paidAt: string;
  startDate: string;
  endDate: string;
  active: boolean;
};

export type AdminClaim = {
  id: string;
  reference: string;
  policyNumber: string;
  planName: string;
  provider: string;
  holderName: string;
  status: string;
  description: string;
  amount: number;
  createdAt: string;
};

export type AdminCategory = {
  slug: string;
  name: string;
  blurb: string;
  from: string;
  active: boolean;
  productCount: number;
  policyCount: number;
  quoteCount: number;
};

export type CompanyApplicationStatus = "pending" | "approved" | "rejected";

export type CompanyApplication = {
  id: string;
  companyName: string;
  email: string;
  phone: string | null;
  tin: string | null;
  license: string | null;
  tagline: string | null;
  about: string | null;
  headquarters: string | null;
  founded: number | null;
  documents: string[];
  status: CompanyApplicationStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  reviewerName: string | null;
  createdAt: string;
  updatedAt: string;
};

/* GET /admin/overview — platform-wide numbers for the admin dashboard. */
export function getAdminOverview(): Promise<AdminOverview> {
  return request("/admin/overview");
}

/* GET /admin/companies — every insurance company with live counts. */
export function getAdminCompanies(): Promise<AdminCompany[]> {
  return request("/admin/companies");
}

/* GET /admin/brokers — every broker account platform-wide. */
export function getAdminBrokers(): Promise<AdminBroker[]> {
  return request("/admin/brokers");
}

/* GET /admin/customers — every customer and business account platform-wide. */
export function getAdminCustomers(): Promise<AdminCustomer[]> {
  return request("/admin/customers");
}

/* GET /admin/products — every marketplace product across all carriers. */
export function getAdminProducts(params?: {
  status?: string;
  providerId?: string;
  categorySlug?: string;
  search?: string;
}): Promise<AdminProduct[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.providerId) query.set("providerId", params.providerId);
  if (params?.categorySlug) query.set("categorySlug", params.categorySlug);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return request(`/admin/products${qs ? `?${qs}` : ""}`);
}

/* GET /admin/products/:id — full detail for a product under review. */
export function getAdminProduct(id: string): Promise<AdminProductDetail> {
  return request(`/admin/products/${id}`);
}

/* POST /admin/products/:id/approve — approve a submitted product. */
export function approveAdminProduct(id: string): Promise<{ ok: boolean }> {
  return request(`/admin/products/${id}/approve`, { method: "POST" });
}

/* POST /admin/products/:id/reject — reject with a mandatory reason. */
export function rejectAdminProduct(id: string, reason: string): Promise<{ ok: boolean }> {
  return request(`/admin/products/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
}

/* POST /admin/products/:id/publish — publish an approved product to the marketplace. */
export function publishAdminProduct(id: string): Promise<{ ok: boolean }> {
  return request(`/admin/products/${id}/publish`, { method: "POST" });
}

/* GET /admin/policies — every policy across the platform. */
export function getAdminPolicies(): Promise<AdminPolicy[]> {
  return request("/admin/policies");
}

/* GET /admin/claims — every claim across the platform. */
export function getAdminClaims(): Promise<AdminClaim[]> {
  return request("/admin/claims");
}

/* GET /admin/categories — every marketplace category with live counts. */
export function getAdminCategories(): Promise<AdminCategory[]> {
  return request("/admin/categories");
}

/* POST /admin/categories — create a new marketplace category. */
export function createAdminCategory(data: {
  slug: string;
  name: string;
  blurb?: string;
  from?: string;
}): Promise<AdminCategory> {
  return request("/admin/categories", { method: "POST", body: JSON.stringify(data) });
}

/* PATCH /admin/categories/:slug — update a category's details. */
export function updateAdminCategory(
  slug: string,
  data: { name?: string; blurb?: string; from?: string },
): Promise<AdminCategory> {
  return request(`/admin/categories/${slug}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/* PATCH /admin/categories/:slug/status — hide or show a category. */
export function setAdminCategoryStatus(slug: string, active: boolean): Promise<AdminCategory> {
  return request(`/admin/categories/${slug}/status`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

/* DELETE /admin/categories/:slug — delete an empty category. */
export function deleteAdminCategory(slug: string): Promise<{ deleted: string }> {
  return request(`/admin/categories/${slug}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/* Quote questions (admin category defaults, insurer product extras)   */
/* ------------------------------------------------------------------ */

export type QuoteQuestionType = "text" | "number" | "select" | "date";

export type QuestionValidation = {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};

export type QuoteQuestion = {
  id: string;
  key: string;
  categorySlug: string;
  productId: string | null;
  label: string;
  type: QuoteQuestionType;
  options: string[];
  required: boolean;
  help: string | null;
  placeholder: string | null;
  validation: QuestionValidation | null;
  active: boolean;
  position: number;
  system: boolean;
};

export type QuestionInput = {
  key?: string;
  label?: string;
  type?: QuoteQuestionType;
  options?: string[];
  required?: boolean;
  help?: string | null;
  placeholder?: string | null;
  validation?: QuestionValidation | null;
};

export type AdminCategoryQuestions = {
  category: { slug: string; name: string; blurb: string };
  questions: QuoteQuestion[];
};

/* GET /admin/categories/:slug/questions — a category's default questions. */
export function getAdminCategoryQuestions(slug: string): Promise<AdminCategoryQuestions> {
  return request(`/admin/categories/${slug}/questions`);
}

/* GET /admin/categories/:slug/questions/preview — active questions customers see. */
export function previewAdminCategoryQuestions(slug: string): Promise<QuoteQuestion[]> {
  return request(`/admin/categories/${slug}/questions/preview`);
}

/* POST /admin/categories/:slug/questions — create a default category question. */
export function createAdminQuestion(slug: string, data: QuestionInput): Promise<QuoteQuestion> {
  return request(`/admin/categories/${slug}/questions`, { method: "POST", body: JSON.stringify(data) });
}

/* PATCH /admin/categories/:slug/questions/:id — update a category question. */
export function updateAdminQuestion(
  slug: string,
  questionId: string,
  data: QuestionInput,
): Promise<QuoteQuestion> {
  return request(`/admin/categories/${slug}/questions/${questionId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/* PATCH /admin/categories/:slug/questions/:id/status — activate/deactivate. */
export function setAdminQuestionActive(
  slug: string,
  questionId: string,
  active: boolean,
): Promise<QuoteQuestion> {
  return request(`/admin/categories/${slug}/questions/${questionId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

/* POST /admin/categories/:slug/questions/reorder — ids in display order. */
export function reorderAdminQuestions(slug: string, ids: string[]): Promise<{ reordered: boolean }> {
  return request(`/admin/categories/${slug}/questions/reorder`, {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

/* DELETE /admin/categories/:slug/questions/:id — delete a category question. */
export function deleteAdminQuestion(slug: string, questionId: string): Promise<{ deleted: boolean }> {
  return request(`/admin/categories/${slug}/questions/${questionId}`, { method: "DELETE" });
}

export type ProductQuestionSet = {
  productName: string;
  inherited: QuoteQuestion[];
  custom: QuoteQuestion[];
  effective: QuoteQuestion[];
};

/* GET /insurer/products/:id/questions — inherited + custom + effective set. */
export function getInsurerProductQuestions(id: string): Promise<ProductQuestionSet> {
  return request(`/insurer/products/${id}/questions`);
}

/* POST /insurer/products/:id/questions — add a product-specific question. */
export function createInsurerQuestion(id: string, data: QuestionInput): Promise<QuoteQuestion> {
  return request(`/insurer/products/${id}/questions`, { method: "POST", body: JSON.stringify(data) });
}

/* PATCH /insurer/products/:id/questions/:questionId — update a product question. */
export function updateInsurerQuestion(
  id: string,
  questionId: string,
  data: QuestionInput,
): Promise<QuoteQuestion> {
  return request(`/insurer/products/${id}/questions/${questionId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/* DELETE /insurer/products/:id/questions/:questionId — remove a product question. */
export function deleteInsurerQuestion(id: string, questionId: string): Promise<{ deleted: boolean }> {
  return request(`/insurer/products/${id}/questions/${questionId}`, { method: "DELETE" });
}

/* POST /insurer/products/:id/questions/reorder — ids in display order. */
export function reorderInsurerQuestions(id: string, ids: string[]): Promise<{ reordered: boolean }> {
  return request(`/insurer/products/${id}/questions/reorder`, {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

/* GET /marketplace/products/:id/questions — public questionnaire for a product. */
export function getMarketplaceProductQuestions(
  id: string,
): Promise<{ planId: string; questions: QuoteQuestion[] }> {
  return request(`/marketplace/products/${id}/questions`);
}

/* PATCH /admin/companies/:slug/status — deactivate or reactivate a company. */
export function setCompanyStatus(slug: string, active: boolean): Promise<AdminCompany> {
  return request(`/admin/companies/${slug}/status`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

/* DELETE /admin/companies/:slug — permanently delete a company and its data. */
export function deleteCompany(slug: string): Promise<{ deleted: string }> {
  return request(`/admin/companies/${slug}`, { method: "DELETE" });
}

/* PATCH /admin/users/:id/status — deactivate or reactivate an account. */
export function setUserActive(id: string, active: boolean): Promise<{ id: string; active: boolean }> {
  return request(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

/* GET /admin/applications?status=… — list company applications (admin). */
export function getCompanyApplications(
  status?: CompanyApplicationStatus,
): Promise<CompanyApplication[]> {
  const qs = status ? `?status=${status}` : "";
  return request(`/admin/applications${qs}`);
}

/* GET /admin/applications/:id — single application detail (admin). */
export function getCompanyApplication(id: string): Promise<CompanyApplication> {
  return request(`/admin/applications/${id}`);
}

/* POST /admin/applications — public company self-registration. */
export function submitCompanyApplication(data: {
  companyName: string;
  email: string;
  phone?: string;
  tin?: string;
  license?: string;
  tagline?: string;
  about?: string;
  headquarters?: string;
  founded?: number;
  documents?: string[];
}): Promise<CompanyApplication> {
  return request("/admin/applications", { method: "POST", body: JSON.stringify(data) });
}

/* POST /admin/applications/:id/approve — admin approve action. */
export function approveApplication(id: string): Promise<CompanyApplication> {
  return request(`/admin/applications/${id}/approve`, { method: "POST" });
}

/* POST /admin/applications/:id/reject — admin reject action with reason. */
export function rejectApplication(
  id: string,
  reason: string,
): Promise<CompanyApplication> {
  return request(`/admin/applications/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

/* ---------------------------------------------------------------- */
/* Insurer workspace                                                    */
/* ---------------------------------------------------------------- */

export type InsurerOverview = {
  provider: { slug: string; name: string; license: string; rating: number };
  totals: {
    products: number;
    policies: number;
    activePolicies: number;
    customers: number;
    premium30d: number;
    pendingClaims: number;
    paidClaims30d: number;
    collected30d: number;
  };
  renewalsDue: {
    id: string;
    policyNumber: string;
    planName: string;
    holderName: string;
    premium: number;
    startDate: string;
    endDate: string;
    holderEmail: string;
  }[];
  recentClaims: {
    id: string;
    reference: string;
    policyNumber: string;
    holderName: string;
    status: string;
    amount: number;
    createdAt: string;
  }[];
};

export type ProductStatus = "draft" | "pending_review" | "approved" | "published" | "rejected";
export type ProductPurchaseMethod = "quote" | "buy_now" | "both";

export type InsurerProduct = {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  monthly: number;
  coverAmount: number;
  excessAmount: number;
  claimDays: string;
  claimSpeed: number;
  customerTypes: string[];
  payments: string[];
  badge: string | null;
  highlights: string[];
  features: Record<string, unknown>;
  purchaseMethod: ProductPurchaseMethod;
  description: string;
  coverageDetails: Record<string, unknown> | null;
  benefits: string[];
  exclusions: string[];
  requiredDocuments: string[];
  eligibility: string | null;
  policyDuration: string | null;
  deductible: number | null;
  status: ProductStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  reviewerName: string | null;
  policies: number;
};

export type InsurerNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  productId: string | null;
};

export type InsurerCategory = {
  slug: string;
  name: string;
  blurb: string;
  from: string;
};

export type MarketplaceProduct = {
  id: string;
  providerId: string;
  provider: string;
  providerStatus: string;
  providerRating: number;
  name: string;
  category: string;
  categorySlug: string;
  monthly: number;
  coverAmount: number;
  excessAmount: number;
  claimDays: string;
  claimSpeed: number;
  customerTypes: string[];
  payments: string[];
  badge: string | null;
  highlights: string[];
  features: Record<string, unknown>;
  purchaseMethod: ProductPurchaseMethod;
  description: string;
  coverageDetails: Record<string, unknown> | null;
  benefits: string[];
  exclusions: string[];
  requiredDocuments: string[];
  eligibility: string | null;
  policyDuration: string | null;
  deductible: number | null;
};

export type MarketplaceCompany = {
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
  productCount: number;
};

export type MarketplaceBroker = {
  id: string;
  name: string;
  company: string | null;
  memberSince: string;
};

export type MarketplaceCategory = {
  slug: string;
  name: string;
  blurb: string;
  from: string;
  productCount: number;
};

export type InsurerCustomer = {
  name: string;
  email: string;
  phone: string | null;
  type: string;
  policyCount: number;
  premiumTotal: number;
  since: string;
};

export type InsurerPolicy = {
  id: string;
  policyNumber: string;
  planName: string;
  holderName: string;
  holderEmail: string;
  premium: number;
  startDate: string;
  endDate: string;
  category: string;
  active: boolean;
};

export type InsurerClaim = {
  id: string;
  reference: string;
  policyNumber: string;
  holderName: string;
  status: string;
  description: string;
  amount: number;
  createdAt: string;
};

export type InsurerReport = {
  id: string;
  title: string;
  description: string;
  period: string;
};

export type InsurerSettlement = {
  id: string;
  reference: string;
  amount: number;
  collectedAt: string;
  status: string;
};

export function getInsurerOverview(): Promise<InsurerOverview> {
  return request("/insurer/overview");
}
export function getInsurerProducts(): Promise<InsurerProduct[]> {
  return request("/insurer/products");
}
export function getInsurerProduct(id: string): Promise<InsurerProduct> {
  return request(`/insurer/products/${id}`);
}
export function createInsurerProduct(data: Record<string, unknown>): Promise<InsurerProduct> {
  return request("/insurer/products", { method: "POST", body: JSON.stringify(data) });
}
export function updateInsurerProduct(
  id: string,
  data: Record<string, unknown>,
): Promise<InsurerProduct> {
  return request(`/insurer/products/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}
export function deleteInsurerProduct(id: string): Promise<{ deleted: string }> {
  return request(`/insurer/products/${id}`, { method: "DELETE" });
}
export function submitInsurerProduct(id: string): Promise<InsurerProduct> {
  return request(`/insurer/products/${id}/submit`, { method: "POST" });
}
export function publishInsurerProduct(id: string): Promise<InsurerProduct> {
  return request(`/insurer/products/${id}/publish`, { method: "POST" });
}
export function unpublishInsurerProduct(id: string): Promise<InsurerProduct> {
  return request(`/insurer/products/${id}/unpublish`, { method: "POST" });
}
export function getInsurerCategories(): Promise<InsurerCategory[]> {
  return request("/insurer/categories");
}
export function getInsurerNotifications(): Promise<InsurerNotification[]> {
  return request("/insurer/notifications");
}
export function getInsurerNotificationsUnreadCount(): Promise<{ unread: number }> {
  return request("/insurer/notifications/unread-count");
}
export function markInsurerNotificationRead(id: string): Promise<{ ok: boolean }> {
  return request(`/insurer/notifications/${id}/read`, { method: "PATCH" });
}
export function markAllInsurerNotificationsRead(): Promise<{ ok: boolean }> {
  return request("/insurer/notifications/read-all", { method: "POST" });
}

/* Broker in-app notifications (same shape as InsurerNotification). */
export function getBrokerNotifications(): Promise<InsurerNotification[]> {
  return request("/broker/notifications");
}
export function getBrokerNotificationsUnreadCount(): Promise<{ unread: number }> {
  return request("/broker/notifications/unread-count");
}
export function markBrokerNotificationRead(id: string): Promise<{ ok: boolean }> {
  return request(`/broker/notifications/${id}/read`, { method: "PATCH" });
}
export function markAllBrokerNotificationsRead(): Promise<{ ok: boolean }> {
  return request("/broker/notifications/read-all", { method: "POST" });
}

/* Public marketplace — only PUBLISHED, active products. */
export function getMarketplaceProducts(): Promise<MarketplaceProduct[]> {
  return request("/marketplace/products");
}
export function getMarketplaceProduct(id: string): Promise<MarketplaceProduct> {
  return request(`/marketplace/products/${id}`);
}
export function getMarketplaceComparison(ids: string[]): Promise<MarketplaceProduct[]> {
  return request(`/marketplace/compare?ids=${encodeURIComponent(ids.join(","))}`);
}
export function getMarketplaceCategories(): Promise<MarketplaceCategory[]> {
  return request("/marketplace/categories");
}
export function getMarketplaceCompanies(): Promise<MarketplaceCompany[]> {
  return request("/marketplace/companies");
}
export function getMarketplaceBrokers(): Promise<MarketplaceBroker[]> {
  return request("/marketplace/brokers");
}
export type CompanyReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  authorName: string;
};
export type CompanyReviewsResponse = {
  reviews: CompanyReview[];
  count: number;
  avgRating: number | null;
};
export type CompanyReviewEligibility = {
  eligible: boolean;
  reason: "NOT_SIGNED_IN" | "NO_APPROVED_POLICY" | null;
};
export function getCompanyReviews(slug: string): Promise<CompanyReviewsResponse> {
  return request(`/marketplace/companies/${slug}/reviews`);
}
export function checkCompanyReviewEligibility(slug: string): Promise<CompanyReviewEligibility> {
  return request(`/marketplace/companies/${slug}/eligibility`);
}
export function postCompanyReview(
  slug: string,
  data: { rating: number; comment: string },
): Promise<CompanyReview> {
  return request(`/marketplace/companies/${slug}/reviews`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
export function getInsurerCustomers(): Promise<InsurerCustomer[]> {
  return request("/insurer/customers");
}
export function getInsurerPolicies(): Promise<InsurerPolicy[]> {
  return request("/insurer/policies");
}
export function getInsurerClaims(): Promise<InsurerClaim[]> {
  return request("/insurer/claims");
}
export function getInsurerReports(): Promise<InsurerReport[]> {
  return request("/insurer/reports");
}
export function getInsurerPayments(): Promise<InsurerSettlement[]> {
  return request("/insurer/payments");
}

/* ---------------------------------------------------------------- */
/* Quote Requests                                                   */
/* ---------------------------------------------------------------- */

export type QuoteRequestStatus =
  | "pending_review"
  | "info_requested"
  | "quoted"
  | "accepted"
  | "rejected"
  | "inspection_required"
  | "expired";

export type QuoteRequestItem = {
  id: string;
  planId: string;
  productName: string;
  providerName: string;
  categoryName: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  answers: Record<string, string>;
  status: QuoteRequestStatus;
  quotedPremium: number | null;
  quotedNote: string | null;
  infoRequest: string | null;
  customerInfoResponse: string | null;
  rejectionReason: string | null;
  inspectionNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  acceptedAt: string | null;
  expiresAt: string | null;
  draftId: string | null;
  brokerId: string | null;
  brokerName: string | null;
  createdAt: string;
  updatedAt: string;
};

export function submitQuoteRequest(data: {
  planId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  answers: Record<string, string>;
  brokerId?: string | null;
}): Promise<QuoteRequestItem> {
  return request("/quote-requests", { method: "POST", body: JSON.stringify(data) });
}

export function listMyQuoteRequests(email?: string): Promise<QuoteRequestItem[]> {
  const query = email ? `?email=${encodeURIComponent(email)}` : "";
  return request(`/quote-requests${query}`);
}

export function getQuoteRequest(id: string, email?: string): Promise<QuoteRequestItem> {
  const query = email ? `?email=${encodeURIComponent(email)}` : "";
  return request(`/quote-requests/${id}${query}`);
}

export function acceptQuoteRequest(id: string, email?: string): Promise<{ draftId: string }> {
  return request(`/quote-requests/${id}/accept`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function respondToQuoteInfoRequest(
  id: string,
  response: string,
  email?: string,
): Promise<QuoteRequestItem> {
  return request(`/quote-requests/${id}/respond`, {
    method: "POST",
    body: JSON.stringify({ response, email }),
  });
}

/* Insurer Quote Request API */

export function getInsurerQuoteRequests(): Promise<QuoteRequestItem[]> {
  return request("/insurer/quote-requests");
}

export function insurerQuoteRequest(
  id: string,
  premium: number,
  note?: string,
): Promise<QuoteRequestItem> {
  return request(`/insurer/quote-requests/${id}/quote`, {
    method: "POST",
    body: JSON.stringify({ premium, note }),
  });
}

export function insurerRejectQuoteRequest(id: string, reason: string): Promise<QuoteRequestItem> {
  return request(`/insurer/quote-requests/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function insurerRequestQuoteInfo(id: string, question: string): Promise<QuoteRequestItem> {
  return request(`/insurer/quote-requests/${id}/request-info`, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

export function insurerRequestQuoteInspection(id: string, note: string): Promise<QuoteRequestItem> {
  return request(`/insurer/quote-requests/${id}/request-inspection`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

/* ---------------------------------------------------------------- */
/* Broker workspace                                                 */
/* ---------------------------------------------------------------- */

export type BrokerProfile = {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  memberSince: string;
};

export type BrokerOverview = {
  broker: BrokerProfile;
  totals: {
    clients: number;
    activePolicies: number;
    openQuotes: number;
    placedPremium: number;
    pendingCommission: number;
    paidCommission: number;
    renewalsDue: number;
    openClaims: number;
  };
  renewals: BrokerRenewal[];
  recentQuotes: BrokerQuote[];
  recentCommissions: BrokerCommission[];
};

export type BrokerCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  type: string;
  status: string;
  linked: boolean;
  consentAt: string | null;
  policyCount: number;
  premiumTotal: number;
  since: string;
};

export type BrokerQuote = {
  id: string;
  planId: string;
  productName: string;
  providerName: string;
  categoryName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  quotedPremium: number | null;
  answers: Record<string, string>;
  submittedAt: string;
  updatedAt: string;
  expiresAt: string | null;
};

export type BrokerPolicy = {
  id: string;
  policyNumber: string;
  planName: string;
  provider: string;
  category: string;
  customerName: string;
  customerEmail: string;
  premium: number;
  startDate: string;
  endDate: string;
  status: string;
  daysToRenewal: number;
};

export type BrokerRenewal = BrokerPolicy & { renewalDate: string };

export type BrokerClaim = {
  id: string;
  reference: string;
  policyNumber: string;
  planName: string;
  customerName: string;
  customerEmail: string;
  status: string;
  description: string;
  amount: number;
  incidentDate: string;
  createdAt: string;
};

export type BrokerCommission = {
  id: string;
  policyNumber: string;
  planName: string;
  customerName: string;
  premium: number;
  rate: number;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
};

export type BrokerReportRow = {
  label: string;
  policies: number;
  premium: number;
  commission: number;
};

export type BrokerReports = {
  generatedAt: string;
  totals: {
    policies: number;
    placedPremium: number;
    commission: number;
    paidCommission: number;
    averagePremium: number;
  };
  byCategory: BrokerReportRow[];
  byProvider: BrokerReportRow[];
  monthly: { month: string; policies: number; premium: number; commission: number }[];
};

export type BrokerSettings = BrokerProfile & {
  clientCount: number;
  commissionRate: number;
  notificationEmail: string;
};

export type BrokerProductOption = {
  id: string;
  name: string;
  providerName: string;
  categoryName: string;
  monthly: number;
};

export function getBrokerOverview(): Promise<BrokerOverview> {
  return request("/broker/overview");
}
export function getBrokerProducts(): Promise<BrokerProductOption[]> {
  return request("/broker/products");
}
export function getBrokerCustomers(): Promise<BrokerCustomer[]> {
  return request("/broker/customers");
}
export function addBrokerCustomer(data: {
  name: string;
  email: string;
  phone?: string;
  type?: string;
  status?: string;
}): Promise<BrokerCustomer> {
  return request("/broker/customers", { method: "POST", body: JSON.stringify(data) });
}
export function getBrokerQuotes(): Promise<BrokerQuote[]> {
  return request("/broker/quotes");
}
export function createBrokerQuote(data: {
  planId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  answers?: Record<string, string>;
}): Promise<BrokerQuote> {
  return request("/broker/quotes", { method: "POST", body: JSON.stringify(data) });
}
export function getBrokerPolicies(): Promise<BrokerPolicy[]> {
  return request("/broker/policies");
}
export function getBrokerRenewals(): Promise<BrokerRenewal[]> {
  return request("/broker/renewals");
}
export function getBrokerClaims(): Promise<BrokerClaim[]> {
  return request("/broker/claims");
}
export function getBrokerCommissions(): Promise<BrokerCommission[]> {
  return request("/broker/commissions");
}
export function getBrokerReports(): Promise<BrokerReports> {
  return request("/broker/reports");
}
export function getBrokerSettings(): Promise<BrokerSettings> {
  return request("/broker/settings");
}
export function updateBrokerSettings(data: {
  name?: string;
  company?: string;
  phone?: string;
}): Promise<BrokerSettings> {
  return request("/broker/settings", { method: "PATCH", body: JSON.stringify(data) });
}

/* ---------------------------------------------------------------- */
/* Secure messaging — customer ⇄ assigned broker                    */
/* ---------------------------------------------------------------- */

export type MessageContextType = "general" | "product" | "quote" | "policy";

export type BrokerContactLink = {
  brokerId: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  linkedVia: string[];
};

export type MessagingContact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  linkedVia: string[];
};

export type MessagingDirectory =
  | { side: "customer"; contacts: BrokerContactLink[] }
  | { side: "broker"; contacts: MessagingContact[] };

export type MessageContextOption = {
  type: MessageContextType;
  id: string;
  reference: string | null;
  title: string;
  subtitle: string;
  status: string;
  productId: string;
  updatedAt: string | null;
};

export type MessageAttachment = {
  id: string;
  kind: "image" | "document";
  fileName: string;
  contentType: string;
  sizeBytes: number;
  downloadUrl: string;
  previewUrl: string | null;
  createdAt: string;
};

export type ChannelMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  mine: boolean;
  kind: "text" | "image" | "document" | "system";
  body: string;
  replyTo: { id: string; senderName: string; preview: string } | null;
  attachments: MessageAttachment[];
  delivered: boolean;
  read: boolean;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
};

export type ConversationSummary = {
  id: string;
  subject: string;
  contextType: MessageContextType;
  contextLabel: string;
  peer: { id: string; name: string; email: string; phone: string | null; role: string; company: string | null };
  preview: string;
  lastMessageAt: string;
  lastMessageIsMine: boolean;
  unread: number;
  messageCount: number;
};

export type ConversationContextCard = {
  type: MessageContextType;
  title: string;
  subtitle: string | null;
  reference: string | null;
  fields: { label: string; value: string }[];
  links: { label: string; href: string }[];
};

export type ConversationDetail = {
  id: string;
  subject: string;
  contextType: MessageContextType;
  peer: ConversationSummary["peer"];
  context: ConversationContextCard | null;
  members: { id: string; name: string; role: string; side: string; email: string }[];
  unread: number;
  messageCount: number;
  createdAt: string;
  lastMessageAt: string;
};

export type ConversationThread = {
  conversation: ConversationDetail;
  messages: ChannelMessage[];
  hasMore: boolean;
};

export type MessageSyncResult = {
  serverTime: string;
  unreadTotal: number;
  conversations: ConversationSummary[];
  messages: { conversationId: string; message: ChannelMessage }[];
};

export type OutgoingAttachment = {
  fileName: string;
  contentType: string;
  /** Raw file bytes, base64 encoded without a data-URL prefix. */
  data: string;
};

export function getMessagingDirectory(): Promise<MessagingDirectory> {
  return request("/messages/contacts");
}

export function getMessageContexts(peerId?: string): Promise<{ items: MessageContextOption[] }> {
  return request(`/messages/contexts${peerId ? `?peerId=${encodeURIComponent(peerId)}` : ""}`);
}

export function getConversations(search?: string): Promise<ConversationSummary[]> {
  return request(`/messages${search ? `?search=${encodeURIComponent(search)}` : ""}`);
}

export function getConversation(id: string): Promise<ConversationThread> {
  return request(`/messages/${id}`);
}

export function getConversationHistory(
  id: string,
  params: { before?: string; after?: string; limit?: number } = {},
): Promise<{ messages: ChannelMessage[]; hasMore: boolean }> {
  const qs = new URLSearchParams();
  if (params.before) qs.set("before", params.before);
  if (params.after) qs.set("after", params.after);
  if (params.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString();
  return request(`/messages/${id}/history${suffix ? `?${suffix}` : ""}`);
}

export function searchConversation(
  id: string,
  query: string,
): Promise<{ query: string; results: ChannelMessage[]; total: number }> {
  return request(`/messages/${id}/search?q=${encodeURIComponent(query)}`);
}

export function getMessageUnreadTotal(): Promise<{ unread: number }> {
  return request("/messages/unread");
}

/** Polled while the messaging screen is visible. */
export function syncMessages(since?: string, openConversationId?: string): Promise<MessageSyncResult> {
  const params = new URLSearchParams();
  if (since) params.set("since", since);
  // The open thread is always returned so read receipts refresh in place.
  if (openConversationId) params.set("open", openConversationId);
  const query = params.toString();
  return request(`/messages/sync${query ? `?${query}` : ""}`);
}

export function startConversation(input: {
  peerId: string;
  contextType?: MessageContextType;
  productId?: string;
  quoteRequestId?: string;
  policyId?: string;
  subject?: string;
  message?: string;
}): Promise<ConversationThread> {
  return request("/messages", { method: "POST", body: JSON.stringify(input) });
}

export function sendMessage(
  id: string,
  input: { body?: string; replyToId?: string; attachments?: OutgoingAttachment[] },
): Promise<ChannelMessage> {
  return request(`/messages/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function markConversationRead(
  id: string,
): Promise<{ ok: boolean; readAt: string; marked: number; unread: number }> {
  return request(`/messages/${id}/read`, { method: "POST" });
}

export function setConversationArchived(id: string, archived: boolean): Promise<{ ok: boolean }> {
  return request(`/messages/${id}/archive`, { method: "POST", body: JSON.stringify({ archived }) });
}

/**
 * Absolute URL for an authenticated attachment. Attachments are streamed by the
 * backend (the bytes are never public), so the session cookie must travel with
 * the request and an <img> tag cannot be used for them.
 */
export function attachmentUrl(relative: string): string {
  return `${API_URL}${relative}`;
}

/* Workspace notifications for customer / business / broker. */
export type WorkspaceNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  productId: string | null;
  conversationId: string | null;
};

export function getWorkspaceNotifications(): Promise<WorkspaceNotification[]> {
  return request("/notifications");
}

export function getWorkspaceNotificationsUnreadCount(): Promise<{ unread: number }> {
  return request("/notifications/unread-count");
}

export function markWorkspaceNotificationRead(id: string): Promise<{ ok: boolean }> {
  return request(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllWorkspaceNotificationsRead(): Promise<{ ok: boolean }> {
  return request("/notifications/read-all", { method: "POST" });
}

