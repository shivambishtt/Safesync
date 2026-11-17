const API_BASE = "http://localhost:3000/api/v1/maintenance";

export type BillingFrequency = "MONTHLY" | "HALF_YEARLY" | "ANNUALLY";
export type BillStatus = "PENDING" | "PAID";
export type PaymentMethod =
  "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE" | "OTHER";

export interface BillingPlan {
  _id: string;
  amount: number;
  frequency: BillingFrequency;
  nextPeriodStart: string;
}

export interface MaintenanceBill {
  _id: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  status: BillStatus;
  paidAt: string | null;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  paymentNotes: string | null;
  flat: {
    _id: string;
    flatNumber: string;
    block: string;
    floor: number;
    flatType: string;
  } | null;
  resident: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
  } | null;
  recordedBy: { _id: string; name: string } | null;
}

export interface BillingPage {
  bills: MaintenanceBill[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary?: {
    pendingCount: number;
    pendingAmount?: number;
    paidCount: number;
    paidAmount?: number;
  };
}

interface Envelope {
  success: boolean;
  message?: string;
  plan?: BillingPlan | null;
  bills?: MaintenanceBill[];
  pagination?: BillingPage["pagination"];
  summary?: BillingPage["summary"];
  [key: string]: unknown;
}

async function request(
  path: string,
  init: RequestInit = {},
): Promise<Envelope> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const result = (await response.json().catch(() => ({}))) as Envelope;
  if (!response.ok || !result.success)
    throw new Error(result.message || `Request failed (${response.status})`);
  return result;
}

export async function getBillingPlan() {
  return request("/billing/plan");
}

export async function saveBillingPlan(plan: {
  amount: number;
  frequency: BillingFrequency;
  nextPeriodStart: string;
}) {
  return request("/billing/plan", {
    method: "PUT",
    body: JSON.stringify(plan),
  });
}

export async function generateBills() {
  return request("/billing/generate", { method: "POST" });
}

export async function getSocietyBills(page = 1, status = "") {
  const query = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) query.set("status", status);
  const result = await request(`/billing/bills?${query.toString()}`);
  return {
    bills: result.bills ?? [],
    pagination: result.pagination ?? {
      page,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
    summary: result.summary,
  } as BillingPage;
}

export async function recordPayment(
  billId: string,
  details: {
    paymentMethod: PaymentMethod;
    paymentReference: string;
    paymentNotes: string;
  },
) {
  return request(`/billing/bills/${encodeURIComponent(billId)}/payments`, {
    method: "POST",
    body: JSON.stringify(details),
  });
}

export async function getMyBills(page = 1, status = "") {
  const query = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) query.set("status", status);
  const result = await request(`/my-bills?${query.toString()}`);
  return {
    bills: result.bills ?? [],
    pagination: result.pagination ?? {
      page,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
    summary: result.summary,
  } as BillingPage;
}
