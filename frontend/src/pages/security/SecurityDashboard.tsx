import { useEffect, useState } from "react";
import {
  Check,
  Clock3,
  DoorOpen,
  LogIn,
  LogOut,
  Users,
  X,
} from "lucide-react";

const API_BASE_URL = "http://localhost:3000/api/v1";

interface Visitor {
  _id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  purpose: string;
  visitStatus: string;
  createdAt: string;
  visitTo?: { flatNumber?: string } | null;
  resident?: { name?: string } | null;
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
  totalVisitors?: number;
  visitors?: T;
  visitorStats?: VisitorStats;
}

const emptyStats: VisitorStats = {
  totalVisitors: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  checkedIn: 0,
  checkedOut: 0,
};

async function requestJson<T>(path: string): Promise<T> {
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

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
  hint: string;
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
      <p className="mt-4 text-xs text-gray-500">{hint}</p>
    </article>
  );
}

export default function SecurityDashboard() {
  const [pendingVisitors, setPendingVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [busyVisitorId, setBusyVisitorId] = useState("");

  useEffect(() => {
    let current = true;

    const loadDashboard = async () => {
      const [pendingResult, statsResult] = await Promise.allSettled([
        requestJson<ApiResponse<Visitor[]>>("/pending"),
        requestJson<ApiResponse<never>>("/stats"),
      ]);

      if (!current) return;

      if (pendingResult.status === "fulfilled") {
        setPendingVisitors(pendingResult.value.visitors ?? []);
      }
      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value.visitorStats ?? emptyStats);
      }

      const errors = [
        pendingResult.status === "rejected"
          ? `Pending visitors: ${pendingResult.reason instanceof Error ? pendingResult.reason.message : "Request failed"}`
          : "",
        statsResult.status === "rejected"
          ? `Visitor stats: ${statsResult.reason instanceof Error ? statsResult.reason.message : "Request failed"}`
          : "",
      ].filter(Boolean);

      setLoadError(errors.join(" · "));
      setLoading(false);
    };

    void loadDashboard();
    return () => {
      current = false;
    };
  }, []);

  const handleDecision = async (
    visitorId: string,
    decision: "approve" | "reject",
  ) => {
    setBusyVisitorId(visitorId);
    setActionError("");
    setActionMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/${visitorId}/${decision}`,
        { method: "PATCH", credentials: "include" },
      );
      const result = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not update visitor status.");
      }

      setPendingVisitors((current) =>
        current.filter((visitor) => visitor._id !== visitorId),
      );
      setStats((current) => ({
        ...current,
        pending: Math.max(0, current.pending - 1),
        approved: current.approved + (decision === "approve" ? 1 : 0),
        rejected: current.rejected + (decision === "reject" ? 1 : 0),
      }));
      setActionMessage(result.message || "Visitor status updated.");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not update visitor status.",
      );
    } finally {
      setBusyVisitorId("");
    }
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[#0C8C5E]">Security workspace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#08090A] sm:text-3xl">
            Visitor operations
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Review entry requests and keep visitor movement up to date.
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
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      )}
      {actionError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
        </div>
      )}
      {actionMessage && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {actionMessage}
        </div>
      )}

      <section aria-label="Visitor summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending approval" value={loading ? "—" : stats.pending} icon={Clock3} hint="Waiting for a decision" />
        <MetricCard label="Currently inside" value={loading ? "—" : stats.checkedIn} icon={DoorOpen} hint="Visitors checked in" />
        <MetricCard label="Approved" value={loading ? "—" : stats.approved} icon={Check} hint="Approved visitor records" />
        <MetricCard label="Checked out" value={loading ? "—" : stats.checkedOut} icon={LogOut} hint="Completed visits" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <header className="border-b border-gray-100 px-5 py-4 sm:px-6">
          <h2 className="font-semibold text-[#08090A]">Pending entry requests</h2>
          <p className="mt-1 text-sm text-gray-500">
            Approve or reject visitors waiting at the gate.
          </p>
        </header>

        {loading ? (
          <div className="space-y-3 p-6" aria-label="Loading pending visitors">
            {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        ) : pendingVisitors.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Users size={20} />
            </span>
            <p className="mt-3 text-sm font-medium text-gray-800">No pending requests</p>
            <p className="mt-1 text-sm text-gray-500">New visitor requests will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3 p-4 sm:p-5">
            {pendingVisitors.map((visitor) => (
              <article
                key={visitor._id}
                className="grid gap-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-semibold text-gray-900">
                      {visitor.name}
                    </h3>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold capitalize text-amber-800">
                      {visitor.visitStatus.toLowerCase().replaceAll("_", " ")}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Purpose</dt>
                      <dd className="mt-1 break-words text-sm font-medium capitalize text-gray-900">{visitor.purpose.toLowerCase()}</dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Visiting</dt>
                      <dd className="mt-1 break-words text-sm font-medium text-gray-900">{visitor.resident?.name || "Resident not listed"}</dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Flat</dt>
                      <dd className="mt-1 break-words text-sm font-medium text-gray-900">{visitor.visitTo?.flatNumber || "—"}</dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Phone</dt>
                      <dd className="mt-1 break-words text-sm font-medium text-gray-900">{visitor.phoneNumber || "—"}</dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Email</dt>
                      <dd className="mt-1 break-all text-sm font-medium text-gray-900">{visitor.email || "—"}</dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Requested</dt>
                      <dd className="mt-1 break-words text-sm font-medium text-gray-900">{formatDate(visitor.createdAt)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                  <button
                    type="button"
                    onClick={() => void handleDecision(visitor._id, "approve")}
                    disabled={busyVisitorId === visitor._id}
                    className="inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded-md bg-[#0C8C5E] px-4 text-sm font-semibold text-white transition hover:bg-[#08764F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C8C5E] disabled:cursor-wait disabled:opacity-60"
                  >
                    {busyVisitorId === visitor._id ? <Clock3 size={16} /> : <LogIn size={16} />}
                    {busyVisitorId === visitor._id ? "Updating…" : "Approve entry"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDecision(visitor._id, "reject")}
                    disabled={busyVisitorId === visitor._id}
                    className="inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 disabled:cursor-wait disabled:opacity-60"
                  >
                    <X size={16} /> Reject entry
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
