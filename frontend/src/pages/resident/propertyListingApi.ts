const API_BASE_URL = "http://localhost:3000/api/v1/property-listings";

export type ListingType = "SALE" | "RENT";
export type ListingStatus = "ACTIVE" | "CLOSED";

export interface PropertyListing {
  _id: string;
  listingType: ListingType;
  amount: number;
  showContact: boolean;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  flat: {
    _id: string;
    flatNumber: string;
    block: string;
    floor: number;
    flatType: string;
    area?: number;
  } | null;
  owner: { _id: string; name: string; phoneNumber?: string | null } | null;
  society: { _id: string; name: string } | null;
}

export interface ListingPage {
  listings: PropertyListing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiEnvelope {
  success: boolean;
  message?: string;
  listing?: PropertyListing;
  listings?: PropertyListing[];
  pagination?: ListingPage["pagination"];
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
  const result = (await response.json().catch(() => ({}))) as ApiEnvelope;
  if (!response.ok || !result.success)
    throw new Error(result.message || `Request failed (${response.status})`);
  return result;
}

function queryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return query.size ? `?${query.toString()}` : "";
}

function pageResult(result: ApiEnvelope): ListingPage {
  return {
    listings: result.listings ?? [],
    pagination: result.pagination ?? {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0,
    },
  };
}

export async function getSocietyListings(
  params: Record<string, string | number | undefined>,
) {
  return pageResult(await request(queryString(params)));
}

export async function getMyListings(
  params: Record<string, string | number | undefined>,
) {
  return pageResult(await request(`/mine${queryString(params)}`));
}

export async function createListing(payload: {
  listingType: ListingType;
  amount: number;
  showContact: boolean;
}) {
  return request("", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateListing(
  id: string,
  payload: { listingType: ListingType; amount: number; showContact: boolean },
) {
  return request(`/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function closeListing(id: string) {
  return request(`/${encodeURIComponent(id)}/close`, { method: "PATCH" });
}
