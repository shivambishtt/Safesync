export const API_BASE_URL = "http://localhost:3000/api/v1";

export interface AssignedComplaint {
  _id: string;
  title: string;
  description?: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | string;
  status: string;
  flat?: { flatNumber?: string; block?: string } | string | null;
  estimatedClosureTime?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: { name?: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

interface MaintenanceComplaintsResponse {
  success: boolean;
  message?: string;
  assignedComplaints?: AssignedComplaint[];
  completedComplaints?: AssignedComplaint[];
}

export interface MaintenanceWorkload {
  assignedComplaints: AssignedComplaint[];
  completedComplaints: AssignedComplaint[];
}

export async function getMaintenanceWorkload(): Promise<MaintenanceWorkload> {
  const response = await fetch(`${API_BASE_URL}/complaints/check-assigned`, {
    credentials: "include",
  });
  const result = (await response.json()) as MaintenanceComplaintsResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }

  return {
    assignedComplaints: result.assignedComplaints ?? [],
    completedComplaints: result.completedComplaints ?? [],
  };
}

async function sendComplaintAction(path: string, body?: object) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    credentials: "include",
    ...(body
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const result = (await response.json()) as {
    success: boolean;
    message?: string;
  };
  if (!response.ok || !result.success) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }
}

export function startComplaintWork(complaintId: string) {
  return sendComplaintAction(`/complaints/${complaintId}/update`, {
    complaintStatus: "IN_PROGRESS",
  });
}

export function resolveComplaint(complaintId: string) {
  return sendComplaintAction(`/complaints/${complaintId}/resolve`);
}

export function formatComplaintDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function readableValue(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
