import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Clock3,
  DoorOpen,
  UsersRound,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = "http://localhost:3000/api/v1";

interface Flat {
  _id: string;
  flatNumber: string;
  block: string;
  flatStatus: string;
}

interface Visitor {
  _id: string;
  name: string;
  purpose: string;
  visitStatus: string;
  createdAt: string;
  visitTo?: {
    flatNumber?: string;
    block?: string;
  } | null;
}

interface DashboardData {
  flats: Flat[];
  visitors: Visitor[];
  pendingVisitors: number;
  checkedInVisitors: number;
}

interface ApiResult<T> {
  success: boolean;
  message?: string;
  flats?: T;
  visitors?: T;
  totalVisitors?: number;
}

const emptyDashboard: DashboardData = {
  flats: [],
  visitors: [],
  pendingVisitors: 0,
  checkedInVisitors: 0,
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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function MetricCard({
  label,
  value,
  caption,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  caption: string;
  icon: typeof Building2;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[#08090A]">
            {value}
          </p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0C8C5E]/10 text-[#0C8C5E]">
          <Icon size={21} strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-4 text-xs text-gray-500">{caption}</p>
    </article>
  );
}

export default function SecretaryDashboard() {
  const { session } = useAuth();
  const societyId = session.user?.society;
  const [data, setData] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!societyId) {
      setLoading(false);
      setLoadError("Your account is not linked to a society yet.");
      return;
    }

    let isCurrent = true;
    setLoading(true);
    setLoadError("");

    const loadDashboard = async () => {
      const results = await Promise.allSettled([
        getJson<ApiResult<Flat[]>>(`/societies/${societyId}/flats`),
        getJson<ApiResult<Visitor[]>>(`/`),
        getJson<ApiResult<Visitor[]>>(`/pending`),
      ]);

      if (!isCurrent) return;

      const [flatsResult, visitorsResult, pendingVisitorsResult] = results;
      const failed = results.some((result) => result.status === "rejected");
      const requestNames = ["Flats", "Recent visitors", "Pending visitors"];
      const requestErrors = results.flatMap((result, index) => {
        if (result.status !== "rejected") return [];

        const message =
          result.reason instanceof Error
            ? result.reason.message
            : "Request failed";
        return [`${requestNames[index]}: ${message}`];
      });
      const flats =
        flatsResult.status === "fulfilled" && flatsResult.value.success
          ? (flatsResult.value.flats as Flat[] | undefined) ?? []
          : [];
      const visitors =
        visitorsResult.status === "fulfilled" && visitorsResult.value.success
          ? (visitorsResult.value.visitors as Visitor[] | undefined) ?? []
          : [];
      const pendingVisitorCount =
        pendingVisitorsResult.status === "fulfilled" &&
        pendingVisitorsResult.value.success
          ? pendingVisitorsResult.value.totalVisitors ?? 0
          : 0;

      setData({
        flats,
        visitors: visitors.slice(0, 5),
        pendingVisitors: pendingVisitorCount,
        checkedInVisitors: visitors.filter(
          (visitor) => visitor.visitStatus === "CHECKED_IN",
        ).length,
      });
      setLoadError(
        failed
          ? requestErrors.join(" · ")
          : "",
      );
      setLoading(false);
    };

    void loadDashboard();

    return () => {
      isCurrent = false;
    };
  }, [societyId]);

  const occupiedFlats = data.flats.filter(
    (flat) => flat.flatStatus === "OCCUPIED",
  ).length;

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[#0C8C5E]">Secretary workspace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#08090A] sm:text-3xl">
            Good to see you, {session.user?.name?.split(" ")[0] ?? "Secretary"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Here’s what’s happening across your society today.
          </p>
        </div>
        <p className="inline-flex items-center gap-2 text-sm text-gray-500">
          <Clock3 size={16} />
          {new Intl.DateTimeFormat("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(new Date())}
        </p>
      </section>

      {loadError && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {loadError}
        </div>
      )}

      <section aria-label="Society summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total flats"
          value={loading ? "—" : data.flats.length}
          caption="Registered in your society"
          icon={Building2}
        />
        <MetricCard
          label="Occupied flats"
          value={loading ? "—" : occupiedFlats}
          caption="Marked occupied"
          icon={UsersRound}
        />
        <MetricCard
          label="Pending visitors"
          value={loading ? "—" : data.pendingVisitors}
          caption="Waiting for entry approval"
          icon={Clock3}
        />
        <MetricCard
          label="Currently inside"
          value={loading ? "—" : data.checkedInVisitors}
          caption="Visitors checked in"
          icon={DoorOpen}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.8fr)]">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-semibold text-[#08090A]">Recent visitors</h2>
              <p className="mt-1 text-sm text-gray-500">Latest visitor activity in your society</p>
            </div>
            <Link
              to="/secretary/visitors"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#0C8C5E] hover:underline"
            >
              View all <ArrowUpRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4 p-6" aria-label="Loading recent visitors">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-10 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : data.visitors.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <Users size={20} />
              </span>
              <p className="mt-3 text-sm font-medium text-gray-800">No visitor activity yet</p>
              <p className="mt-1 text-sm text-gray-500">Visitor records will show here when they are added.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.visitors.map((visitor) => (
                <div key={visitor._id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{visitor.name}</p>
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {visitor.purpose.toLowerCase()} · {visitor.visitTo?.block ?? "Flat"} {visitor.visitTo?.flatNumber ?? ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                      {visitor.visitStatus.toLowerCase().replaceAll("_", " ")}
                    </span>
                    <p className="mt-1.5 text-xs text-gray-500">{formatDate(visitor.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-2xl bg-[#083D33] p-6 text-white shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#8FE0BC]">
            <Building2 size={21} />
          </div>
          <h2 className="mt-5 text-lg font-semibold">Manage your society</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Keep resident records, flats, visitor activity, and complaints organized from one workspace.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/secretary/residents" className="rounded-lg bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/15">
              View residents <span className="float-right">→</span>
            </Link>
            <Link to="/secretary/flats" className="rounded-lg bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/15">
              Manage flats <span className="float-right">→</span>
            </Link>
            <Link to="/secretary/complaints" className="rounded-lg bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/15">
              Review complaints <span className="float-right">→</span>
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
