import { useEffect, useState } from "react";
import { Check, Clock3, LogIn, LogOut, X } from "lucide-react";

const API_BASE_URL = "http://localhost:3000/api/v1";

interface Visitor {
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
  visitTo?: { flatNumber?: string; block?: string } | null;
  resident?: { name?: string; email?: string; phoneNumber?: string } | null;
  allowedBy?: { name?: string } | null;
}

interface ApiResult<T> {
  success: boolean;
  message?: string;
  visitors?: T;
  totalVisitors?: number;
}

type VisitorAction = "approve" | "reject" | "check-in" | "check-out";

async function getVisitors(): Promise<Visitor[]> {
  const response = await fetch(`${API_BASE_URL}/history`, {
    credentials: "include",
  });
  const result = (await response.json()) as ApiResult<Visitor[]>;
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

function statusLabel(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}

function actionFor(status: string): VisitorAction | null {
  if (status === "PENDING") return "approve";
  if (status === "APPROVED") return "check-in";
  if (status === "CHECKED_IN") return "check-out";
  return null;
}

export default function SecurityVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let current = true;
    getVisitors()
      .then((items) => {
        if (current) setVisitors(items);
      })
      .catch((cause: unknown) => {
        if (current)
          setError(
            cause instanceof Error ? cause.message : "Could not load visitors.",
          );
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const updateStatus = async (visitorId: string, action: VisitorAction) => {
    setBusyId(visitorId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/${visitorId}/${action}`, {
        method: "PATCH",
        credentials: "include",
      });
      const result = (await response.json()) as {
        success: boolean;
        message?: string;
      };
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not update visitor status.");
      }
      const refreshed = await getVisitors();
      setVisitors(refreshed);
      setMessage(result.message || "Visitor status updated.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update visitor status.",
      );
    } finally {
      setBusyId("");
    }
  };

  const activeVisitors = visitors.filter((visitor) =>
    ["PENDING", "APPROVED", "CHECKED_IN"].includes(visitor.visitStatus),
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-[#0C8C5E]">Security workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">
          Visitors
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage pending entries and visitors currently moving through the gate.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {message}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <header className="border-b border-gray-100 px-5 py-4 sm:px-6">
          <h2 className="font-semibold text-gray-900">
            Active visitor records
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Pending, approved, and checked-in visitors.
          </p>
        </header>
        {loading ? (
          <div className="space-y-3 p-6" aria-label="Loading visitors">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        ) : activeVisitors.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-gray-800">
              No active visitors
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Pending or checked-in visitors will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-4 sm:p-5">
            {activeVisitors.map((visitor) => {
              const action = actionFor(visitor.visitStatus);
              return (
                <article
                  key={visitor._id}
                  className="rounded-xl border border-gray-200 p-4 sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-semibold text-gray-900">
                          {visitor.name}
                        </h3>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold capitalize text-gray-700">
                          {statusLabel(visitor.visitStatus)}
                        </span>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            Resident
                          </dt>
                          <dd className="mt-1 break-words text-sm font-medium text-gray-900">
                            {visitor.resident?.name || "—"}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            Flat
                          </dt>
                          <dd className="mt-1 break-words text-sm font-medium text-gray-900">
                            {`${visitor.visitTo?.block || ""} ${visitor.visitTo?.flatNumber || "—"}`.trim()}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            Phone
                          </dt>
                          <dd className="mt-1 break-words text-sm font-medium text-gray-900">
                            {visitor.phoneNumber}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            Email
                          </dt>
                          <dd className="mt-1 break-all text-sm font-medium text-gray-900">
                            {visitor.email || "—"}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            Purpose
                          </dt>
                          <dd className="mt-1 break-words text-sm font-medium capitalize text-gray-900">
                            {visitor.purpose.toLowerCase()}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            Check in
                          </dt>
                          <dd className="mt-1 break-words text-sm font-medium text-gray-900">
                            {formatDate(visitor.checkInTime)}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            Check out
                          </dt>
                          <dd className="mt-1 break-words text-sm font-medium text-gray-900">
                            {formatDate(visitor.checkoutTime)}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            Last updated
                          </dt>
                          <dd className="mt-1 break-words text-sm font-medium text-gray-900">
                            {formatDate(visitor.updatedAt || visitor.createdAt)}
                          </dd>
                        </div>
                      </dl>
                      {visitor.allowedBy?.name && (
                        <p className="mt-3 text-xs text-gray-500">
                          Approved by {visitor.allowedBy.name}
                        </p>
                      )}
                    </div>
                    {action && (
                      <div className="flex flex-wrap gap-2 xl:pt-1">
                        <button
                          type="button"
                          onClick={() => void updateStatus(visitor._id, action)}
                          disabled={busyId === visitor._id}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0C8C5E] px-4 text-sm font-semibold text-white hover:bg-[#08764F] disabled:opacity-60"
                        >
                          {busyId === visitor._id ? (
                            <Clock3 size={16} />
                          ) : action === "check-out" ? (
                            <LogOut size={16} />
                          ) : action === "check-in" ? (
                            <LogIn size={16} />
                          ) : (
                            <Check size={16} />
                          )}
                          {busyId === visitor._id
                            ? "Updating…"
                            : action === "check-out"
                              ? "Check out"
                              : action === "check-in"
                                ? "Check in"
                                : "Approve"}
                        </button>
                        {visitor.visitStatus === "PENDING" && (
                          <button
                            type="button"
                            onClick={() =>
                              void updateStatus(visitor._id, "reject")
                            }
                            disabled={busyId === visitor._id}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
                          >
                            <X size={16} /> Reject
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export function SecurityVisitorHistoryPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    getVisitors()
      .then((items) => {
        if (current) setVisitors(items);
      })
      .catch((cause: unknown) => {
        if (current)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load visitor history.",
          );
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-[#0C8C5E]">Security workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">
          Visitor History
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Visitor records sorted by their latest status update.
        </p>
      </header>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-6" aria-label="Loading visitor history">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-10 animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        ) : visitors.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-gray-800">
              No visitor history
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Visitor records will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  {[
                    "Visitor",
                    "Phone",
                    "Email",
                    "Resident",
                    "Flat",
                    "Purpose",
                    "Current status",
                    "Approved by",
                    "Created",
                    "Check in",
                    "Check out",
                    "Last updated",
                  ].map((heading) => (
                    <th key={heading} className="px-4 py-3.5">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visitors.map((visitor) => (
                  <tr
                    key={visitor._id}
                    className="text-gray-700 hover:bg-gray-50/70"
                  >
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {visitor.name}
                    </td>
                    <td className="px-4 py-4">{visitor.phoneNumber || "—"}</td>
                    <td className="px-4 py-4">{visitor.email || "—"}</td>
                    <td className="px-4 py-4">
                      {visitor.resident?.name || "—"}
                    </td>
                    <td className="px-4 py-4">
                      {`${visitor.visitTo?.block || ""} ${visitor.visitTo?.flatNumber || "—"}`.trim()}
                    </td>
                    <td className="px-4 py-4 capitalize">
                      {visitor.purpose.toLowerCase()}
                    </td>
                    <td className="px-4 py-4 capitalize">
                      {statusLabel(visitor.visitStatus)}
                    </td>
                    <td className="px-4 py-4">
                      {visitor.allowedBy?.name || "—"}
                    </td>
                    <td className="px-4 py-4">
                      {formatDate(visitor.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      {formatDate(visitor.checkInTime)}
                    </td>
                    <td className="px-4 py-4">
                      {formatDate(visitor.checkoutTime)}
                    </td>
                    <td className="px-4 py-4">
                      {formatDate(visitor.updatedAt || visitor.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
