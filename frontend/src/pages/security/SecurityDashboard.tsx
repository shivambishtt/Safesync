import { useEffect, useState } from "react";
import { ArrowUpRight, Clock3, DoorOpen, LogOut, Users } from "lucide-react";
import { Link } from "react-router-dom";
import {
  formatVisitorDate,
  getPendingVisitors,
  getVisitorHistory,
  getVisitorStats,
  type Visitor,
  type VisitorStats,
} from "./visitorApi";

const emptyStats: VisitorStats = {
  totalVisitors: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  checkedIn: 0,
  checkedOut: 0,
};

function isWaitingForResident(visitor: Visitor) {
  return (
    visitor.visitStatus === "PENDING" ||
    (visitor.visitStatus === "APPROVED" &&
      (!visitor.allowedBy?._id ||
        !visitor.resident?._id ||
        visitor.allowedBy._id !== visitor.resident._id))
  );
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
  const [recentVisitors, setRecentVisitors] = useState<Visitor[]>([]);
  const [visitorsToday, setVisitorsToday] = useState(0);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let current = true;

    const loadDashboard = async () => {
      const [pendingResult, statsResult, historyResult] =
        await Promise.allSettled([
          getPendingVisitors(),
          getVisitorStats(),
          getVisitorHistory(),
        ]);

      if (!current) return;

      if (pendingResult.status === "fulfilled") {
        setPendingVisitors(pendingResult.value.visitors ?? []);
      }
      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value ?? emptyStats);
      }
      if (historyResult.status === "fulfilled") {
        const visitors = historyResult.value;
        setRecentVisitors(visitors.slice(0, 5));
        const now = new Date();
        setVisitorsToday(
          visitors.filter((visitor) => {
            const createdAt = new Date(visitor.createdAt);
            return (
              createdAt.getFullYear() === now.getFullYear() &&
              createdAt.getMonth() === now.getMonth() &&
              createdAt.getDate() === now.getDate()
            );
          }).length,
        );
      }

      const errors = [
        pendingResult.status === "rejected"
          ? `Pending visitors: ${pendingResult.reason instanceof Error ? pendingResult.reason.message : "Request failed"}`
          : "",
        statsResult.status === "rejected"
          ? `Visitor stats: ${statsResult.reason instanceof Error ? statsResult.reason.message : "Request failed"}`
          : "",
        historyResult.status === "rejected"
          ? `Recent activity: ${historyResult.reason instanceof Error ? historyResult.reason.message : "Request failed"}`
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

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[#0C8C5E]">
            Security workspace
          </p>
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
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {loadError}
        </div>
      )}
      <section
        aria-label="Visitor summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Visitors today"
          value={loading ? "—" : visitorsToday}
          icon={Users}
          hint="Visitor records created today"
        />
        <MetricCard
          label="Pending approvals"
          value={loading ? "—" : stats.pending}
          icon={Clock3}
          hint="Waiting for a decision"
        />
        <MetricCard
          label="Currently inside"
          value={loading ? "—" : stats.checkedIn}
          icon={DoorOpen}
          hint="Visitors checked in"
        />
        <MetricCard
          label="Completed visits"
          value={loading ? "—" : stats.checkedOut}
          icon={LogOut}
          hint="Visitors checked out"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <header className="border-b border-gray-100 px-5 py-4 sm:px-6">
          <h2 className="font-semibold text-[#08090A]">
            Awaiting resident approval
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Security can check visitors in only after the flat resident
            approves.
          </p>
        </header>

        {loading ? (
          <div className="space-y-3 p-6" aria-label="Loading pending visitors">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        ) : pendingVisitors.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Users size={20} />
            </span>
            <p className="mt-3 text-sm font-medium text-gray-800">
              No pending requests
            </p>
            <p className="mt-1 text-sm text-gray-500">
              New visitor registrations waiting for a resident decision will
              appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-4 sm:p-5">
            {pendingVisitors.map((visitor) => (
              <article
                key={visitor._id}
                className="grid gap-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-semibold text-gray-900">
                      {visitor.name}
                    </h3>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold capitalize text-amber-800">
                      {isWaitingForResident(visitor)
                        ? "awaiting resident approval"
                        : visitor.visitStatus
                            .toLowerCase()
                            .replaceAll("_", " ")}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Purpose
                      </dt>
                      <dd className="mt-1 break-words text-sm font-medium capitalize text-gray-900">
                        {visitor.purpose.toLowerCase()}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Visiting
                      </dt>
                      <dd className="mt-1 break-words text-sm font-medium text-gray-900">
                        {visitor.resident?.name || "Resident not listed"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Flat
                      </dt>
                      <dd className="mt-1 break-words text-sm font-medium text-gray-900">
                        {visitor.visitTo?.flatNumber || "—"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Phone
                      </dt>
                      <dd className="mt-1 break-words text-sm font-medium text-gray-900">
                        {visitor.phoneNumber || "—"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Email
                      </dt>
                      <dd className="mt-1 break-all text-sm font-medium text-gray-900">
                        {visitor.email || "—"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Requested
                      </dt>
                      <dd className="mt-1 break-words text-sm font-medium text-gray-900">
                        {formatVisitorDate(visitor.createdAt)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                  Awaiting decision from{" "}
                  {visitor.resident?.name || "the flat resident"}. Refresh the
                  dashboard after the resident responds.
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold text-[#08090A]">
              Recent visitor activity
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Latest status changes across your society.
            </p>
          </div>
          <Link
            to="/security/history"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[#0C8C5E] hover:underline"
          >
            View history <ArrowUpRight size={15} />
          </Link>
        </header>
        {loading ? (
          <div
            className="space-y-3 p-5"
            aria-label="Loading recent visitor activity"
          >
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        ) : recentVisitors.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-gray-800">
              No visitor activity yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              New visitor records will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentVisitors.map((visitor) => (
              <div
                key={visitor._id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {visitor.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {visitor.purpose.toLowerCase()} ·{" "}
                    {visitor.resident?.name || "Resident unavailable"} ·{" "}
                    {visitor.visitTo?.block || ""}{" "}
                    {visitor.visitTo?.flatNumber || ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                    {visitor.visitStatus.toLowerCase().replaceAll("_", " ")}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatVisitorDate(visitor.updatedAt || visitor.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
