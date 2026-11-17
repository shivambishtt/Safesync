import { useEffect, useState } from "react";
import { CalendarClock, Clock3, LogIn, LogOut } from "lucide-react";
import {
  checkInToShift,
  checkOutFromShift,
  getMyAttendance,
  type AttendanceResponse,
  type GuardAttendance,
} from "./attendanceApi";

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

function duration(start: string, end?: string | null) {
  const milliseconds =
    (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return "—";
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m${end ? "" : " · active"}`;
}

export default function SecurityAttendancePage() {
  const [records, setRecords] = useState<GuardAttendance[]>([]);
  const [activeShift, setActiveShift] = useState<GuardAttendance | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadAttendance() {
    setLoading(true);
    setError("");
    try {
      const result = (await getMyAttendance({
        page,
        limit: 10,
        from,
        to,
      })) as AttendanceResponse;
      setRecords(result.attendances ?? []);
      setActiveShift(result.activeAttendance ?? null);
      setTotalPages(Math.max(result.pagination?.totalPages ?? 0, 1));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load attendance.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAttendance();
  }, [page, from, to]);

  async function recordAction(action: "check-in" | "check-out") {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result =
        action === "check-in"
          ? await checkInToShift()
          : await checkOutFromShift();
      setMessage(
        result.message ??
          (action === "check-in"
            ? "Shift check-in recorded."
            : "Shift check-out recorded."),
      );
      await loadAttendance();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not record attendance.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-[#0C8C5E]">Security workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">
          My Attendance
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Record your shift start and finish. Times are recorded by the server.
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
      <section className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${activeShift ? "bg-emerald-50 text-[#0C8C5E]" : "bg-gray-100 text-gray-500"}`}
          >
            <CalendarClock size={22} />
          </span>
          <div>
            <p className="text-sm font-medium text-gray-500">Current shift</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">
              {activeShift ? "Checked in" : "Not checked in"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {activeShift
                ? `Started ${formatDate(activeShift.checkedInAt)} · ${duration(activeShift.checkedInAt)}`
                : "Check in when your shift starts."}
            </p>
          </div>
        </div>
        <button
          disabled={busy || loading}
          onClick={() =>
            void recordAction(activeShift ? "check-out" : "check-in")
          }
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${activeShift ? "bg-gray-800 hover:bg-gray-700" : "bg-[#0C8C5E] hover:bg-[#08764F]"}`}
        >
          {activeShift ? <LogOut size={17} /> : <LogIn size={17} />}
          {busy
            ? "Recording…"
            : activeShift
              ? "Check out of shift"
              : "Check in to shift"}
        </button>
      </section>
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Attendance history</h2>
            <p className="mt-1 text-sm text-gray-500">
              Your recorded shift check-ins and check-outs.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-gray-500">
              From
              <input
                aria-label="Attendance from date"
                type="date"
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPage(1);
                }}
                className="mt-1 block h-9 rounded-md border border-gray-300 px-2 text-sm text-gray-800"
              />
            </label>
            <label className="text-xs text-gray-500">
              To
              <input
                aria-label="Attendance to date"
                type="date"
                value={to}
                onChange={(event) => {
                  setTo(event.target.value);
                  setPage(1);
                }}
                className="mt-1 block h-9 rounded-md border border-gray-300 px-2 text-sm text-gray-800"
              />
            </label>
          </div>
        </div>
        {loading ? (
          <div className="space-y-3 p-5" aria-label="Loading attendance">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Clock3 size={20} />
            </span>
            <p className="mt-3 text-sm font-semibold text-gray-900">
              No attendance records
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Your shift records will appear here after you check in.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {records.map((record) => (
                <article
                  key={record._id}
                  className="grid gap-3 px-5 py-4 sm:grid-cols-3 sm:items-center"
                >
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Checked in
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatDate(record.checkedInAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Checked out
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatDate(record.checkedOutAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Shift duration
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {duration(record.checkedInAt, record.checkedOutAt)}
                    </p>
                  </div>
                </article>
              ))}
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
