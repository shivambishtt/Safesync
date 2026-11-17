import { useEffect, useState } from "react";
import { Clock3, Users } from "lucide-react";
import {
  getSocietyAttendance,
  type AttendanceResponse,
  type GuardAttendance,
} from "../security/attendanceApi";

const API_BASE_URL = "http://localhost:3000/api/v1";
interface Guard {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function shiftDuration(record: GuardAttendance) {
  if (!record.checkedOutAt) return "On shift";
  const milliseconds =
    new Date(record.checkedOutAt).getTime() -
    new Date(record.checkedInAt).getTime();
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return "—";
  return `${Math.floor(milliseconds / 3_600_000)}h ${Math.floor((milliseconds % 3_600_000) / 60_000)}m`;
}

export default function SecretaryAttendancePage() {
  const [guards, setGuards] = useState<Guard[]>([]);
  const [records, setRecords] = useState<GuardAttendance[]>([]);
  const [guardId, setGuardId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/security/guards`, { credentials: "include" })
      .then(async (response) => {
        const result = (await response.json()) as {
          success?: boolean;
          message?: string;
          guards?: Guard[];
        };
        if (!response.ok || !result.success)
          throw new Error(result.message || "Could not load guards.");
        return result.guards ?? [];
      })
      .then((items) => {
        if (active) setGuards(items);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Could not load guards.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getSocietyAttendance({ guardId, from, to, page, limit: 20 })
      .then((result) => {
        if (!active) return;
        const data = result as AttendanceResponse;
        setRecords(data.attendances ?? []);
        setTotalPages(Math.max(data.pagination?.totalPages ?? 0, 1));
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load attendance.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [guardId, from, to, page]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-[#0C8C5E]">
          Secretary workspace
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">
          Security Guard Attendance
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Review recorded shift check-ins and check-outs for your society.
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
        <div className="grid gap-3 border-b border-gray-100 p-4 sm:grid-cols-3">
          <label className="text-xs font-medium text-gray-500">
            Guard
            <select
              aria-label="Filter by guard"
              value={guardId}
              onChange={(event) => {
                setGuardId(event.target.value);
                setPage(1);
              }}
              className="mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800"
            >
              <option value="">All guards</option>
              {guards.map((guard) => (
                <option key={guard._id} value={guard._id}>
                  {guard.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-gray-500">
            From
            <input
              aria-label="Attendance from date"
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
              className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-800"
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            To
            <input
              aria-label="Attendance to date"
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
              className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-800"
            />
          </label>
        </div>
        {loading ? (
          <div className="space-y-3 p-5" aria-label="Loading guard attendance">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-[#0C8C5E]">
              <Users size={20} />
            </span>
            <p className="mt-3 text-sm font-semibold text-gray-900">
              No attendance records found
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Adjust the filters or check back after a guard checks in.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Security guard</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Checked in</th>
                    <th className="px-5 py-3">Checked out</th>
                    <th className="px-5 py-3">Duration / status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((record) => {
                    const guard =
                      typeof record.guard === "object"
                        ? record.guard
                        : undefined;
                    return (
                      <tr key={record._id}>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">
                            {guard?.name ?? "Security guard"}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {guard?.email ?? "—"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {guard?.phoneNumber ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {formatDate(record.checkedInAt)}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {formatDate(record.checkedOutAt)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${record.checkedOutAt ? "bg-gray-100 text-gray-700" : "bg-emerald-50 text-emerald-800"}`}
                          >
                            {!record.checkedOutAt && <Clock3 size={13} />}
                            {shiftDuration(record)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-gray-100 md:hidden">
              {records.map((record) => {
                const guard =
                  typeof record.guard === "object" ? record.guard : undefined;
                return (
                  <article key={record._id} className="space-y-3 p-4">
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {guard?.name ?? "Security guard"}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {guard?.phoneNumber ?? "—"}
                      </p>
                    </div>
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-xs text-gray-500">Checked in</dt>
                        <dd className="mt-1 text-gray-800">
                          {formatDate(record.checkedInAt)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Checked out</dt>
                        <dd className="mt-1 text-gray-800">
                          {formatDate(record.checkedOutAt)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">
                          Duration / status
                        </dt>
                        <dd className="mt-1 font-medium text-gray-800">
                          {shiftDuration(record)}
                        </dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-600">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((value) => value + 1)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
