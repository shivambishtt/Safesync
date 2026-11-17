const API_BASE_URL = "http://localhost:3000/api/v1/security/attendance";

export interface GuardAttendance {
  _id: string;
  checkedInAt: string;
  checkedOutAt: string | null;
  createdAt: string;
  guard?:
    | {
        _id: string;
        name: string;
        email: string;
        phoneNumber: string;
        isActive?: boolean;
      }
    | string;
}

export interface AttendanceResponse {
  success: boolean;
  message?: string;
  attendance?: GuardAttendance;
  activeAttendance?: GuardAttendance | null;
  attendances?: GuardAttendance[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const result = (await response
    .json()
    .catch(() => ({}))) as AttendanceResponse;
  if (!response.ok || !result.success)
    throw new Error(result.message || `Request failed (${response.status})`);
  return result;
}

export function buildAttendanceQuery(
  params: Record<string, string | number | undefined>,
) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return query.size ? `?${query.toString()}` : "";
}

export function getMyAttendance(
  params: Record<string, string | number | undefined>,
) {
  return request(`/me${buildAttendanceQuery(params)}`);
}

export function checkInToShift() {
  return request("/check-in", { method: "POST" });
}

export function checkOutFromShift() {
  return request("/check-out", { method: "POST" });
}

export function getSocietyAttendance(
  params: Record<string, string | number | undefined>,
) {
  return request(buildAttendanceQuery(params));
}
