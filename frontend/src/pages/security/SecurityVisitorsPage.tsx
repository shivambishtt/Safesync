import { useEffect, useState, type FormEvent } from "react";
import { Clock3, LogIn, LogOut, RefreshCw, UserPlus } from "lucide-react";
import {
  formatVisitorDate,
  getVisitorDestinations,
  getVisitorHistory,
  registerVisitor,
  updateVisitorStatus,
  visitorStatusLabel,
  type Visitor,
  type VisitorAction,
  type VisitorDestination,
} from "./visitorApi";

function residentApprovalPending(visitor: Visitor) {
  return (
    visitor.visitStatus === "PENDING" ||
    (visitor.visitStatus === "APPROVED" &&
      (!visitor.allowedBy?._id ||
        !visitor.resident?._id ||
        visitor.allowedBy._id !== visitor.resident._id))
  );
}

function actionFor(visitor: Visitor): VisitorAction | null {
  if (visitor.visitStatus === "APPROVED" && !residentApprovalPending(visitor))
    return "check-in";
  if (visitor.visitStatus === "CHECKED_IN") return "check-out";
  return null;
}

export default function SecurityVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [destinations, setDestinations] = useState<VisitorDestination[]>([]);
  const [destinationLoading, setDestinationLoading] = useState(true);
  const [destinationError, setDestinationError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("GUEST");
  const [flatId, setFlatId] = useState("");

  useEffect(() => {
    let current = true;
    getVisitorHistory()
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
    getVisitorDestinations()
      .then((items) => {
        if (current) setDestinations(items);
      })
      .catch((cause: unknown) => {
        if (current)
          setDestinationError(
            cause instanceof Error
              ? cause.message
              : "Could not load flat destinations.",
          );
      })
      .finally(() => {
        if (current) setDestinationLoading(false);
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
      const result = await updateVisitorStatus(visitorId, action);
      const refreshed = await getVisitorHistory();
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

  const refreshVisitorList = async () => {
    setRefreshing(true);
    setError("");
    try {
      setVisitors(await getVisitorHistory());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not refresh visitor records.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const destination = destinations.find((item) => item._id === flatId);
    if (!destination) {
      setError("Select a flat with a resident before registering the visitor.");
      return;
    }

    setRegistering(true);
    setError("");
    setMessage("");
    try {
      const result = await registerVisitor({
        name: visitorName.trim(),
        phoneNumber: phoneNumber.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
        purpose,
        visitTo: destination._id,
        resident: destination.resident._id,
      });
      setVisitorName("");
      setPhoneNumber("");
      setEmail("");
      setPurpose("GUEST");
      setFlatId("");
      setVisitors(await getVisitorHistory());
      setMessage(result.message || "Visitor registered and awaiting approval.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not register visitor.",
      );
    } finally {
      setRegistering(false);
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
          Register visitors, verify resident approvals, and manage gate entry
          and exit.
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

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0C8C5E]/10 text-[#0C8C5E]">
            <UserPlus size={19} />
          </span>
          <div>
            <h2 className="font-semibold text-gray-900">Register a visitor</h2>
            <p className="mt-1 text-sm text-gray-500">
              Register the visitor at the gate. The flat’s resident must approve
              before check-in.
            </p>
          </div>
        </div>
        {destinationError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          >
            {destinationError}
          </div>
        )}
        {!destinationLoading &&
          destinations.length === 0 &&
          !destinationError && (
            <p className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
              No occupied flats with linked residents are available for visitor
              registration.
            </p>
          )}
        <form
          onSubmit={handleRegistration}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-gray-700">
              Visitor name
            </span>
            <input
              required
              value={visitorName}
              onChange={(event) => setVisitorName(event.target.value)}
              maxLength={100}
              autoComplete="name"
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#0C8C5E] focus:ring-2 focus:ring-[#0C8C5E]/15"
              placeholder="Full name"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-gray-700">
              Phone number
            </span>
            <input
              required
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              maxLength={20}
              inputMode="tel"
              autoComplete="tel"
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#0C8C5E] focus:ring-2 focus:ring-[#0C8C5E]/15"
              placeholder="Visitor phone"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-gray-700">
              Email{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#0C8C5E] focus:ring-2 focus:ring-[#0C8C5E]/15"
              placeholder="name@example.com"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-gray-700">
              Purpose of visit
            </span>
            <select
              required
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#0C8C5E]"
            >
              <option value="GUEST">Guest</option>
              <option value="SERVICE">Service</option>
              <option value="DELIVERY">Delivery</option>
              <option value="SALES">Sales</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-gray-700">
              Flat and resident
            </span>
            <select
              required
              value={flatId}
              onChange={(event) => setFlatId(event.target.value)}
              disabled={destinationLoading || destinations.length === 0}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#0C8C5E] disabled:bg-gray-50"
            >
              <option value="">
                {destinationLoading ? "Loading flats…" : "Select flat"}
              </option>
              {destinations.map((destination) => (
                <option key={destination._id} value={destination._id}>
                  {destination.block} · {destination.flatNumber} —{" "}
                  {destination.resident.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={
                registering || destinationLoading || destinations.length === 0
              }
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#0C8C5E] px-4 text-sm font-semibold text-white transition hover:bg-[#08764F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus size={16} />
              {registering ? "Registering…" : "Register visitor"}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold text-gray-900">
              Active visitor records
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Waiting for resident approval, approved, and checked-in visitors.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshVisitorList()}
            disabled={refreshing}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
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
              const action = actionFor(visitor);
              const waitingForResident = residentApprovalPending(visitor);
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
                          {waitingForResident
                            ? "awaiting resident approval"
                            : visitorStatusLabel(visitor.visitStatus)}
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
                            {formatVisitorDate(visitor.checkInTime)}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            Check out
                          </dt>
                          <dd className="mt-1 break-words text-sm font-medium text-gray-900">
                            {formatVisitorDate(visitor.checkoutTime)}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            Last updated
                          </dt>
                          <dd className="mt-1 break-words text-sm font-medium text-gray-900">
                            {formatVisitorDate(
                              visitor.updatedAt || visitor.createdAt,
                            )}
                          </dd>
                        </div>
                      </dl>
                      {visitor.allowedBy?.name && (
                        <p className="mt-3 text-xs text-gray-500">
                          Resident approval by {visitor.allowedBy.name}
                        </p>
                      )}
                      {waitingForResident && (
                        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                          Waiting for {visitor.resident?.name || "the resident"}{" "}
                          to approve. Security check-in is disabled until
                          approval.
                        </p>
                      )}
                      {visitor.visitStatus === "REJECTED" &&
                        visitor.rejectedBy?.name && (
                          <p className="mt-3 text-xs text-gray-500">
                            Rejected by {visitor.rejectedBy.name}
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
                          ) : (
                            <LogIn size={16} />
                          )}
                          {busyId === visitor._id
                            ? "Updating…"
                            : action === "check-out"
                              ? "Check out"
                              : "Check in"}
                        </button>
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
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    getVisitorHistory()
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

  const dateToExclusive = dateTo ? new Date(`${dateTo}T00:00:00`) : null;
  if (dateToExclusive) dateToExclusive.setDate(dateToExclusive.getDate() + 1);

  const filteredVisitors = visitors.filter((visitor) => {
    const query = search.trim().toLowerCase();
    const textMatches =
      !query ||
      [
        visitor.name,
        visitor.phoneNumber,
        visitor.email,
        visitor.resident?.name,
        visitor.visitTo?.flatNumber,
        visitor.visitTo?.block,
        visitor.purpose,
        visitor.visitStatus,
      ].some((value) => value?.toLowerCase().includes(query));
    const statusMatches = status === "ALL" || visitor.visitStatus === status;
    const createdAt = new Date(visitor.createdAt);
    const fromMatches =
      !dateFrom || createdAt >= new Date(`${dateFrom}T00:00:00`);
    const toMatches = !dateToExclusive || createdAt < dateToExclusive;
    return textMatches && statusMatches && fromMatches && toMatches;
  });

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
      <section
        aria-label="Filter visitor history"
        className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4"
      >
        <label className="space-y-1.5 sm:col-span-2 xl:col-span-1">
          <span className="text-xs font-medium text-gray-600">Search</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, phone, flat, resident…"
            className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#0C8C5E]"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-gray-600">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#0C8C5E]"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CHECKED_IN">Checked in</option>
            <option value="CHECKED_OUT">Checked out</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-gray-600">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#0C8C5E]"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-gray-600">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#0C8C5E]"
          />
        </label>
      </section>
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
        ) : filteredVisitors.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-gray-800">
              No matching visitor records
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Adjust the search or filters and try again.
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
                {filteredVisitors.map((visitor) => (
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
                      {visitorStatusLabel(visitor.visitStatus)}
                    </td>
                    <td className="px-4 py-4">
                      {visitor.allowedBy?.name || "—"}
                    </td>
                    <td className="px-4 py-4">
                      {formatVisitorDate(visitor.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      {formatVisitorDate(visitor.checkInTime)}
                    </td>
                    <td className="px-4 py-4">
                      {formatVisitorDate(visitor.checkoutTime)}
                    </td>
                    <td className="px-4 py-4">
                      {formatVisitorDate(
                        visitor.updatedAt || visitor.createdAt,
                      )}
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
