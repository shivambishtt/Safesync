export const API_BASE_URL = "http://localhost:3000/api/v1";

export interface Visitor {
  _id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  purpose: string;
  visitStatus: string;
  createdAt: string;
  updatedAt?: string;
  checkInTime?: string | null;
  checkoutTime?: string | null;
  visitTo?: { flatNumber?: string; block?: string; floor?: number } | null;
  resident?: {
    _id?: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
  } | null;
  allowedBy?: {
    _id?: string;
    name?: string;
  } | null;
  rejectedBy?: { name?: string } | null;
}

export interface VisitorStats {
  totalVisitors: number;
  pending: number;
  approved: number;
  rejected: number;
  checkedIn: number;
  checkedOut: number;
}

export interface VisitorDestination {
  _id: string;
  flatNumber: string;
  block: string;
  resident: {
    _id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  totalVisitors?: number;
  visitors?: T;
  visitorStats?: VisitorStats;
  flats?: VisitorDestination[];
}

export type VisitorAction = "check-in" | "check-out";

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
  });
  const result = (await response.json()) as T & {
    success?: boolean;
    message?: string;
  };

  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }

  return result;
}

export async function getVisitorHistory() {
  const result = await requestJson<ApiResponse<Visitor[]>>("/history");
  return result.visitors ?? [];
}

export async function getPendingVisitors() {
  return requestJson<ApiResponse<Visitor[]>>("/pending");
}

export async function getVisitorStats() {
  const result = await requestJson<ApiResponse<never>>("/stats");
  return result.visitorStats;
}

export async function getVisitorDestinations() {
  const result = await requestJson<ApiResponse<never>>("/visitor-destinations");
  return result.flats ?? [];
}

export async function updateVisitorStatus(
  visitorId: string,
  action: VisitorAction,
) {
  return requestJson<{ success: boolean; message?: string; visitor?: Visitor }>(
    `/${visitorId}/${action}`,
    { method: "PATCH" },
  );
}

export async function registerVisitor(input: {
  name: string;
  phoneNumber: string;
  email?: string;
  purpose: string;
  visitTo: string;
  resident: string;
}) {
  return requestJson<{ success: boolean; message?: string; visitor?: Visitor }>(
    "/visitor/",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function formatVisitorDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function visitorStatusLabel(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}
