import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  Clock3,
  DoorOpen,
  Home,
  Users,
  UserRoundCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = "http://localhost:3000/api/v1";

interface Flat {
  _id: string;
  flatNumber: string;
  block: string;
  floor: number;
  flatType: string;
  flatStatus: string;
  area?: number;
}

interface Society {
  _id: string;
  name: string;
  status?: string;
  address?: {
    addressLine?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

interface Visitor {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  purpose: string;
  visitStatus: string;
  createdAt: string;
  checkInTime?: string | null;
  checkoutTime?: string | null;
}

interface VisitorStats {
  totalVisitors: number;
  pending: number;
  approved: number;
  rejected: number;
  checkedIn: number;
  checkedOut: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  checkUser?: { flat?: T | null; society?: T | null };
  visitors?: T;
  totalVisitors?: number;
  visitorStats?: VisitorStats;
}

interface DashboardState {
  flat: Flat | null;
  society: Society | null;
  visitors: Visitor[];
  visitorStats: VisitorStats;
}

const emptyStats: VisitorStats = {
  totalVisitors: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  checkedIn: 0,
  checkedOut: 0,
};

const emptyDashboard: DashboardState = {
  flat: null,
  society: null,
  visitors: [],
  visitorStats: emptyStats,
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
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

async function getMyVisitors() {
  const response = await fetch(`${API_BASE_URL}/my-visitors`, {
    credentials: "include",
  });
  const result = (await response.json()) as ApiResponse<Visitor[]>;

  if (response.status === 404 && result.message === "No visitors found for this resident") {
    return [];
  }
  if (!response.ok || !result.success) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }

  return result.visitors ?? [];
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function pretty(value?: string) {
  return value
    ?.toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "—";
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: typeof Users;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[#08090A]">{value}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0C8C5E]/10 text-[#0C8C5E]">
          <Icon size={21} strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-4 text-xs text-gray-500">{hint}</p>
    </article>
  );
}

export default function ResidentDashboard() {
  const { session } = useAuth();
  const [data, setData] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);

  useEffect(() => {
    let current = true;

    const loadDashboard = async () => {
      const results = await Promise.allSettled([
        getJson<ApiResponse<Flat>>("/users/flats"),
        getJson<ApiResponse<Society>>("/users/societies"),
        getMyVisitors(),
        getJson<ApiResponse<never>>("/stats"),
      ]);

      if (!current) return;

      const [flatResult, societyResult, visitorsResult, statsResult] = results;
      const errors = results.flatMap((result, index) => {
        if (result.status !== "rejected") return [];
        const labels = ["Flat details", "Society details", "Visitor records", "Visitor summary"];
        const message = result.reason instanceof Error ? result.reason.message : "Request failed";
        return [`${labels[index]}: ${message}`];
      });

      setData({
        flat:
          flatResult.status === "fulfilled"
            ? flatResult.value.checkUser?.flat ?? null
            : null,
        society:
          societyResult.status === "fulfilled"
            ? societyResult.value.checkUser?.society ?? null
            : null,
        visitors:
          visitorsResult.status === "fulfilled"
            ? visitorsResult.value.slice(0, 5)
            : [],
        visitorStats:
          statsResult.status === "fulfilled"
            ? statsResult.value.visitorStats ?? emptyStats
            : emptyStats,
      });
      setLoadErrors(errors);
      setLoading(false);
    };

    void loadDashboard();
    return () => {
      current = false;
    };
  }, []);

  const flatLabel = data.flat
    ? `${data.flat.block} · ${data.flat.flatNumber}`
    : "No flat assigned";
  const address = [
    data.society?.address?.addressLine,
    data.society?.address?.city,
    data.society?.address?.state,
    data.society?.address?.pincode,
  ].filter(Boolean).join(", ");

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[#0C8C5E]">Resident workspace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#08090A] sm:text-3xl">
            Welcome back, {session.user?.name?.split(" ")[0] ?? "Resident"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">A quick look at your home and visitor activity.</p>
        </div>
        <p className="inline-flex items-center gap-2 text-sm text-gray-500">
          <CalendarDays size={16} />
          {new Intl.DateTimeFormat("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(new Date())}
        </p>
      </section>

      {loadErrors.length > 0 && (
        <div role="status" className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadErrors.map((error) => <p key={error}>{error}</p>)}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Visitor summary">
        <MetricCard label="Total visitors" value={loading ? "—" : data.visitorStats.totalVisitors} hint="Visitor records for your flat" icon={Users} />
        <MetricCard label="Pending approval" value={loading ? "—" : data.visitorStats.pending} hint="Waiting for entry approval" icon={Clock3} />
        <MetricCard label="Approved" value={loading ? "—" : data.visitorStats.approved} hint="Approved for entry" icon={UserRoundCheck} />
        <MetricCard label="Currently inside" value={loading ? "—" : data.visitorStats.checkedIn} hint="Visitors checked in" icon={DoorOpen} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.8fr)]">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <header className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-[#08090A]">Recent visitors</h2>
            <p className="mt-1 text-sm text-gray-500">The latest visitor requests for your flat.</p>
          </header>

          {loading ? (
            <div className="space-y-3 p-6" aria-label="Loading visitors">
              {[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-lg bg-gray-100" />)}
            </div>
          ) : data.visitors.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500"><Users size={20} /></span>
              <p className="mt-3 text-sm font-medium text-gray-800">No visitor requests yet</p>
              <p className="mt-1 text-sm text-gray-500">New visitor activity for your flat will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.visitors.map((visitor) => (
                <div key={visitor._id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{visitor.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{pretty(visitor.purpose)} · {visitor.phoneNumber}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">{pretty(visitor.visitStatus)}</span>
                    <span className="text-xs text-gray-500">{formatDate(visitor.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0C8C5E]/10 text-[#0C8C5E]"><Home size={21} /></span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Your flat</p>
                <h2 className="mt-1 break-words text-lg font-semibold text-gray-900">{loading ? "Loading…" : flatLabel}</h2>
                <p className="mt-1 text-sm text-gray-500">{data.flat ? `${pretty(data.flat.flatType)} · Floor ${data.flat.floor}` : "Ask your society office to link a flat to your account."}</p>
              </div>
            </div>
            {data.flat && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <span className="text-sm text-gray-500">Occupancy</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-800">{pretty(data.flat.flatStatus)}</span>
              </div>
            )}
          </article>

          <article className="rounded-2xl bg-[#083D33] p-5 text-white shadow-sm sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#8FE0BC]"><Building2 size={21} /></div>
            <p className="mt-5 text-xs font-medium uppercase tracking-wide text-white/60">Your society</p>
            <h2 className="mt-1 text-lg font-semibold">{loading ? "Loading…" : data.society?.name || "Society not assigned"}</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">{address || "Society address is not available."}</p>
          </article>
        </aside>
      </section>
    </div>
  );
}
