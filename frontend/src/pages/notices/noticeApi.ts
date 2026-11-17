const API_BASE_URL = "http://localhost:3000/api/v1/notices";

export type NoticeCategory =
  "GENERAL" | "MAINTENANCE" | "EVENT" | "EMERGENCY" | "PAYMENT" | "OTHER";
export type NoticePriority = "NORMAL" | "IMPORTANT" | "URGENT";
export type NoticeStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Notice {
  _id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  status: NoticeStatus;
  isPinned: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | { _id: string; name: string };
}

export interface NoticePayload {
  title: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  expiresAt: string | null;
  status?: "DRAFT" | "PUBLISHED";
}

export interface NoticeListResult {
  notices: Notice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  notice?: T;
  notices?: T[];
  pagination?: NoticeListResult["pagination"];
}

async function request<T>(path = "", init: RequestInit = {}): Promise<T> {
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
    .catch(() => ({}))) as ApiEnvelope<unknown>;
  if (!response.ok || !result.success) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }
  return result as T;
}

function toQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return query.size ? `?${query.toString()}` : "";
}

export async function getSecretaryNotices(
  params: Record<string, string | number | undefined>,
) {
  const result = await request<ApiEnvelope<Notice>>(
    `/manage${toQuery(params)}`,
  );
  return {
    notices: result.notices ?? [],
    pagination: result.pagination ?? {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  };
}

export async function getResidentNotices(
  params: Record<string, string | number | undefined>,
) {
  const result = await request<ApiEnvelope<Notice>>(toQuery(params));
  return {
    notices: result.notices ?? [],
    pagination: result.pagination ?? {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  };
}

export async function getNotice(id: string) {
  const result = await request<ApiEnvelope<Notice>>(
    `/${encodeURIComponent(id)}`,
  );
  if (!result.notice) throw new Error("Notice was not returned by the server.");
  return result.notice;
}

export async function createNotice(payload: NoticePayload) {
  return request<ApiEnvelope<Notice>>("", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateNotice(
  id: string,
  payload: Omit<NoticePayload, "status">,
) {
  return request<ApiEnvelope<Notice>>(`/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function noticeAction(
  id: string,
  action: "publish" | "unpublish" | "archive",
) {
  return request<ApiEnvelope<Notice>>(`/${encodeURIComponent(id)}/${action}`, {
    method: "PATCH",
  });
}

export async function setNoticePinned(id: string, isPinned: boolean) {
  return request<ApiEnvelope<Notice>>(`/${encodeURIComponent(id)}/pin`, {
    method: "PATCH",
    body: JSON.stringify({ isPinned }),
  });
}
